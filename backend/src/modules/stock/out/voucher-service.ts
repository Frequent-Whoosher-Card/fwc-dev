import {
  parseFilter,
  prismaFilter,
  parseSmartSearch,
} from "../../../utils/filterHelper";
import db from "../../../config/db";
import { ProgramType, FilePurpose } from "@prisma/client";
import { ValidationError } from "../../../utils/errors";
import { BatchService } from "../../../services/batchService";
import { LowStockService } from "../../../services/lowStockService";
import { ActivityLogService } from "../../activity-log/service";
import { uploadStockFile, deleteStockFile } from "../../../utils/fileUpload";

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
    notaDinasFile?: File,
    bastFile?: File,
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
      orderBy: { serialNumber: "asc" },
    });

    if (cards.length === 0) {
      throw new ValidationError(
        "Tidak ada voucher Available (IN_OFFICE) dalam range serial yang dipilih.",
      );
    }

    // Skip missing cards validation to support filling gaps in range.
    // Proceed with whatever is IN_OFFICE.

    const sentCount = cards.length;
    const skippedCount = count - sentCount;

    // Station Info
    const station = await db.station.findUnique({
      where: { id: stationId },
      select: { stationName: true },
    });
    const stationName = station?.stationName || "Station";

    // --- HANDLE FILE UPLOADS ---
    let notaDinasFileId: string | null = null;
    let bastFileId: string | null = null;

    if (notaDinasFile) {
      notaDinasFileId = await uploadStockFile(
        notaDinasFile,
        userId,
        FilePurpose.STOCK_OUT_NOTA, // Ensure this enum exists or allow if using string based
        "stock-out",
        notaDinas,
      );
    }

    if (bastFile) {
      bastFileId = await uploadStockFile(
        bastFile,
        userId,
        FilePurpose.STOCK_OUT_BAST, // Ensure this enum exists
        "stock-out",
        bast,
      );
    }
    // ---------------------------

    // --- TRANSACTION ---
    let transaction;
    try {
      transaction = await db.$transaction(
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
              stationId: stationId,
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

          // Use ACTUAL processed/found cards, not the requested full range
          const finalSerials = cards.map((c) => c.serialNumber);

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
              notaDinasFileId, // New
              bastFileId, // New
              sentSerialNumbers: finalSerials, // CORRECTED: Use actual serials
              receivedSerialNumbers: [],
              lostSerialNumbers: [],
              createdAt: new Date(),
              createdBy: userId,
            },
          });

          // Inbox Notification
          // Inbox Notification (Scoped Broadcast)
          const productName = `${cardProduct.category.categoryName} - ${cardProduct.type.typeName}`;

          await tx.inbox.create({
            data: {
              title: `Kiriman Voucher: ${productName}`,
              message: `Office mengirim ${sentCount} voucher ${productName} (Prod: ${d.toISOString().split("T")[0]}) ke stasiun ${stationName}.`,
              targetRoles: ["supervisor"],
              sentTo: null,
              sentBy: userId,
              stationId: stationId, // Scoped to this station
              type: "STOCK_DISTRIBUTION",
              programType: ProgramType.VOUCHER,
              payload: {
                movementId: movement.id,
                cardProductId,
                quantity: sentCount,
                status: "PENDING",
                serialDate: d.toISOString(),
                serials: finalSerials, // CORRECTED: Use actual serials
              },
              isRead: false,
              readByUserIds: [],
              createdAt: new Date(),
            },
          });

          // Construct Custom Message
          const message = `Stock Out Berhasil. Permintaan: ${count}. (Terproses: ${sentCount}, Dilewati/Tidak Tersedia: ${skippedCount})`;

          return {
            success: true,
            message,
            data: {
              movementId: movement.id,
              status: movement.status,
              requestedCount: count,
              sentCount,
              skippedCount,
            },
          };
        },
        { maxWait: 5000, timeout: 10000 },
      );
    } catch (error) {
      if (notaDinasFileId) await deleteStockFile(notaDinasFileId);
      if (bastFileId) await deleteStockFile(bastFileId);
      throw error;
    }

    // Logging
    await ActivityLogService.createActivityLog(
      userId,
      "CREATE_STOCK_OUT_VOUCHER",
      `Stock Out Voucher created: ${sentCount} vouchers to ${stationName}. (Req: ${count}, Skip: ${skippedCount})`,
    );

    // --- POST-TRANSACTION TRIGGER ---
    const currentStock = await db.card.count({
      where: {
        status: "IN_OFFICE",
        cardProductId: cardProductId,
      },
    });

    await LowStockService.checkStock(
      cardProduct.categoryId,
      cardProduct.typeId,
      null, // Office Scope
      currentStock,
    );

    // 2. Send Push Notification to Supervisor
    const productName = `${cardProduct.category.categoryName} - ${cardProduct.type.typeName}`;
    const pushTitle = `Kiriman Voucher: ${productName}`;
    const pushMessage = `Office mengirim ${sentCount} voucher ${productName} ke stasiun ${stationName}.`;

    // Fire and forget
    const { PushNotificationService } =
      await import("../../notification/push-service");
    PushNotificationService.sendToRoleAtStation(
      "supervisor",
      stationId,
      pushTitle,
      pushMessage,
      { type: "VOUCHER" },
    );
    // --------------------------------

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
      const validatorUser = await tx.user.findUnique({
        where: { id: validatorUserId },
        select: { fullName: true },
      });
      const localReporterName = validatorUser?.fullName || "Unknown Supervisor";

      const spvInbox = await tx.inbox.findFirst({
        where: {
          type: "STOCK_DISTRIBUTION",
          payload: {
            path: ["movementId"],
            equals: movementId,
          },
          OR: [
            { sentTo: validatorUserId },
            {
              stationId: {
                in: [movement.toStationId, movement.stationId].filter(
                  Boolean,
                ) as string[],
              },
              targetRoles: { has: "supervisor" },
            },
          ],
        },
      });

      if (spvInbox) {
        const oldPayload = (spvInbox.payload as any) || {};
        await tx.inbox.update({
          where: { id: spvInbox.id },
          data: {
            isRead: true,
            readAt: new Date(),
            title: `[SELESAI] ${spvInbox.title.replace("[SELESAI] ", "")}`,
            payload: {
              ...oldPayload,
              status: "COMPLETED",
              validationResult: {
                received: finalReceived.length,
                lost: finalLost.length,
                damaged: finalDamaged.length,
                validatedAt: new Date(),
                validatedByName: localReporterName,
                lostSerialNumbers: finalLost,
                damagedSerialNumbers: finalDamaged,
              },
            },
          },
        });
      }

      // 9) NOTIFIKASI KE ADMIN (Selalu kirim)
      const hasIssue = finalLost.length > 0 || finalDamaged.length > 0;
      const admins = await tx.user.findMany({
        where: {
          role: { roleCode: { in: ["admin", "superadmin"] } },
          isActive: true,
        },
        select: { id: true },
      });

      if (admins.length > 0) {
        const station = await tx.station.findUnique({
          where: { id: validatorStationId },
          select: { stationName: true },
        });
        const stationName = station?.stationName || "Unknown Station";

        let title = "Laporan Isu Stok (Voucher)";
        let message = "";
        let type = "STOCK_ISSUE_REPORT";
        let statusLabel = "PENDING_APPROVAL";

        if (!hasIssue) {
          title = "Konfirmasi Penerimaan Stok (Voucher)";
          message = `Station ${stationName} telah menerima ${finalReceived.length} voucher dengan lengkap.`;
          type = "STOCK_DISTRIBUTION_SUCCESS";
          statusLabel = "COMPLETED";
        } else {
          const issueDetails = [];
          if (finalLost.length) issueDetails.push(`${finalLost.length} Hilang`);
          if (finalDamaged.length)
            issueDetails.push(`${finalDamaged.length} Rusak`);
          message = `Laporan Isu dari Station (VOUCHER): ${issueDetails.join(", ")}. Mohon tinjau dan setujui perubahan status.`;
        }

        await tx.inbox.create({
          data: {
            title,
            message,
            targetRoles: ["admin", "superadmin"],
            sentTo: null,
            sentBy: validatorUserId,
            stationId: validatorStationId,
            type: type as any,
            programType: ProgramType.VOUCHER,
            payload: {
              movementId,
              stationId: validatorStationId,
              reporterName: localReporterName,
              lostCount: finalLost.length,
              damagedCount: finalDamaged.length,
              receivedCount: finalReceived.length,
              lostSerialNumbers: finalLost,
              damagedSerialNumbers: finalDamaged,
              status: statusLabel,
            },
            isRead: false,
            readByUserIds: [],
            createdAt: new Date(),
          },
        });

        // --- PUSH NOTIFICATION TO ADMINS (Moved Outside) ---
        return {
          movementId,
          status: "APPROVED",
          receivedCount: finalReceived.length,
          lostCount: finalLost.length,
          damagedCount: finalDamaged.length,
           // metadata for notification
           notification: {
             trigger: true,
             title,
             message
          }
        };
      }

      return {
        movementId,
        status: "APPROVED",
        receivedCount: finalReceived.length,
        lostCount: finalLost.length,
        damagedCount: finalDamaged.length,
      };
    });

    // --- POST-TRANSACTION NOTIFICATION ---
    if ((transaction as any).notification?.trigger) {
      const { title, message } = (transaction as any).notification;
      // Fire and forget
      const { PushNotificationService } = await import("../../notification/push-service");
      PushNotificationService.sendToRole(["admin", "superadmin"], title, message);
    }
    // -------------------------------------

    // Logging
    await ActivityLogService.createActivityLog(
      validatorUserId,
      "VALIDATE_STOCK_OUT_VOUCHER",
      `Validated Stock Out Voucher ${movementId}: Received=${transaction.receivedCount}, Lost=${transaction.lostCount}, Damaged=${transaction.damagedCount}`,
    );

    return transaction;
  }

  static async getHistory(params: {
    page?: number;
    limit?: number;
    startDate?: Date;
    endDate?: Date;
    stationId?: string;
    categoryId?: string;
    typeId?: string;
    status?: string;
    categoryName?: string;
    typeName?: string;
    stationName?: string;
    search?: string;
  }) {
    const {
      page = 1,
      limit = 10,
      startDate,
      endDate,
      stationId,
      status,
    } = params;
    const skip = (page - 1) * limit;

    const where: any = {
      movementType: "OUT",
      category: {
        programType: "VOUCHER",
      },
      ...parseSmartSearch(params.search || "", [
        "note",
        "station.stationName",
        "category.categoryName",
        "type.typeName",
        "notaDinas",
        "bast",
        "batchId",
        "category.categoryCode",
        "type.typeCode",
      ]),
    };

    if (stationId) {
      where.stationId = prismaFilter(stationId);
    }

    if (params.categoryId) {
      where.categoryId = prismaFilter(params.categoryId);
    }

    if (params.typeId) {
      where.typeId = prismaFilter(params.typeId);
    }

    if (status) {
      where.status = prismaFilter(status);
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

    if (startDate && endDate) {
      where.movementAt = {
        gte: startDate,
        lte: endDate,
      };
    } else if (startDate) {
      where.movementAt = { gte: startDate };
    } else if (endDate) {
      where.movementAt = { lte: endDate };
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
          station: true,
          notaDinasFile: true,
          bastFile: true,
        },
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
      notaDinasFile: item.notaDinasFile
        ? {
            id: item.notaDinasFile.id,
            url: item.notaDinasFile.relativePath,
            filename: item.notaDinasFile.originalName,
          }
        : null,
      bastFile: item.bastFile
        ? {
            id: item.bastFile.id,
            url: item.bastFile.relativePath,
            filename: item.bastFile.originalName,
          }
        : null,
      createdByName: item.createdBy ? userMap.get(item.createdBy) : null,
      cardCategory: {
        id: item.category.id,
        name: item.category.categoryName,
        code: item.category.categoryCode,
        programType: item.category.programType as "FWC" | "VOUCHER" | null,
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
      include: {
        category: true,
        type: true,
        station: true,
        notaDinasFile: true,
        bastFile: true,
      },
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
        notaDinasFile: movement.notaDinasFile
          ? {
              id: movement.notaDinasFile.id,
              url: movement.notaDinasFile.relativePath,
              filename: movement.notaDinasFile.originalName,
            }
          : null,
        bastFile: movement.bastFile
          ? {
              id: movement.bastFile.id,
              url: movement.bastFile.relativePath,
              filename: movement.bastFile.originalName,
            }
          : null,
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
          programType: movement.category.programType as
            | "FWC"
            | "VOUCHER"
            | null,
        },
        cardType: {
          id: movement.type.id,
          name: movement.type.typeName,
          code: movement.type.typeCode,
        },
        sentSerialNumbers: movement.sentSerialNumbers.sort(),
        receivedSerialNumbers: movement.receivedSerialNumbers.sort(),
        lostSerialNumbers: movement.lostSerialNumbers.sort(),
        damagedSerialNumbers: (movement.damagedSerialNumbers ?? []).sort(),
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

      // Delete Inbox
      await tx.inbox.deleteMany({
        where: {
          type: "STOCK_DISTRIBUTION",
          payload: {
            path: ["movementId"],
            equals: id,
          },
        },
      });

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
    // 1. Get Count
    const count = await db.card.count({
      where: {
        cardProductId: cardProductId,
        status: "IN_OFFICE",
      },
    });

    if (count === 0) {
      throw new ValidationError(
        "Stok voucher untuk produk ini habis / tidak tersedia (0 IN_OFFICE).",
      );
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
