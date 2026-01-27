import db from "../../../config/db";
import { ValidationError } from "../../../utils/errors";
import { parseSmartSerial } from "../../../utils/serialHelper";
import { ActivityLogService } from "../../activity-log/service";

export class StockInFwcService {
  /**
   * Stock In
   */
  static async createStockIn(
    movementAt: Date,
    cardProductId: string,
    startSerial: string,
    endSerial: string,
    userId: string,
    note?: string | null,
  ) {
    // 1. Validasi Input: Pastikan HANYA angka (bukan full serial number) - Relaxed for Smart Parsing
    if (!/^\d+$/.test(startSerial) || !/^\d+$/.test(endSerial)) {
      if (/[a-zA-Z]/.test(startSerial) || /[a-zA-Z]/.test(endSerial)) {
        throw new ValidationError("Input harus berupa angka.");
      }
      throw new ValidationError(
        "startSerial dan endSerial harus berupa digit string (angka saja).",
      );
    }

    const transaction = await db.$transaction(async (tx) => {
      const product = await tx.cardProduct.findUnique({
        where: { id: cardProductId },
        select: {
          id: true,
          serialTemplate: true,
          totalQuota: true,
          masaBerlaku: true,
          price: true,
          categoryId: true,
          typeId: true,
        },
      });

      if (!product) {
        throw new ValidationError(
          "CardProduct untuk kategori/tipe ini tidak ditemukan",
        );
      }

      const { categoryId, typeId } = product;

      // --- SMART PARSING ---
      const yearSuffix = new Date(movementAt)
        .getFullYear()
        .toString()
        .slice(-2);
      const startNum = parseSmartSerial(
        startSerial,
        product.serialTemplate,
        yearSuffix,
      );
      const endNum = parseSmartSerial(
        endSerial,
        product.serialTemplate,
        yearSuffix,
      );
      // ---------------------

      if (!Number.isSafeInteger(startNum) || !Number.isSafeInteger(endNum)) {
        throw new ValidationError("Nomor serial terlalu besar");
      }

      if (endNum < startNum) {
        throw new ValidationError(
          "endSerial harus lebih besar atau sama dengan startSerial",
        );
      }

      const quantity = endNum - startNum + 1;

      if (quantity > 10000) {
        throw new ValidationError("Maksimal produksi 10.000 kartu per batch");
      }

      const width = 5; // Fixed 5-digit padding as requested
      const endSerialFormatted = String(endNum).padStart(width, "0");

      // 2) Generate suffix serial berurutan
      const suffixSerials = Array.from({ length: quantity }, (_, i) =>
        String(startNum + i).padStart(width, "0"),
      );

      // 3) Bentuk serialNumber final: serialTemplate + YY + suffix
      const serialNumbers = suffixSerials.map(
        (sfx) => `${product.serialTemplate}${yearSuffix}${sfx}`,
      );

      // 4) Validasi Kartu SUDAH DI-GENERATE (Status: ON_REQUEST)
      // Logikanya berubah: Dulu cek existing -> error. Sekarang cek existing -> harus ada & status ON_REQUEST.
      const existingCards = await tx.card.findMany({
        where: {
          serialNumber: { in: serialNumbers },
          cardProductId: product.id,
        },
        select: { id: true, serialNumber: true, status: true },
      });

      // a. Cek jumlah
      if (existingCards.length !== serialNumbers.length) {
        const foundSerials = new Set(existingCards.map((c) => c.serialNumber));
        const missing = serialNumbers.filter((s) => !foundSerials.has(s));
        throw new ValidationError(
          `Nomor serial tersebut belum digenerate: ${missing
            .slice(0, 3)
            .join(", ")}${missing.length > 3 ? "..." : ""}`,
        );
      }

      // b. Cek status (Harus ON_REQUEST atau mungkin boleh IN_OFFICE jika re-stock?
      // Asumsi strict flow: Generate -> StockIn. Jika sudah IN_OFFICE berarti duplikat stock in?)
      // Kita anggap hanya boleh ON_REQUEST.
      const invalidStatus = existingCards.filter(
        (c) => c.status !== "ON_REQUEST",
      );
      if (invalidStatus.length > 0) {
        throw new ValidationError(
          `Beberapa kartu memiliki status tidak valid (bukan ON_REQUEST): ${invalidStatus[0].serialNumber} (${invalidStatus[0].status}).`,
        );
      }

      // 5) Update Status Kartu menjadi IN_OFFICE
      // Karena kita sudah validasi semua cards ada dan status ok, kita bisa updateMany by serialNumbers
      await tx.card.updateMany({
        where: {
          cardProductId: product.id,
          serialNumber: { in: serialNumbers },
        },
        data: {
          status: "IN_OFFICE",
          updatedBy: userId,
          updatedAt: new Date(),
        },
      });

      // 6) Catat stock movement IN
      const formattedStartSerial = String(startNum).padStart(width, "0");
      const movement = await tx.cardStockMovement.create({
        data: {
          movementAt: new Date(movementAt),
          movementType: "IN",
          status: "APPROVED",
          categoryId,
          typeId,
          stationId: null,
          quantity,
          sentSerialNumbers: [], // Consistency: IN should have received
          receivedSerialNumbers: serialNumbers,
          lostSerialNumbers: [],
          note:
            note ??
            `Batch ${product.serialTemplate}${yearSuffix}${formattedStartSerial} - ${product.serialTemplate}${yearSuffix}${endSerialFormatted}`,
          createdAt: new Date(),
          createdBy: userId,
          updatedAt: new Date(),
          updatedBy: userId,
        },
      });

      /* REMOVED: CardInventory update (Deprecated) */

      // 7. Activity Log
      await ActivityLogService.createActivityLog(
        userId,
        "CREATE_STOCK_IN_FWC",
        `Stock In FWC Batch: ${quantity} pcs for serial ${product.serialTemplate}${yearSuffix}${formattedStartSerial} - ${endSerialFormatted}`,
      );

      return {
        movementId: movement.id,
        startSerial: formattedStartSerial,
        endSerial: endSerialFormatted,
        quantity,
        startSerialNumber: `${product.serialTemplate}${yearSuffix}${formattedStartSerial}`,
        endSerialNumber: `${product.serialTemplate}${yearSuffix}${endSerialFormatted}`,
      };
    });

    return transaction;
  }

  /**
   * Get History
   */
  static async getHistory(params: {
    page?: number;
    limit?: number;
    startDate?: Date;
    endDate?: Date;
    categoryId?: string;
    typeId?: string;
    categoryName?: string;
    typeName?: string;
  }) {
    const { page = 1, limit = 10, startDate, endDate, categoryId } = params;
    const skip = (page - 1) * limit;

    const where: any = {
      movementType: "IN",
    };

    if (startDate && endDate) {
      where.movementAt = {
        gte: startDate,
        lte: endDate,
      };
    } else if (startDate) {
      where.movementAt = {
        gte: startDate,
      };
    } else if (endDate) {
      where.movementAt = {
        lte: endDate,
      };
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (params.typeId) {
      where.typeId = params.typeId;
    }

    if (params.categoryName) {
      where.category = {
        categoryName: {
          contains: params.categoryName,
          mode: "insensitive",
        },
      };
    }

    if (params.typeName) {
      where.type = {
        typeName: {
          contains: params.typeName,
          mode: "insensitive",
        },
      };
    }

    const [items, total] = await Promise.all([
      db.cardStockMovement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { movementAt: "desc" },
        include: {
          category: true,
          type: true,
        },
      }),
      db.cardStockMovement.count({ where }),
    ]);

    // Map creator name manually (or use relation if User relation exists in movement)
    // Assuming 'createdBy' is UUID, we might want to fetch user names in a real app
    // For now, we return 'System' or fetch users if needed.
    // Optimization: Fetch unique user IDs and map names.

    const userIds = [...new Set(items.map((i) => i.createdBy).filter(Boolean))];
    const users = await db.user.findMany({
      where: { id: { in: userIds as string[] } },
      select: { id: true, fullName: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u.fullName]));

    const mappedItems = items.map((item) => ({
      id: item.id,
      movementAt: item.movementAt.toISOString(),
      movementType: item.movementType,
      quantity: item.quantity,
      status: item.status,
      batchId: item.batchId,
      note: item.note,
      createdByName: item.createdBy
        ? userMap.get(item.createdBy) || null
        : null,
      cardCategory: {
        id: item.category.id,
        name: item.category.categoryName,
        code: item.category.categoryCode,
      },
      cardType: {
        id: item.type.id,
        name: item.type.typeName,
        code: item.type.typeCode,
      },
      sentSerialNumbers: item.sentSerialNumbers,
    }));

    return {
      items: mappedItems,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get Detail
   */
  static async getDetail(id: string) {
    const movement = await db.cardStockMovement.findUnique({
      where: { id },
      include: {
        category: true,
        type: true,
      },
    });

    if (!movement) {
      throw new ValidationError("Data tidak ditemukan");
    }

    if (movement.movementType !== "IN") {
      throw new ValidationError("Bukan transaksi Stock In");
    }

    let createdByName: string | null = null;
    if (movement.createdBy) {
      const user = await db.user.findUnique({
        where: { id: movement.createdBy },
        select: { fullName: true },
      });
      createdByName = user?.fullName || null;
    }

    return {
      movement: {
        id: movement.id,
        movementAt: movement.movementAt.toISOString(),
        movementType: movement.movementType,
        quantity: movement.quantity,
        status: movement.status,
        batchId: movement.batchId,
        note: movement.note,
        createdAt: movement.createdAt.toISOString(),
        createdByName,
        cardCategory: {
          id: movement.category.id,
          name: movement.category.categoryName,
          code: movement.category.categoryCode,
        },
        cardType: {
          id: movement.type.id,
          name: movement.type.typeName,
          code: movement.type.typeCode,
        },
        sentSerialNumbers: movement.sentSerialNumbers as string[], // Keep original array for reference
        items: await (async () => {
          const serials = (movement as any).sentSerialNumbers as string[];
          if (!serials?.length) return [];
          const cards = await db.card.findMany({
            where: { serialNumber: { in: serials } },
            select: { serialNumber: true, status: true },
          });
          const statusMap = new Map(
            cards.map((c) => [c.serialNumber, c.status]),
          );
          return serials.map((sn) => ({
            serialNumber: sn,
            status: statusMap.get(sn) || "UNKNOWN",
          }));
        })(),
      },
    };
  }

  /**
   * Update Stock In (Restricted)
   */
  /**
   * Update Stock In (Strict Rules)
   * Hanya mengizinkan edit jika:
   * 1. Nomor serial awal tetap sequential (menyambung dengan batch sebelumnya dari produk yang sama).
   * 2. Range baru tidak tabrakan dengan batch lain.
   * 3. Jika mengurangi quantity/menggeser range, kartu yang dibuang HARUS masih IN_OFFICE.
   */
  static async update(
    id: string,
    body: {
      movementAt?: string;
      startSerial: string;
      endSerial: string;
      note?: string;
    },
    userId: string,
  ) {
    const { startSerial, endSerial, movementAt, note } = body;

    // 1. Validasi Input Dasar
    // 1. Validasi Input Dasar
    if (!/^\d+$/.test(startSerial) || !/^\d+$/.test(endSerial)) {
      throw new ValidationError(
        "startSerial dan endSerial harus berupa digit string (angka saja).",
      );
    }

    // 2. Transaksi Update
    const result = await db.$transaction(async (tx) => {
      const movement = await tx.cardStockMovement.findUnique({
        where: { id },
      });

      if (!movement) {
        throw new ValidationError("Data tidak ditemukan");
      }
      if (movement.movementType !== "IN") {
        throw new ValidationError("Bukan transaksi Stock In");
      }

      // Fetch Product Info
      const product = await tx.cardProduct.findUnique({
        where: {
          unique_category_type: {
            categoryId: movement.categoryId,
            typeId: movement.typeId,
          },
        },
      });

      if (!product) {
        throw new ValidationError("Produk tidak ditemukan");
      }

      // --- SMART PARSING ---
      const yearSuffix = new Date(movementAt || movement.movementAt)
        .getFullYear()
        .toString()
        .slice(-2);

      const newStartNum = parseSmartSerial(
        startSerial,
        product.serialTemplate,
        yearSuffix,
      );
      const newEndNum = parseSmartSerial(
        endSerial,
        product.serialTemplate,
        yearSuffix,
      );
      // ---------------------

      if (newEndNum < newStartNum) {
        throw new ValidationError(
          "endSerial harus lebih besar atau sama dengan startSerial",
        );
      }

      const newQuantity = newEndNum - newStartNum + 1;
      if (newQuantity > 10000) {
        throw new ValidationError("Maksimal produksi 10.000 kartu per batch");
      }

      // 3. Validasi Serial Sequential (Strict Rule)
      // Cari kartu terakhir dari produk ini yang BUKAN berasal dari batch ini.
      // Tujuannya untuk memastikan startSerial baru = maxSerialLain + 1
      const otherLastCard = await tx.card.findFirst({
        where: {
          cardProductId: product.id,
          // Exclude kartu-kartu dari batch ini (berdasarkan sentSerialNumbers lama)
          serialNumber: {
            notIn: (movement as any).sentSerialNumbers as string[],
          },
        },
        orderBy: { serialNumber: "desc" },
      });

      // Parse suffix dari serial number terakhir yang ada
      let expectedStartNum = 1;
      if (otherLastCard) {
        // Asumsi format: Template + YY + Suffix(5 digit)
        // Kita ambil 5 digit terakhir
        const suffix = otherLastCard.serialNumber.slice(-5);
        if (/^\d+$/.test(suffix)) {
          expectedStartNum = Number(suffix) + 1;
        }
      }

      // JIKA ada kartu lain sebelumnya, kita enforce sequential.
      // Jika tidak ada kartu lain (ini batch pertama), bebaskan startNum (biasanya 1, tapi user mungkin mau custom).
      // Note: User minta "harus tetap berurutan". Jadi kita enforce jika expected > 1.
      if (otherLastCard && newStartNum !== expectedStartNum) {
        throw new ValidationError(
          `Nomor serial awal harus berurutan. Serial terakhir di sistem: ${otherLastCard.serialNumber}. Start serial baru harus suffix ${expectedStartNum}.`,
        );
      }

      // 4. Generate All New Serials
      const width = 5;

      const newSuffixSerials = Array.from({ length: newQuantity }, (_, i) =>
        String(newStartNum + i).padStart(width, "0"),
      );
      const newSerialNumbers = newSuffixSerials.map(
        (sfx) => `${product.serialTemplate}${yearSuffix}${sfx}`,
      );

      // 5. Diffing Strategy
      const oldSerials = (movement as any).sentSerialNumbers as string[];
      const oldSet = new Set(oldSerials);
      const newSet = new Set(newSerialNumbers);

      const toAdd = newSerialNumbers.filter((s) => !oldSet.has(s));
      const toDelete = oldSerials.filter((s) => !newSet.has(s));
      // const toKeep = oldSerials.filter((s) => newSet.has(s));

      // 6. Execute Delete (Strict Validation)
      if (toDelete.length > 0) {
        const cardsToDelete = await tx.card.findMany({
          where: { serialNumber: { in: toDelete } },
          select: { id: true, status: true, serialNumber: true },
        });

        // Validasi: Semua yang mau dihapus harus status IN_OFFICE
        const notSafe = cardsToDelete.filter((c) => c.status !== "IN_OFFICE");
        if (notSafe.length > 0) {
          throw new ValidationError(
            `Gagal update range! Kartu berikut sudah tidak di office: ${notSafe
              .map((c) => c.serialNumber)
              .join(", ")}`,
          );
        }

        // Validasi Jumlah: Pastikan data konsisten
        // (Opsional, tapi good practice)

        await tx.card.deleteMany({
          where: { id: { in: cardsToDelete.map((c) => c.id) } },
        });
      }

      // 7. Execute Add (Check Unique)
      if (toAdd.length > 0) {
        // Cek apakah serial baru tabrakan dengan batch LAIN (bukan batch ini, karena batch ini yg lama sudah di-exclude dari logic 'toAdd' via diffing,
        // tapi kita perlu cek ke global card table untuk memastikan tidak ada duplikat dengan batch lain).
        const collision = await tx.card.findFirst({
          where: { serialNumber: { in: toAdd } },
        });

        if (collision) {
          throw new ValidationError(
            `Serial clash! Nomor ${collision.serialNumber} sudah ada di batch lain.`,
          );
        }

        await tx.card.createMany({
          data: toAdd.map((sn) => ({
            serialNumber: sn,
            cardProductId: product.id,
            quotaTicket: product.totalQuota,
            status: "IN_OFFICE",
            createdBy: userId,
          })),
        });
      }

      // 8. Update Inventory
      // Hitung selisih Quantity
      // Old Qty = oldSerials.length
      // New Qty = newQuantity
      // Delta = New - Old
      const delta = newQuantity - movement.quantity; // Atau newQuantity - oldSerials.length

      if (delta !== 0) {
        /* REMOVED: CardInventory update (Deprecated) */
      }

      // 9. Update Movement Record
      const formattedStartSerial = String(newStartNum).padStart(width, "0");
      const endSerialFormatted = String(newEndNum).padStart(width, "0");

      const updatedMovement = await tx.cardStockMovement.update({
        where: { id },
        data: {
          movementAt: movementAt ? new Date(movementAt) : undefined,
          quantity: newQuantity,
          sentSerialNumbers: newSerialNumbers, // Replace full array with new range
          note:
            note ??
            `Batch ${product.serialTemplate}${yearSuffix}${formattedStartSerial} - ${product.serialTemplate}${yearSuffix}${endSerialFormatted}`,
          updatedBy: userId,
          updatedAt: new Date(),
        },
      });

      await ActivityLogService.createActivityLog(
        userId,
        "UPDATE_STOCK_IN_FWC",
        `Updated Stock In FWC ID: ${id} (New Qty: ${newQuantity})`,
      );

      return updatedMovement;
    });

    return {
      id: result.id,
      updatedAt: result.updatedAt.toISOString(),
    };
  }

  /**
   * Delete Stock In (Undo)
   * Strict Rule: Only allow delete if ALL cards are still IN_OFFICE.
   */
  static async delete(id: string, userId: string) {
    const transaction = await db.$transaction(async (tx) => {
      // 1. Get Movement
      const movement = await tx.cardStockMovement.findUnique({
        where: { id },
      });

      if (!movement) {
        throw new ValidationError("Data tidak ditemukan");
      }
      if (movement.movementType !== "IN") {
        throw new ValidationError("Bukan transaksi Stock In");
      }

      // 2. Identify Cards (Try received, fallback to sent for legacy)
      const serials = (
        movement.receivedSerialNumbers?.length
          ? movement.receivedSerialNumbers
          : (movement as any).sentSerialNumbers
      ) as string[];

      if (!serials || serials.length === 0) {
        throw new ValidationError(
          "Transaksi ini tidak memiliki data serial number (Legacy Data?). Tidak aman untuk dihapus otomatis.",
        );
      }

      // 3. Verify Cards Status (All MUST be IN_OFFICE)
      const cards = await tx.card.findMany({
        where: {
          serialNumber: { in: serials },
        },
        select: { id: true, status: true, serialNumber: true },
      });

      if (cards.length !== serials.length) {
        // Some cards might have been hard deleted or data inconsistency
        throw new ValidationError(
          `Jumlah kartu tidak sesuai. Tercatat: ${serials.length}, Ditemukan: ${cards.length}`,
        );
      }

      const notInOffice = cards.filter((c) => c.status !== "IN_OFFICE");
      if (notInOffice.length > 0) {
        throw new ValidationError(
          `Gagal menghapus! Beberapa kartu sudah tidak di OFFICE: ${notInOffice
            .slice(0, 3)
            .map((c) => c.serialNumber)
            .join(", ")}...`,
        );
      }

      // 4. Revert Card Status to ON_REQUEST (Not Delete)
      // We assume they should return to "Generated but not stocked in" state.
      await tx.card.updateMany({
        where: {
          id: { in: cards.map((c) => c.id) },
        },
        data: {
          status: "ON_REQUEST",
          updatedAt: new Date(),
          updatedBy: userId,
        },
      });

      /* REMOVED: CardInventory update (Deprecated) */

      // 6. Delete Movement
      await tx.cardStockMovement.delete({
        where: { id },
      });

      // 7. Log
      await ActivityLogService.createActivityLog(
        userId,
        "DELETE_STOCK_IN_FWC",
        `Revert Stock In FWC ID: ${id} (${movement.quantity} pcs)`,
      );

      return {
        success: true,
        message: `Transaksi Stock In dibatalkan. ${movement.quantity} kartu dikembalikan ke status ON_REQUEST.`,
      };
    });

    return transaction;
  }

  /**
   * Update Batch Card Status (Quality Control)
   * Allows admin to mark cards as DAMAGED or LOST (or revert to IN_OFFICE)
   */
  static async updateBatchCardStatus(
    movementId: string,
    updates: {
      serialNumber: string;
      status: "IN_OFFICE" | "DAMAGED" | "LOST";
    }[],
    userId: string,
  ) {
    if (!updates.length)
      return { success: true, message: "No updates provided" };

    return await db.$transaction(async (tx) => {
      // 1. Get Movement
      const movement = await tx.cardStockMovement.findUnique({
        where: { id: movementId },
      });

      if (!movement) throw new ValidationError("Stock In record not found");
      if (movement.movementType !== "IN")
        throw new ValidationError("Not a Stock In record");

      const sentSerials = new Set(
        (movement as any).sentSerialNumbers as string[],
      );

      // 2. Validate Serials belong to this batch
      const invalidSerials = updates.filter(
        (u) => !sentSerials.has(u.serialNumber),
      );
      if (invalidSerials.length > 0) {
        throw new ValidationError(
          `Serial numbers not found in this batch: ${invalidSerials.map((u) => u.serialNumber).join(", ")}`,
        );
      }

      // 3. Process Updates
      let officeStockDelta = 0;
      const damagedToAdd: string[] = [];
      const damagedToRemove: string[] = [];
      const lostToAdd: string[] = [];
      const lostToRemove: string[] = [];

      // Get current card statuses
      const cards = await tx.card.findMany({
        where: { serialNumber: { in: updates.map((u) => u.serialNumber) } },
        select: { serialNumber: true, status: true },
      });
      const cardMap = new Map(cards.map((c) => [c.serialNumber, c.status]));

      for (const update of updates) {
        const currentStatus = cardMap.get(update.serialNumber);
        const newStatus = update.status;

        if (!currentStatus) continue; // Should have been caught by validation, but safe check
        if (currentStatus === newStatus) continue; // No change

        // Logic for Inventory Delta (Office Stock)
        // IN_OFFICE -> DAMAGED/LOST : Decrease Stock
        // DAMAGED/LOST -> IN_OFFICE : Increase Stock
        // DAMAGED <-> LOST : No Stock Change

        const isCurrentActive = currentStatus === "IN_OFFICE";
        const isNewActive = newStatus === "IN_OFFICE";

        if (isCurrentActive && !isNewActive) {
          officeStockDelta--;
        } else if (!isCurrentActive && isNewActive) {
          officeStockDelta++;
        }

        // Lists Update
        if (newStatus === "DAMAGED") damagedToAdd.push(update.serialNumber);
        if (newStatus === "LOST") lostToAdd.push(update.serialNumber);

        if (currentStatus === "DAMAGED")
          damagedToRemove.push(update.serialNumber);
        if (currentStatus === "LOST") lostToRemove.push(update.serialNumber);
      }

      // 4. Update Cards
      for (const update of updates) {
        await tx.card.update({
          where: { serialNumber: update.serialNumber },
          data: {
            status: update.status as any,
            updatedAt: new Date(),
            updatedBy: userId,
          },
        });
      }

      // 5. Update Inventory (if needed)
      if (officeStockDelta !== 0) {
        const officeInv = await tx.cardInventory.findFirst({
          where: {
            categoryId: movement.categoryId,
            typeId: movement.typeId,
            stationId: null,
          },
        });

        if (officeInv) {
          await tx.cardInventory.update({
            where: { id: officeInv.id },
            data: {
              cardOffice: { increment: officeStockDelta },
              updatedAt: new Date(),
              updatedBy: userId,
            },
          });
        }
      }

      // 6. Update Movement Record Lists
      const currentDamaged = new Set(
        ((movement as any).damagedSerialNumbers as string[]) || [],
      );
      const currentLost = new Set(
        ((movement as any).lostSerialNumbers as string[]) || [],
      );

      // Apply changes to sets
      damagedToAdd.forEach((s) => currentDamaged.add(s));
      damagedToRemove.forEach((s) => currentDamaged.delete(s));

      lostToAdd.forEach((s) => currentLost.add(s));
      lostToRemove.forEach((s) => currentLost.delete(s));

      await tx.cardStockMovement.update({
        where: { id: movementId },
        data: {
          damagedSerialNumbers: Array.from(currentDamaged),
          lostSerialNumbers: Array.from(currentLost),
          updatedAt: new Date(),
          updatedBy: userId,
        },
      });

      return { success: true, message: "Batch status updated successfully" };
    });
  }

  /**
   * Report Damaged Cards
   * Moves cards from IN_OFFICE to DAMAGED
   * Creates an OUT movement (with stationId=null) to record the loss.
   */
  static async reportDamaged(
    serialNumbers: string[],
    userId: string,
    note?: string,
  ) {
    if (!serialNumbers.length) {
      throw new ValidationError("No serial numbers provided");
    }

    return await db.$transaction(async (tx) => {
      // 1. Find Cards
      const cards = await tx.card.findMany({
        where: { serialNumber: { in: serialNumbers } },
        select: {
          id: true,
          serialNumber: true,
          status: true,
          cardProduct: {
            select: {
              categoryId: true,
              typeId: true,
            },
          },
        },
      });

      // 2. Validate Existence & Status
      if (cards.length !== serialNumbers.length) {
        const found = new Set(cards.map((c) => c.serialNumber));
        const missing = serialNumbers.filter((s) => !found.has(s));
        throw new ValidationError(
          `Serial numbers not found: ${missing.join(", ")}`,
        );
      }

      const invalidStatus = cards.filter((c) => c.status !== "IN_OFFICE");
      if (invalidStatus.length > 0) {
        throw new ValidationError(
          `Only cards with status IN_OFFICE can be reported damaged. Invalid: ${invalidStatus
            .map((c) => c.serialNumber)
            .join(", ")}`,
        );
      }

      // 3. Group by Product for Inventory Management
      const groups = new Map<string, typeof cards>();

      for (const card of cards) {
        const key = `${card.cardProduct.categoryId}:${card.cardProduct.typeId}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(card);
      }

      const results = [];

      for (const [key, groupCards] of groups) {
        const categoryId = groupCards[0].cardProduct.categoryId;
        const typeId = groupCards[0].cardProduct.typeId;
        const quantity = groupCards.length;
        const groupSerials = groupCards.map((c) => c.serialNumber);

        // a. Update Cards Status -> DAMAGED
        await tx.card.updateMany({
          where: { serialNumber: { in: groupSerials } },
          data: {
            status: "DAMAGED",
            updatedAt: new Date(),
            updatedBy: userId,
          },
        });

        // b. Create Movement (Type OUT, Station NULL = Loss/Adj)
        const movement = await tx.cardStockMovement.create({
          data: {
            movementAt: new Date(),
            movementType: "OUT",
            status: "APPROVED",
            categoryId,
            typeId,
            quantity,
            stationId: null, // Indicates Office/System Adjustment
            sentSerialNumbers: groupSerials,
            damagedSerialNumbers: groupSerials, // Explicitly mark as damaged for stats
            note: note || "Reported Damaged from Office",
            createdAt: new Date(),
            createdBy: userId,
            updatedAt: new Date(),
            updatedBy: userId,
          },
        });

        // c. Decrement Office Inventory
        const officeInv = await tx.cardInventory.findFirst({
          where: { categoryId, typeId, stationId: null },
        });

        if (officeInv) {
          await tx.cardInventory.update({
            where: { id: officeInv.id },
            data: {
              cardOffice: { decrement: quantity },
              updatedAt: new Date(),
              updatedBy: userId,
            },
          });
        }

        results.push(movement);
      }

      return {
        success: true,
        message: `${serialNumbers.length} cards marked as DAMAGED`,
        movements: results,
      };
    });
  }

  /**
   * Get Available Serials for Stock In
   * Returns start/end serials with status ON_REQUEST for a given Product
   */
  static async getAvailableSerials(cardProductId: string) {
    // 1. Get Count
    const count = await db.card.count({
      where: {
        cardProductId: cardProductId,
        status: "ON_REQUEST",
      },
    });

    if (count === 0) {
      return {
        startSerial: null,
        endSerial: null,
        count: 0,
      };
    }

    // 2. Get Min (Start)
    const firstCard = await db.card.findFirst({
      where: {
        cardProductId: cardProductId,
        status: "ON_REQUEST",
      },
      orderBy: { serialNumber: "asc" },
      select: { serialNumber: true },
    });

    // 3. Get Max (End)
    const lastCard = await db.card.findFirst({
      where: {
        cardProductId: cardProductId,
        status: "ON_REQUEST",
      },
      orderBy: { serialNumber: "desc" },
      select: { serialNumber: true },
    });

    return {
      startSerial: firstCard?.serialNumber || null,
      endSerial: lastCard?.serialNumber || null,
      count,
    };
  }
}
