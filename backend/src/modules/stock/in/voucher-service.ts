import db from "../../../config/db";
import { ValidationError } from "../../../utils/errors";
import { ActivityLogService } from "../../activity-log/service";

export class StockInVoucherService {
  /**
   * Create Stock In Voucher
   */
  static async createStockInVoucher(
    movementAt: Date,
    cardProductId: string,
    startSerial: string, // Suffix
    endSerial: string, // Suffix
    userId: string,
    serialDateInput?: string, // Optional Date YYYY-MM-DD for serial construction
    note?: string | null,
  ) {
    // 1. Validate Input: Digits only
    if (!/^\d+$/.test(startSerial) || !/^\d+$/.test(endSerial)) {
      throw new ValidationError(
        "Start dan End serial harus berupa angka suffix (5 digit).",
      );
    }

    const startNum = parseInt(startSerial, 10);
    const endNum = parseInt(endSerial, 10);

    if (endNum < startNum) {
      throw new ValidationError(
        "End Serial harus lebih besar atau sama dengan Start Serial.",
      );
    }

    const quantity = endNum - startNum + 1;
    if (quantity > 1000) {
      throw new ValidationError("Maksimal 1000 voucher per transaksi.");
    }

    return await db.$transaction(async (tx) => {
      // 2. Validate Product (Must be VOUCHER)
      const product = await tx.cardProduct.findUnique({
        where: { id: cardProductId },
        include: {
          category: true,
          type: true,
        },
      });

      if (!product) {
        throw new ValidationError("Produk tidak ditemukan.");
      }

      // Strict Check: Must generally be VOUCHER, but programType is on Category/Type relation
      // Assuming Category holds programType based on earlier refactors
      if (product.category.programType !== "VOUCHER") {
        throw new ValidationError(
          "Produk ini bukan tipe Voucher. Gunakan menu Stock In biasa.",
        );
      }

      // 3. Construct Serial Numbers
      // Use serialDate if provided, otherwise default to movementAt (Stock In Date)
      // Note: Using movementAt is risky if stock in is delayed, but standard fallback.
      const dateBase = serialDateInput
        ? new Date(serialDateInput)
        : new Date(movementAt);

      const year = dateBase.getFullYear().toString().slice(-2);
      const month = (dateBase.getMonth() + 1).toString().padStart(2, "0");
      const day = dateBase.getDate().toString().padStart(2, "0");
      const prefix = `${product.serialTemplate}${year}${month}${day}`;

      const serialNumbers: string[] = [];
      const width = 5; // Fixed 5 digit suffix

      for (let i = 0; i < quantity; i++) {
        const currentSuffix = (startNum + i).toString().padStart(width, "0");
        serialNumbers.push(`${prefix}${currentSuffix}`);
      }

      // 4. Verify Cards Exist and are ON_REQUEST
      const cards = await tx.card.findMany({
        where: {
          serialNumber: { in: serialNumbers },
          cardProductId: product.id,
        },
        select: { id: true, serialNumber: true, status: true },
      });

      if (cards.length !== quantity) {
        // Find missing
        const foundSerials = new Set(cards.map((c) => c.serialNumber));
        const missing = serialNumbers.filter((s) => !foundSerials.has(s));
        throw new ValidationError(
          `Beberapa serial number tidak ditemukan (Mungkin tanggal salah?): ${missing.slice(0, 3).join(", ")}...`,
        );
      }

      const invalidCards = cards.filter((c) => c.status !== "ON_REQUEST");
      if (invalidCards.length > 0) {
        throw new ValidationError(
          `Beberapa kartu tidak dalam status ON_REQUEST (Sudah di-stock in?): ${invalidCards[0].serialNumber}`,
        );
      }

      // 5. Update Cards Status -> IN_OFFICE
      await tx.card.updateMany({
        where: { id: { in: cards.map((c) => c.id) } },
        data: {
          status: "IN_OFFICE",
          updatedAt: new Date(),
        },
      });

      // 6. Create Movement
      const movement = await tx.cardStockMovement.create({
        data: {
          movementAt: new Date(movementAt),
          movementType: "IN",
          categoryId: product.categoryId,
          typeId: product.typeId,
          quantity: quantity,
          receivedSerialNumbers: serialNumbers, // Prisma supports String[]
          createdBy: userId,
          note: note,
          status: "APPROVED", // "APPROVED" is the correct enum for valid/completed stock-in
        },
        include: {
          category: {
            select: { id: true, categoryName: true, programType: true },
          },
          type: { select: { id: true, typeName: true } },
        },
      });

      // 7. Activity Log
      await ActivityLogService.createActivityLog(
        userId,
        "CREATE_STOCK_IN_VOUCHER",
        `Stock In Voucher: ${quantity} pcs for ${product.category.categoryName} - ${product.type.typeName} (Date: ${dateBase.toISOString().split("T")[0]})`,
      );

      return {
        ...movement,
        product: {
          id: product.id,
          name: `${product.category.categoryName} - ${product.type.typeName}`,
        },
      };
    });
  }

  /**
   * Get History (Filtered for Voucher)
   */
  static async getHistory(params: {
    page?: number;
    limit?: number;
    startDate?: Date;
    endDate?: Date;
    categoryId?: string;
    typeId?: string;
    search?: string;
  }) {
    const page = Number(params.page) || 1;
    const limitNum = Number(params.limit) || 10;
    const skip = (page - 1) * limitNum;

    const where: any = {
      movementType: "IN",
      category: {
        programType: "VOUCHER", // Filter ONLY Vouchers
      },
    };

    if (params.startDate && params.endDate) {
      where.movementAt = {
        gte: params.startDate,
        lte: params.endDate,
      };
    } else if (params.startDate) {
      where.movementAt = { gte: params.startDate };
    } else if (params.endDate) {
      where.movementAt = { lte: params.endDate };
    }

    if (params.categoryId) {
      where.categoryId = params.categoryId;
    }

    if (params.typeId) {
      where.typeId = params.typeId;
    }

    if (params.search) {
      where.OR = [
        { batchId: { contains: params.search, mode: "insensitive" } },
        { note: { contains: params.search, mode: "insensitive" } },
        // Optional: search by card product name if joined?
        // Basic search: BatchID or Note
      ];
    }

    const [items, total] = await Promise.all([
      db.cardStockMovement.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { movementAt: "desc" },
        include: {
          category: {
            select: { id: true, categoryName: true, programType: true },
          },
          type: { select: { id: true, typeName: true } },
        },
      }),
      db.cardStockMovement.count({ where }),
    ]);

    // Format Response
    const userIds = [
      ...(new Set(
        items.map((i) => i.createdBy).filter(Boolean),
      ) as Set<string>),
    ];
    const users = await db.user.findMany({
      where: { id: { in: Array.from(userIds) } },
      select: { id: true, fullName: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u.fullName]));

    const formattedItems = await Promise.all(
      items.map(async (item) => {
        // Try to find product for this cat/type
        const product = await db.cardProduct.findFirst({
          where: { categoryId: item.categoryId, typeId: item.typeId },
        });

        const productName = `${item.category.categoryName} - ${item.type.typeName}`;

        return {
          id: item.id,
          movementAt: item.movementAt.toISOString(),
          quantity: item.quantity,
          status: item.status,
          batchId: item.batchId,
          note: item.note,
          createdByName: item.createdBy ? userMap.get(item.createdBy) : null,
          category: {
            id: item.category.id,
            name: item.category.categoryName,
            programType: item.category.programType,
          },
          type: {
            id: item.type.id,
            name: item.type.typeName,
          },
          product: {
            id: product?.id || "",
            name: productName,
          },
        };
      }),
    );

    return {
      items: formattedItems,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
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

    if (movement.category.programType !== "VOUCHER") {
      throw new ValidationError("Data ini bukan Voucher Stock In");
    }

    const product = await db.cardProduct.findFirst({
      where: { categoryId: movement.categoryId, typeId: movement.typeId },
    });

    const productName = `${movement.category.categoryName} - ${movement.type.typeName}`;

    return {
      id: movement.id,
      movementAt: movement.movementAt.toISOString(),
      quantity: movement.quantity,
      status: movement.status,
      batchId: movement.batchId,
      note: movement.note,
      category: {
        id: movement.category.id,
        name: movement.category.categoryName,
        programType: movement.category.programType,
      },
      type: {
        id: movement.type.id,
        name: movement.type.typeName,
      },
      product: {
        id: product?.id || "",
        name: productName,
      },
    };
  }

  /**
   * Delete (Revert) Stock In Voucher
   */
  static async delete(id: string, userId: string) {
    return await db.$transaction(async (tx) => {
      const movement = await tx.cardStockMovement.findUnique({
        where: { id },
        include: { category: true },
      });

      if (!movement) throw new ValidationError("Data tidak ditemukan");
      if (movement.category.programType !== "VOUCHER")
        throw new ValidationError("Bukan transaksi Voucher");

      // Revert Cards Status -> ON_REQUEST
      // Only if current status is IN_OFFICE (not distributed yet)
      const serials = movement.receivedSerialNumbers || [];

      const cards = await tx.card.findMany({
        where: { serialNumber: { in: serials } },
      });

      // Verify all cards are still IN_OFFICE
      const distributed = cards.filter((c) => c.status !== "IN_OFFICE");
      if (distributed.length > 0) {
        throw new ValidationError(
          `Tidak dapat menghapus. Beberapa kartu sudah didistribusikan: ${distributed[0].serialNumber}`,
        );
      }

      // Revert Status
      await tx.card.updateMany({
        where: { id: { in: cards.map((c) => c.id) } },
        data: { status: "ON_REQUEST", updatedAt: new Date() },
      });

      // Delete Movement
      await tx.cardStockMovement.delete({ where: { id } });

      // Log
      await ActivityLogService.createActivityLog(
        userId,
        "DELETE_STOCK_IN_VOUCHER",
        `Revert Stock In Voucher ID: ${id} (${movement.quantity} pcs)`,
      );

      return { success: true, message: "Stock In berhasil dibatalkan" };
    });
  }

  /**
   * Update Metadata (Note, MovementAt)
   */
  static async update(
    id: string,
    updates: { movementAt?: string; note?: string },
    userId: string,
  ) {
    const movement = await db.cardStockMovement.findUnique({ where: { id } });
    if (!movement) throw new ValidationError("Stock In not found");
    if (movement.movementType !== "IN")
      throw new ValidationError("Not a stock in record");

    // Only allow edit metadata, not serial numbers or quantities
    const result = await db.cardStockMovement.update({
      where: { id },
      data: {
        movementAt: updates.movementAt
          ? new Date(updates.movementAt)
          : undefined,
        note: updates.note,
        updatedAt: new Date(),
      },
    });

    await ActivityLogService.createActivityLog(
      userId,
      "UPDATE_STOCK_IN_VOUCHER",
      `Updated Stock In Voucher ID: ${id}`,
    );

    return result;
  }

  /**
   * Update Batch Card Status (Quality Control)
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

      const receivedSerials = new Set(
        (movement as any).receivedSerialNumbers as string[],
      );

      // 2. Validate Serials belong to this batch
      const invalidSerials = updates.filter(
        (u) => !receivedSerials.has(u.serialNumber),
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
            stationId: null, // HQ Inventory
          },
        });

        if (officeInv) {
          await tx.cardInventory.update({
            where: { id: officeInv.id },
            data: {
              cardOffice: { increment: officeStockDelta },
              updatedAt: new Date(),
            },
          });
        }
      }

      await ActivityLogService.createActivityLog(
        userId,
        "UPDATE_BATCH_STATUS_VOUCHER",
        `Updated status for ${updates.length} cards in Batch ${movementId}`,
      );

      return {
        success: true,
        message: "Status kartu berhasil diupdate.",
      };
    });
  }

  /**
   * Get Available Serials for Voucher
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
