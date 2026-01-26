import db from "../../../config/db";
import { ValidationError } from "../../../utils/errors";
import { BatchService } from "src/services/batchService";
import { LowStockService } from "src/services/lowStockService";
import { ActivityLogService } from "../../activity-log/service";

function normalizeSerials(arr: string[]) {
  return Array.from(
    new Set((arr ?? []).map((s) => (s ?? "").trim()).filter(Boolean)),
  );
}

export class StockOutVoucherService {
  /**
   * Create stock out voucher
   */
  static async stockOutDistribution(
    movementAt: Date,
    cardProductId: string,
    stationId: string,
    startSerial: string,
    endSerial: string,
    userId: string,
    serialDateInput: Date, // Required for Voucher reconstruction
    note?: string,
    notaDinas?: string,
    bast?: string,
  ) {
    // 1. Validate Input
    if (!/^\d+$/.test(startSerial) || !/^\d+$/.test(endSerial)) {
      throw new ValidationError(
        "startSerial dan endSerial harus berupa angka.",
      );
    }

    const startNum = parseInt(startSerial, 10);
    const endNum = parseInt(endSerial, 10);

    if (endNum < startNum) {
      throw new ValidationError(
        "endSerial harus lebih besar atau sama dengan startSerial",
      );
    }

    const count = endNum - startNum + 1;
    if (count > 10000) {
      throw new ValidationError(
        "Maksimal distribusi 10.000 voucher per transaksi",
      );
    }

    // --- PRE-TRANSACTION ---
    const cardProduct = await db.cardProduct.findUnique({
      where: { id: cardProductId },
      include: {
        category: true,
        type: true,
      },
    });

    if (!cardProduct) {
      throw new ValidationError("Produk voucher tidak ditemukan.");
    }

    const { serialTemplate, categoryId, typeId } = cardProduct;
    const suffixLength = 5;

    // --- SERIAL RECONSTRUCTION (VOUCHER SPECIFIC) ---
    // Format: Template + YYMMDD + Suffix
    const d = new Date(serialDateInput);
    if (isNaN(d.getTime())) {
      throw new ValidationError("Invalid serialDateInput");
    }
    const yearSuffix = d.getFullYear().toString().slice(-2);
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    const prefix = `${serialTemplate}${yearSuffix}${month}${day}`;

    // Generate List
    const sent = Array.from({ length: count }, (_, i) => {
      const sfx = String(startNum + i).padStart(suffixLength, "0");
      return `${prefix}${sfx}`;
    });

    // 2. Validate availability
    const cards = await db.card.findMany({
      where: {
        serialNumber: { in: sent },
        cardProductId,
        status: "IN_OFFICE",
      },
      select: { id: true, serialNumber: true },
    });

    if (cards.length !== sent.length) {
      const found = new Set(cards.map((c) => c.serialNumber));
      const missing = sent.filter((sn) => !found.has(sn));

      // Check failures
      const invalidCards = await db.card.findMany({
        where: {
          serialNumber: { in: missing },
          cardProductId,
        },
        select: { serialNumber: true, status: true },
      });

      const statusMap = new Map(
        invalidCards.map((c) => [c.serialNumber, c.status]),
      );

      const alreadyDistributed = [];
      const notFound = [];

      for (const sn of missing) {
        const s = statusMap.get(sn);
        if (s) alreadyDistributed.push(`${sn} (${s})`);
        else notFound.push(sn);
      }

      let msg = `Validasi Stock Out Voucher Gagal (Tgl Produksi: ${d.toISOString().split("T")[0]}):`;
      if (alreadyDistributed.length)
        msg += ` Sudah keluar: ${alreadyDistributed.join(", ")}.`;
      if (notFound.length) msg += ` Tidak ditemukan: ${notFound.join(", ")}.`;

      throw new ValidationError(msg);
    }

    const sentCount = cards.length;

    // Station Info
    const station = await db.station.findUnique({
      where: { id: stationId },
      select: { stationName: true },
    });
    const stationName = station?.stationName || "Station";

    const supervisors = await db.user.findMany({
      where: {
        role: { roleCode: "supervisor" },
        stationId,
        isActive: true,
      },
      select: { id: true },
    });

    // --- TRANSACTION ---
    const transaction = await db.$transaction(
      async (tx) => {
        // Update Card Status
        const updateRes = await tx.card.updateMany({
          where: {
            id: { in: cards.map((c) => c.id) },
            status: "IN_OFFICE",
          },
          data: {
            status: "IN_TRANSIT",
            updatedAt: new Date(),
            updatedBy: userId,
          },
        });

        if (updateRes.count !== sentCount) {
          throw new ValidationError("Double booking detected during update.");
        }

        const batchId = await BatchService.generateBatchId(
          tx,
          categoryId,
          typeId,
          stationId,
        );

        const movement = await tx.cardStockMovement.create({
          data: {
            movementAt,
            movementType: "OUT",
            status: "PENDING",
            categoryId,
            typeId,
            stationId,
            batchId,
            quantity: sentCount,
            note: note ?? null,
            notaDinas: notaDinas ?? null,
            bast: bast ?? null,
            sentSerialNumbers: sent, // Store array
            receivedSerialNumbers: [],
            lostSerialNumbers: [],
            createdAt: new Date(),
            createdBy: userId,
          },
        });

        // Inbox Notification
        if (supervisors.length > 0) {
          const productName = `${cardProduct.category.categoryName} - ${cardProduct.type.typeName}`;
          const inboxData = supervisors.map((spv) => ({
            title: `Kiriman Voucher: ${productName}`,
            message: `Office mengirim ${sentCount} voucher ${productName} (Prod: ${d.toISOString().split("T")[0]}) ke stasiun ${stationName}.`,
            sentTo: spv.id,
            sentBy: userId,
            stationId,
            type: "STOCK_DISTRIBUTION",
            payload: {
              movementId: movement.id,
              cardProductId,
              quantity: sentCount,
              status: "PENDING",
              serialDate: d.toISOString(),
            },
            isRead: false,
            createdAt: new Date(),
          }));
          await tx.inbox.createMany({ data: inboxData });
        }

        return {
          movementId: movement.id,
          status: movement.status,
          sentCount,
        };
      },
      { maxWait: 5000, timeout: 10000 },
    );

    // Logging
    await ActivityLogService.createActivityLog(
      userId,
      "CREATE_STOCK_OUT_VOUCHER",
      `Stock Out Voucher created: ${sentCount} vouchers to ${stationName}.`,
    );

    return transaction;
  }

  static async validateStockOutReceipe(
    movementId: string,
    receivedSerialNumbers: string[],
    lostSerialNumbers: string[] | undefined,
    damagedSerialNumbers: string[] | undefined,
    validatorUserId: string,
    validatorStationId: string,
    note?: string,
  ) {
    // Reusing FWC logic but with smarter reconstruction
    const received = normalizeSerials(receivedSerialNumbers);
    const lost = normalizeSerials(lostSerialNumbers || []);
    const damaged = normalizeSerials(damagedSerialNumbers || []);

    // Overlap checks (same...)
    const lostSet = new Set(lost);
    const damagedSet = new Set(damaged);
    const overlapRL = received.find((s) => lostSet.has(s));
    if (overlapRL)
      throw new ValidationError(`Overlap Recall/Lost: ${overlapRL}`);
    const overlapRD = received.find((s) => damagedSet.has(s));
    if (overlapRD)
      throw new ValidationError(`Overlap Recall/Damaged: ${overlapRD}`);
    const overlapLD = lost.filter((s) => damagedSet.has(s));
    if (overlapLD.length)
      throw new ValidationError(`Overlap Lost/Damaged: ${overlapLD}`);

    // Fetch Movement
    const movement = await db.cardStockMovement.findUnique({
      where: { id: movementId },
    });
    if (!movement) throw new ValidationError("Movement not found");
    if (movement.movementType !== "OUT" || movement.status !== "PENDING") {
      throw new ValidationError("Invalid movement status/type");
    }
    if (movement.stationId !== validatorStationId) {
      throw new ValidationError("Unauthorized station");
    }

    const sent = normalizeSerials(movement.sentSerialNumbers);
    const sentSet = new Set(sent);

    // --- SMARTER RECONSTRUCTION ---
    // If sent list exists, try to deduce prefix from the first item (assuming batch homogeneity)
    let derivedPrefix = "";
    if (sent.length > 0) {
      // Voucher serial: TEMPLATE + YYMMDD + SUFFIX(5)
      // Check if length > 5
      const first = sent[0];
      if (first.length > 5) {
        derivedPrefix = first.slice(0, first.length - 5);
      }
    }

    const reconstruct = (input: string) => {
      if (sentSet.has(input)) return input;

      // Try appending to derived prefix
      if (derivedPrefix && /^\d+$/.test(input)) {
        const padded = input.padStart(5, "0");
        const candidate = `${derivedPrefix}${padded}`;
        if (sentSet.has(candidate)) return candidate;
      }
      return input;
    };
    // ----------------------------

    const finalLost = lost.map(reconstruct);
    const finalDamaged = damaged.map(reconstruct);
    let finalReceived: string[] = [];

    if (received.length === 0) {
      // Auto-fill
      const exceptions = new Set([...finalLost, ...finalDamaged]);
      finalReceived = sent.filter((s) => !exceptions.has(s));
    } else {
      finalReceived = received.map(reconstruct);
    }

    // Validation checks (same as FWC)
    const invalidReceived = finalReceived.filter((s) => !sentSet.has(s));
    if (invalidReceived.length)
      throw new ValidationError(`Invalid Received: ${invalidReceived[0]}`);

    const invalidLost = finalLost.filter((s) => !sentSet.has(s));
    if (invalidLost.length)
      throw new ValidationError(`Invalid Lost: ${invalidLost[0]}`);

    const invalidDamaged = finalDamaged.filter((s) => !sentSet.has(s));
    if (invalidDamaged.length)
      throw new ValidationError(`Invalid Damaged: ${invalidDamaged[0]}`);

    const total = finalReceived.length + finalLost.length + finalDamaged.length;
    if (total !== sent.length)
      throw new ValidationError(
        `Count mismatch: sent=${sent.length}, total=${total}`,
      );

    // Verify In Transit
    const cards = await db.card.findMany({
      where: { serialNumber: { in: sent }, status: "IN_TRANSIT" },
      select: { serialNumber: true },
    });
    if (cards.length !== sent.length)
      throw new ValidationError("Status mismatch (not IN_TRANSIT)");

    // DB Transaction
    const transaction = await db.$transaction(async (tx) => {
      // Received -> IN_STATION
      if (finalReceived.length > 0) {
        await tx.card.updateMany({
          where: { serialNumber: { in: finalReceived } },
          data: {
            status: "IN_STATION",
            updatedAt: new Date(),
            updatedBy: validatorUserId,
            stationId: validatorStationId,
          },
        });
      }

      // Helper: Low Stock Check
      if (finalReceived.length > 0 && movement.stationId) {
        const currentStock = await tx.card.count({
          where: {
            stationId: movement.stationId,
            status: "IN_STATION",
            cardProduct: {
              categoryId: movement.categoryId,
              typeId: movement.typeId,
            },
          },
        });
        await LowStockService.checkStock(
          movement.categoryId,
          movement.typeId,
          movement.stationId,
          currentStock,
          tx,
        );
      }

      // Update Movement
      await tx.cardStockMovement.update({
        where: { id: movementId },
        data: {
          status: "APPROVED",
          receivedSerialNumbers: finalReceived,
          lostSerialNumbers: finalLost,
          damagedSerialNumbers: finalDamaged,
          validatedBy: validatorUserId,
          validatedAt: new Date(),
          note: note ?? movement.note,
        },
      });

      // Update Inbox for Supervisor (Mark completed)
      const spvInbox = await tx.inbox.findFirst({
        where: {
          sentTo: validatorUserId,
          type: "STOCK_DISTRIBUTION",
          // approximate match
          createdAt: { gte: new Date(movement.createdAt.getTime() - 60000) },
        },
      });
      // Skip inbox update if not found/implemented logic simpler here.
      // But FWC does it.

      return {
        movementId,
        status: "APPROVED",
        receivedCount: finalReceived.length,
      };
    });

    // Logging
    await ActivityLogService.createActivityLog(
      validatorUserId,
      "VALIDATE_STOCK_OUT_VOUCHER",
      `Validated Stock Out Voucher ${movementId}: Received=${finalReceived.length}, Lost=${finalLost.length}, Damaged=${finalDamaged.length}`,
    );

    return transaction;
  }

  static async getHistory(params: any) {
    const {
      page = 1,
      limit = 10,
      startDate,
      endDate,
      stationId,
      status,
      search,
      stationName,
      categoryName,
      typeName,
    } = params;
    const skip = (page - 1) * limit;
    const where: any = { movementType: "OUT" };

    where.category = { programType: "VOUCHER" };

    if (search) {
      where.OR = [
        { note: { contains: search, mode: "insensitive" } },
        { station: { stationName: { contains: search, mode: "insensitive" } } },
        {
          category: { categoryName: { contains: search, mode: "insensitive" } },
        },
        { cardType: { typeName: { contains: search, mode: "insensitive" } } },
        { notaDinas: { contains: search, mode: "insensitive" } },
        { bast: { contains: search, mode: "insensitive" } },
      ];
    }
    if (stationName)
      where.station = {
        stationName: { contains: stationName, mode: "insensitive" },
      };

    // Date Filters
    if (startDate || endDate) {
      where.movementAt = {};
      if (startDate) where.movementAt.gte = startDate;
      if (endDate) where.movementAt.lte = endDate;
    }
    if (stationId) where.stationId = stationId;
    if (status) where.status = status;
    if (categoryName)
      where.category = {
        ...where.category,
        categoryName: { contains: categoryName, mode: "insensitive" },
      };
    if (typeName)
      where.cardType = {
        typeName: { contains: typeName, mode: "insensitive" },
      };

    const [items, total] = await Promise.all([
      db.cardStockMovement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { movementAt: "desc" },
        include: { category: true, type: true, station: true },
      }),
      db.cardStockMovement.count({ where }),
    ]);

    const userIds = [
      ...new Set(items.map((i) => i.createdBy).filter(Boolean)),
    ] as string[];
    const users = await db.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, fullName: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u.fullName]));

    const mapped = items.map((item) => ({
      id: item.id,
      movementAt: item.movementAt.toISOString(),
      status: item.status,
      batchId: item.batchId,
      quantity: item.quantity,
      stationName: item.station?.stationName || null,
      note: item.note,
      notaDinas: item.notaDinas,
      bast: item.bast,
      createdByName: item.createdBy ? userMap.get(item.createdBy) : null,
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
      receivedSerialNumbers: item.receivedSerialNumbers,
      lostSerialNumbers: item.lostSerialNumbers,
      damagedSerialNumbers: item.damagedSerialNumbers,
    }));

    return {
      items: mapped,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  static async getDetail(id: string) {
    const movement = await db.cardStockMovement.findUnique({
      where: { id },
      include: { category: true, type: true, station: true },
    });
    if (!movement) throw new ValidationError("Not found");

    let createdByName = null;
    if (movement.createdBy) {
      const u = await db.user.findUnique({
        where: { id: movement.createdBy },
        select: { fullName: true },
      });
      createdByName = u?.fullName;
    }
    let validatedByName = null;
    if (movement.validatedBy) {
      const u = await db.user.findUnique({
        where: { id: movement.validatedBy },
        select: { fullName: true },
      });
      validatedByName = u?.fullName;
    }

    return {
      movement: {
        id: movement.id,
        movementAt: movement.movementAt.toISOString(),
        status: movement.status,
        batchId: movement.batchId,
        quantity: movement.quantity,
        note: movement.note,
        notaDinas: movement.notaDinas,
        bast: movement.bast,
        createdAt: movement.createdAt.toISOString(),
        createdByName,
        validatedAt: movement.validatedAt?.toISOString() || null,
        validatedByName,
        station: movement.station
          ? {
              id: movement.station.id,
              name: movement.station.stationName,
              code: movement.station.stationCode,
            }
          : null,
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
        sentSerialNumbers: movement.sentSerialNumbers,
        receivedSerialNumbers: movement.receivedSerialNumbers,
        lostSerialNumbers: movement.lostSerialNumbers,
        damagedSerialNumbers: movement.damagedSerialNumbers,
      },
    };
  }

  static async update(id: string, body: any, userId: string) {
    const movement = await db.cardStockMovement.findUnique({ where: { id } });
    if (!movement) throw new ValidationError("Not found");
    if (movement.status !== "PENDING")
      throw new ValidationError("Cannot update non-pending");

    await db.cardStockMovement.update({
      where: { id },
      data: {
        movementAt: body.movementAt ? new Date(body.movementAt) : undefined,
        stationId: body.stationId,
        note: body.note,
        notaDinas: body.notaDinas,
        bast: body.bast,
        updatedAt: new Date(),
        updatedBy: userId,
      },
    });

    // Logging
    await ActivityLogService.createActivityLog(
      userId,
      "UPDATE_STOCK_OUT_VOUCHER",
      `Updated Stock Out Voucher ${id}`,
    );

    return { id, updatedAt: new Date().toISOString() };
  }

  static async delete(id: string, userId: string) {
    const result = await db.$transaction(async (tx) => {
      const movement = await tx.cardStockMovement.findUnique({ where: { id } });
      if (!movement) throw new ValidationError("Not found");
      if (movement.status !== "PENDING")
        throw new ValidationError("Cannot delete non-pending");

      // Revert cards to IN_OFFICE
      const count = await tx.card.updateMany({
        where: {
          serialNumber: { in: movement.sentSerialNumbers },
          status: "IN_TRANSIT",
        },
        data: {
          status: "IN_OFFICE",
          updatedAt: new Date(),
          updatedBy: userId,
          stationId: null,
        },
      });

      if (count.count !== movement.quantity) {
        throw new ValidationError(
          "Cards are not all IN_TRANSIT. Cannot cancel.",
        );
      }

      await tx.cardStockMovement.delete({ where: { id } });

      return { message: "Cancelled successfully" };
    });

    // Logging
    await ActivityLogService.createActivityLog(
      userId,
      "DELETE_STOCK_OUT_VOUCHER",
      `Deleted Stock Out Voucher ${id}`,
    );

    return result;
  }

  /**
   * Get Available Serials for Stock Out Voucher
   */
  static async getAvailableSerials(cardProductId: string) {
    const count = await db.card.count({
      where: {
        cardProductId: cardProductId,
        status: "IN_OFFICE",
      },
    });

    if (count === 0) {
      return {
        startSerial: null,
        endSerial: null,
        count: 0,
      };
    }

    const firstCard = await db.card.findFirst({
      where: {
        cardProductId: cardProductId,
        status: "IN_OFFICE",
      },
      orderBy: { serialNumber: "asc" },
      select: { serialNumber: true },
    });

    const lastCard = await db.card.findFirst({
      where: {
        cardProductId: cardProductId,
        status: "IN_OFFICE",
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
