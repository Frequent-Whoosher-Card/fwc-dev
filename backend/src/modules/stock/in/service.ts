import db from "../../../config/db";
import { ValidationError } from "../../../utils/errors";

export class StockInService {
  /**
   * Stock In
   */
  static async createStockIn(
    movementAt: Date,
    categoryId: string,
    typeId: string,
    startSerial: string,
    endSerial: string,
    userId: string,
    note?: string | null
  ) {
    // 1. Validasi Input: Pastikan HANYA angka (bukan full serial number)
    if (!/^\d+$/.test(startSerial) || !/^\d+$/.test(endSerial)) {
      // Jika user tidak sengaja input full serial (ada huruf), berikan pesan helper
      if (/[a-zA-Z]/.test(startSerial) || /[a-zA-Z]/.test(endSerial)) {
        throw new ValidationError(
          "Input harus berupa angka urutan (contoh: '1', '25'), JANGAN masukkan serial number lengkap (contoh: 'FWC...')."
        );
      }
      throw new ValidationError(
        "startSerial dan endSerial harus berupa digit string (angka saja)."
      );
    }

    const startNum = Number(startSerial);
    const endNum = Number(endSerial);

    if (!Number.isSafeInteger(startNum) || !Number.isSafeInteger(endNum)) {
      throw new ValidationError("Nomor serial terlalu besar");
    }

    if (endNum < startNum) {
      throw new ValidationError(
        "endSerial harus lebih besar atau sama dengan startSerial"
      );
    }

    const quantity = endNum - startNum + 1;

    if (quantity > 10000) {
      throw new ValidationError("Maksimal produksi 10.000 kartu per batch");
    }

    const width = 5; // Fixed 5-digit padding as requested
    const endSerialFormatted = String(endNum).padStart(width, "0");

    // Extract YY from movementAt (ensure it is a Date object)
    const yearSuffix = new Date(movementAt).getFullYear().toString().slice(-2);

    const transaction = await db.$transaction(async (tx) => {
      const product = await tx.cardProduct.findUnique({
        where: {
          unique_category_type: {
            categoryId,
            typeId,
          },
        },
        select: {
          id: true,
          serialTemplate: true,
          totalQuota: true,
          masaBerlaku: true,
          price: true,
        },
      });

      if (!product) {
        throw new ValidationError(
          "CardProduct untuk kategori/tipe ini tidak ditemukan"
        );
      }

      // 2) Generate suffix serial berurutan
      const suffixSerials = Array.from({ length: quantity }, (_, i) =>
        String(startNum + i).padStart(width, "0")
      );

      // 3) Bentuk serialNumber final: serialTemplate + YY + suffix
      const serialNumbers = suffixSerials.map(
        (sfx) => `${product.serialTemplate}${yearSuffix}${sfx}`
      );

      // 4) Validasi serialNumber belum ada
      const existing = await tx.card.findFirst({
        where: { serialNumber: { in: serialNumbers } },
        select: { serialNumber: true },
      });

      if (existing) {
        throw new ValidationError(
          `Serial ${existing.serialNumber} sudah pernah terdaftar`
        );
      }

      // 5) Insert batch cards (status IN_OFFICE)
      await tx.card.createMany({
        data: serialNumbers.map((sn) => ({
          serialNumber: sn,
          cardProductId: product.id,
          quotaTicket: product.totalQuota, // Initialize quota from product
          status: "IN_OFFICE",
          createdBy: userId,
        })),
      });

      // 6) Catat stock movement IN
      const formattedStartSerial = String(startNum).padStart(width, "0");
      const movement = await tx.cardStockMovement.create({
        data: {
          movementAt: new Date(),
          type: "IN",
          status: "APPROVED",
          categoryId,
          typeId,
          stationId: null,
          quantity,
          sentSerialNumbers: serialNumbers, // Save serials for tracking/undo
          receivedSerialNumbers: [],
          lostSerialNumbers: [],
          note:
            note ??
            `Batch ${product.serialTemplate}${yearSuffix}${formattedStartSerial} - ${product.serialTemplate}${yearSuffix}${endSerialFormatted}`,
          createdAt: new Date(),
          createdBy: userId,
        },
      });

      // 7) Update inventory OFFICE (stationId=null): cardOffice += quantity
      const officeInv = await tx.cardInventory.findFirst({
        where: { categoryId, typeId, stationId: null },
        select: { id: true },
      });

      if (!officeInv) {
        await tx.cardInventory.create({
          data: {
            categoryId,
            typeId,
            stationId: null,
            cardOffice: quantity,
            cardBeredar: quantity,
            lastUpdated: new Date(),
            updatedBy: userId,
          },
        });
      } else {
        await tx.cardInventory.update({
          where: { id: officeInv.id },
          data: {
            cardOffice: { increment: quantity },
            cardBeredar: { increment: quantity },
            lastUpdated: new Date(),
            updatedBy: userId,
          },
        });
      }

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
  }) {
    const { page = 1, limit = 10, startDate, endDate, categoryId } = params;
    const skip = (page - 1) * limit;

    const where: any = {
      type: "IN",
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

    const [items, total] = await Promise.all([
      db.cardStockMovement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { movementAt: "desc" },
        include: {
          category: true,
          cardType: true,
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
      movementType: item.type,
      quantity: item.quantity,
      status: item.status,
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
        id: item.cardType.id,
        name: item.cardType.typeName,
        code: item.cardType.typeCode,
      },
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
        cardType: true,
      },
    });

    if (!movement) {
      throw new ValidationError("Data tidak ditemukan");
    }

    if (movement.type !== "IN") {
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
        movementType: movement.type,
        quantity: movement.quantity,
        status: movement.status,
        note: movement.note,
        createdAt: movement.createdAt.toISOString(),
        createdByName,
        cardCategory: {
          id: movement.category.id,
          name: movement.category.categoryName,
          code: movement.category.categoryCode,
        },
        cardType: {
          id: movement.cardType.id,
          name: movement.cardType.typeName,
          code: movement.cardType.typeCode,
        },
      },
    };
  }
  /**
   * Update Stock In (Restricted)
   */
  static async update(
    id: string,
    body: {
      movementAt?: string;
      note?: string;
    },
    userId: string
  ) {
    const movement = await db.cardStockMovement.findUnique({
      where: { id },
    });

    if (!movement) {
      throw new ValidationError("Data tidak ditemukan");
    }

    if (movement.type !== "IN") {
      throw new ValidationError("Bukan transaksi Stock In");
    }

    const { movementAt, note } = body;
    const dataToUpdate: any = {
      updatedBy: userId, // track siapa yang edit terakhir
      // updatedAt akan otomatis diupdate oleh Prisma jika ada field @updatedAt,
      // tapi di schema movement tidak ada field @updatedAt default sekarang,
      // jadi kita biarkan saja (atau tambah field lastUpdated di schema nanti).
      // Saat ini kita tidak update kolom waktu edit karena schema tidak mendukung explicit lastUpdated column di movement.
    };

    if (movementAt) {
      dataToUpdate.movementAt = new Date(movementAt);
    }

    if (note !== undefined) {
      dataToUpdate.note = note;
    }

    const updated = await db.cardStockMovement.update({
      where: { id },
      data: dataToUpdate,
    });

    return {
      id: updated.id,
      updatedAt: new Date().toISOString(), // Mock timestamp response
    };
  }
  /**
   * Delete Stock In (Undo)
   * Strict Rule: Only allow delete if ALL cards are still IN_OFFICE.
   */
  static async delete(id: string) {
    const transaction = await db.$transaction(async (tx) => {
      // 1. Get Movement
      const movement = await tx.cardStockMovement.findUnique({
        where: { id },
      });

      if (!movement) {
        throw new ValidationError("Data tidak ditemukan");
      }
      if (movement.type !== "IN") {
        throw new ValidationError("Bukan transaksi Stock In");
      }

      // 2. Identify Cards (from sentSerialNumbers)
      // Note: We cast to string[] just in case (schema is String[] @db.Text, but Prisma might treat as string in some versions,
      // but based on our create logic it is stored as array).
      const serials = (movement as any).sentSerialNumbers as string[];

      if (!serials || serials.length === 0) {
        throw new ValidationError(
          "Transaksi ini tidak memiliki data serial number (Legacy Data?). Tidak aman untuk dihapus otomatis."
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
          `Jumlah kartu tidak sesuai. Tercatat: ${serials.length}, Ditemukan: ${cards.length}`
        );
      }

      const notInOffice = cards.filter((c) => c.status !== "IN_OFFICE");
      if (notInOffice.length > 0) {
        throw new ValidationError(
          `Gagal menghapus! Beberapa kartu sudah tidak di OFFICE: ${notInOffice
            .slice(0, 3)
            .map((c) => c.serialNumber)
            .join(", ")}...`
        );
      }

      // 4. Delete Cards
      await tx.card.deleteMany({
        where: {
          id: { in: cards.map((c) => c.id) },
        },
      });

      // 5. Decrement Inventory Office
      // We assume officeInv exists because we just checked cards are IN_OFFICE (logic implies inventory exists)
      const officeInv = await tx.cardInventory.findFirst({
        where: {
          categoryId: movement.categoryId,
          typeId: movement.typeId,
          stationId: null,
        },
        select: { id: true },
      });

      if (officeInv) {
        await tx.cardInventory.update({
          where: { id: officeInv.id },
          data: {
            cardOffice: { decrement: movement.quantity },
            cardBeredar: { decrement: movement.quantity }, // Beredar juga berkurang karena production dibatalkan
            lastUpdated: new Date(),
          },
        });
      }

      // 6. Delete Movement
      await tx.cardStockMovement.delete({
        where: { id },
      });

      return {
        success: true,
        message: `Transaksi Stock In dibatalkan. ${movement.quantity} kartu dihapus dari stok.`,
      };
    });

    return transaction;
  }
}
