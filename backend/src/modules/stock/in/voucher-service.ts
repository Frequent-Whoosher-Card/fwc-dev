import {
  parseFilter,
  prismaFilter,
  parseSmartSearch,
} from "../../../utils/filterHelper";
import db from "../../../config/db";
import { ValidationError } from "../../../utils/errors";
import { ActivityLogService } from "../../activity-log/service";
import { LowStockService } from "../../../services/lowStockService";
import { uploadStockFile } from "../../../utils/fileUpload";
import { FilePurpose } from "@prisma/client";

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
    serialDateInput?: string, // Optional Date YYYY-MM-DD for serial reconstruction
    note?: string | null,
    vendorName?: string,
    vcrSettle?: string,
    vcrSettleFileId?: string,
    vcrSettleFile?: File,
    costs?: string, // [NEW]
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

    const quantityRequested = endNum - startNum + 1;
    if (quantityRequested > 1000) {
      throw new ValidationError("Maksimal 1000 voucher per transaksi.");
    }

    // --- HANDLE FILE UPLOAD ---
    let finalFileId = vcrSettleFileId;
    if (vcrSettleFile) {
      finalFileId = await uploadStockFile(
        vcrSettleFile,
        userId,
        FilePurpose.STOCK_IN_VOUCHER_SETTLE,
        "stock-in",
        vcrSettle,
      );
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

      for (let i = 0; i < quantityRequested; i++) {
        const currentSuffix = (startNum + i).toString().padStart(width, "0");
        serialNumbers.push(`${prefix}${currentSuffix}`);
      }

      // 4. Verify Cards Exist and Filter Status
      // Logic:
      // - Status ON_REQUEST -> Process
      // - Status IN_OFFICE -> Skip
      // - Others -> Error
      // - Missing -> Error (Must be generated first)
      const existingCards = await tx.card.findMany({
        where: {
          serialNumber: { in: serialNumbers },
          cardProductId: product.id,
        },
        select: { id: true, serialNumber: true, status: true },
      });

      const foundSerials = new Set(existingCards.map((c) => c.serialNumber));
      if (existingCards.length !== serialNumbers.length) {
        const missing = serialNumbers.filter((s) => !foundSerials.has(s));
        throw new ValidationError(
          `Beberapa serial number tidak ditemukan (Mungkin tanggal salah?): ${missing.slice(0, 3).join(", ")}...`,
        );
      }

      const toProcess: string[] = [];
      const toProcessSerials: string[] = [];
      const skippedSerials: string[] = [];

      for (const card of existingCards) {
        if (card.status === "ON_REQUEST") {
          toProcess.push(card.id);
          toProcessSerials.push(card.serialNumber);
        } else if (card.status === "IN_OFFICE") {
          skippedSerials.push(card.serialNumber);
        } else {
          // Collision / Invalid state
          throw new ValidationError(
            `Beberapa kartu memiliki status tidak valid (bukan ON_REQUEST atau IN_OFFICE): ${card.serialNumber} (${card.status}).`,
          );
        }
      }

      let movementId = null;

      if (toProcess.length > 0) {
        // 5. Update Cards Status -> IN_OFFICE
        await tx.card.updateMany({
          where: { id: { in: toProcess } },
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
            quantity: toProcess.length, // actual processed
            receivedSerialNumbers: [],
            sentSerialNumbers: toProcessSerials, // Prisma supports String[]
            createdBy: userId,
            note: note,
            vendorName: vendorName,
            vcrSettle: vcrSettle,
            vcrSettleFileId: finalFileId,
            costs: costs, // [NEW]
            status: "APPROVED", // "APPROVED" is the correct enum for valid/completed stock-in
          },
          include: {
            category: {
              select: {
                id: true,
                categoryName: true,
                categoryCode: true,
                programType: true,
              },
            },
            type: { select: { id: true, typeName: true, typeCode: true } },
          },
        });
        movementId = movement.id;

        // 7. Activity Log
        await ActivityLogService.createActivityLog(
          userId,
          "CREATE_STOCK_IN_VOUCHER",
          `Stock In Voucher: ${toProcess.length} pcs for ${product.category.categoryName} - ${product.type.typeName} (Date: ${dateBase.toISOString().split("T")[0]})`,
        );

        // --- LOW STOCK TRIGGER ---
        const currentStock = await tx.card.count({
          where: {
            status: "IN_OFFICE",
            cardProductId: product.id,
          },
        });

        await LowStockService.checkStock(
          product.categoryId,
          product.typeId,
          null, // Office Scope
          currentStock,
          tx,
        );
        // -------------------------
      }

      // Construct Custom Message
      // "Stock In Berhasil. Total kartu tersedia: [Total]. (Baru masuk: [New], Sudah ada sebelumnya: [Skipped])"
      const message = `Stock In Berhasil. Total kartu tersedia: ${quantityRequested}. (Baru masuk: ${toProcess.length}, Sudah ada sebelumnya: ${skippedSerials.length})`;

      return {
        success: true,
        message,
        data: {
          movementId: movementId || "",
          cardProductId,
          startSerial,
          endSerial,
          quantityRequested,
          processedCount: toProcess.length,
          skippedCount: skippedSerials.length,
          serialDate: dateBase.toISOString(),
        },
      };
    });
  }

  /**
   * Get History (Filtered for Voucher)
   */
  // Moved to top
  static async getHistory(params: {
    page?: number;
    limit?: number;
    startDate?: Date;
    endDate?: Date;
    categoryId?: string;
    typeId?: string;
    stationId?: string;
    categoryName?: string;
    typeName?: string;
    stationName?: string;
    search?: string;
  }) {
    const page = Number(params.page) || 1;
    const limitNum = Number(params.limit) || 10;
    const skip = (page - 1) * limitNum;

    const where: any = {
      movementType: "IN",
      category: {
        programType: "VOUCHER",
      },
      ...parseSmartSearch(params.search || "", [
        "note",
        "vendorName",
        "vcrSettle",
        "costs", // [NEW]
        "category.categoryName",
        "type.typeName",
        "category.categoryCode",
        "type.typeCode",
      ]),
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
      where.categoryId = prismaFilter(params.categoryId);
    }

    if (params.typeId) {
      where.typeId = prismaFilter(params.typeId);
    }

    if (params.stationId) {
      where.stationId = prismaFilter(params.stationId);
    }

    // Support Multi-Filter for Names (OR-based contains)
    if (params.categoryName) {
      const names = params.categoryName
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      where.category = {
        ...where.category,
        OR: names.map((name) => ({
          categoryName: { contains: name, mode: "insensitive" },
        })),
      };
    }

    if (params.typeName) {
      const names = params.typeName
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      where.type = {
        OR: names.map((name) => ({
          typeName: { contains: name, mode: "insensitive" },
        })),
      };
    }

    if (params.stationName) {
      const names = params.stationName
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      where.station = {
        OR: names.map((name) => ({
          stationName: { contains: name, mode: "insensitive" },
        })),
      };
    }

    const [items, total] = await Promise.all([
      db.cardStockMovement.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: "desc" },
        include: {
          category: true,
          type: true,
        },
      }),
      db.cardStockMovement.count({ where }),
    ]);

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
          vendorName: item.vendorName,
          vcrSettle: item.vcrSettle,
          vcrSettleFileId: item.vcrSettleFileId,
          costs: item.costs, // [NEW]
          createdByName: item.createdBy ? userMap.get(item.createdBy) : null,
          cardCategory: {
            id: item.category.id,
            name: item.category.categoryName,
            code: item.category.categoryCode,
            programType: item.category.programType,
          },
          cardType: {
            id: item.type.id,
            name: item.type.typeName,
            code: item.type.typeCode,
          },
          product: {
            id: product?.id || "",
            name: productName,
          },
          sentSerialNumbers: (item.sentSerialNumbers?.length
            ? item.sentSerialNumbers
            : item.receivedSerialNumbers) as string[],
        };
      }),
    );

    return {
      items: formattedItems,
      pagination: {
        total,
        page,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
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
        vcrSettleFile: true,
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
      movement: {
        id: movement.id,
        movementAt: movement.movementAt.toISOString(),
        movementType: movement.movementType, // Explicitly return 'IN'
        quantity: movement.quantity,
        status: movement.status,
        batchId: movement.batchId,
        note: movement.note,
        vendorName: movement.vendorName,
        vcrSettle: movement.vcrSettle,
        vcrSettleFileId: movement.vcrSettleFileId,
        vcrSettleFile: movement.vcrSettleFile,
        costs: movement.costs, // [NEW]
        createdAt: movement.createdAt.toISOString(),
        createdByName: null, // Placeholder or fetch if needed
        cardCategory: {
          id: movement.category.id,
          name: movement.category.categoryName,
          code: movement.category.categoryCode, // Added code if available in schema (it is)
          programType: movement.category.programType,
        },
        cardType: {
          id: movement.type.id,
          name: movement.type.typeName,
          code: movement.type.typeCode, // Added code
        },
        product: {
          id: product?.id || "",
          name: productName,
        },
        sentSerialNumbers: movement.sentSerialNumbers as string[],
        receivedSerialNumbers: movement.receivedSerialNumbers as string[],
        items: await (async () => {
          const serials = [
            ...((movement.sentSerialNumbers as string[]) || []),
            ...((movement.receivedSerialNumbers as string[]) || []),
          ];
          if (!serials.length) return [];
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
      const serials = [
        ...((movement.sentSerialNumbers as string[]) || []),
        ...((movement.receivedSerialNumbers as string[]) || []),
      ];

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
    updates: {
      movementAt?: string;
      note?: string;
      vendorName?: string;
      vcrSettle?: string;
      vcrSettleFileId?: string;
      costs?: string; // [NEW]
    },
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
        vendorName: updates.vendorName,
        vcrSettle: updates.vcrSettle,
        vcrSettleFileId: updates.vcrSettleFileId,
        costs: updates.costs, // [NEW]
        updatedAt: new Date(),
      },
    });

    await ActivityLogService.createActivityLog(
      userId,
      "UPDATE_STOCK_IN_VOUCHER",
      `Updated Stock In Voucher ID: ${id}`,
    );

    return {
      id: result.id,
      updatedAt: result.updatedAt.toISOString(),
    };
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

      const batchSerials = new Set([
        ...((movement as any).sentSerialNumbers || []),
        ...((movement as any).receivedSerialNumbers || []),
      ]);

      // 2. Validate Serials belong to this batch
      const invalidSerials = updates.filter(
        (u) => !batchSerials.has(u.serialNumber),
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
