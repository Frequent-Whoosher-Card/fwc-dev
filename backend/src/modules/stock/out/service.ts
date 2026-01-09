<<<<<<< HEAD
import db from "../../../config/db";
import { ValidationError } from "../../../utils/errors";
import { parseSmartSerial } from "../../../utils/serialHelper";
import { InboxService } from "../../inbox/service";

function normalizeSerials(arr: string[]) {
  return Array.from(
    new Set((arr ?? []).map((s) => (s ?? "").trim()).filter(Boolean))
  );
}

type DistributionNote = {
  note?: string | null;
  sentSerialNumbers?: string[];
  // bisa ada field lain
};

export class StockOutService {
  /**
   * Create stock out
   */
  static async stockOutDistribution(
    movementAt: Date,
    categoryId: string,
    typeId: string,
    stationId: string,
    startSerial: string,
    endSerial: string,
    userId: string,
    note?: string
  ) {
    // 1. Validate Input - Basic Regex Only (remove strict length checks)
    if (!/^\d+$/.test(startSerial) || !/^\d+$/.test(endSerial)) {
      if (/[a-zA-Z]/.test(startSerial) || /[a-zA-Z]/.test(endSerial)) {
        throw new ValidationError("Input harus berupa angka.");
      }
      throw new ValidationError(
        "startSerial dan endSerial harus berupa digit string"
      );
    }

    const transaction = await db.$transaction(async (tx) => {
      // Find valid Card Product first
      const cardProduct = await tx.cardProduct.findUnique({
        where: {
          unique_category_type: {
            categoryId,
            typeId,
          },
        },
        select: { id: true, serialTemplate: true },
      });

      if (!cardProduct) {
        throw new ValidationError(
          "Produk kartu untuk Kategori & Tipe ini belum terdaftar."
        );
      }

      const { id: cardProductId, serialTemplate } = cardProduct;
      const suffixLength = 5;
      const yearSuffix = movementAt.getFullYear().toString().slice(-2);

      // --- SMART PARSING ---
      const startNum = parseSmartSerial(
        startSerial,
        serialTemplate,
        yearSuffix
      );
      const endNum = parseSmartSerial(endSerial, serialTemplate, yearSuffix);

      if (endNum < startNum) {
        throw new ValidationError(
          "endSerial harus lebih besar atau sama dengan startSerial"
        );
      }

      const count = endNum - startNum + 1;
      if (count > 10000) {
        throw new ValidationError(
          "Maksimal distribusi 10.000 kartu per transaksi"
        );
      }
      // ---------------------

      // 2. Generate Full List
      const sent = Array.from({ length: count }, (_, i) => {
        const sfx = String(startNum + i).padStart(suffixLength, "0");
        return `${serialTemplate}${yearSuffix}${sfx}`;
      });

      // 1) Soft Validation: Cek ketersediaan Inventory Office
      // Kita ambil ID-nya untuk locking di langkah selanjutnya
      const officeInv = await tx.cardInventory.findFirst({
        where: {
          categoryId,
          typeId,
          stationId: null, // Office
        },
        select: { id: true, cardOffice: true },
      });

      if (!officeInv) {
        throw new ValidationError(
          "Inventory OFFICE belum tersedia untuk kategori/tipe ini"
        );
      }

      // Check awal (soft check) agar error message lebih jelas sebelum kena race condition check
      // Note: Casting as any karena cardOffice bisa nullable di schema, meski logicnya harusnya int
      const currentStock = (officeInv as any).cardOffice || 0;
      if (currentStock < sent.length) {
        throw new ValidationError(
          `Stok OFFICE tidak cukup. Tersedia: ${currentStock}, dibutuhkan: ${sent.length}`
        );
      }

      // 2) Kumpulkan ID Kartu dari Serial Number
      const cards = await tx.card.findMany({
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

        // Analisis kenapa missing (apakah status bukan IN_OFFICE atau memang tidak ada)
        const invalidCards = await tx.card.findMany({
          where: {
            serialNumber: { in: missing },
            cardProductId,
          },
          select: { serialNumber: true, status: true },
        });

        const statusMap = new Map(
          invalidCards.map((c) => [c.serialNumber, c.status])
        );

        const alreadyDistributed = [];
        const notFound = [];

        for (const sn of missing) {
          const status = statusMap.get(sn);
          if (status) {
            alreadyDistributed.push(`${sn} (${status})`);
          } else {
            notFound.push(sn);
          }
        }

        let errMsg = "Validasi Gagal:";
        if (alreadyDistributed.length > 0) {
          errMsg += ` Serial berikut bukan status IN_OFFICE (sudah terdistribusi/rusak/dll): ${alreadyDistributed.join(", ")}.`;
        }
        if (notFound.length > 0) {
          errMsg += ` Serial berikut tidak ditemukan di database (Belum Stock In?): ${notFound.join(", ")}.`;
        }

        throw new ValidationError(errMsg);
      }

      const sentCount = cards.length;

      // 3) Atomic Inventory Update (Kunci utama mencegah stok minus)
      // Kita gunakan updateMany dengan filter cardOffice >= sentCount
      // Jika hasil update count = 0, berarti saat dieksekusi stok sudah berkurang drastis (Race Condition)
      const updateInvResult = await tx.cardInventory.updateMany({
        where: {
          id: officeInv.id,
          cardOffice: { gte: sentCount },
        },
        data: {
          cardOffice: { decrement: sentCount },
          updatedAt: new Date(),
          updatedBy: userId,
        },
      });

      if (updateInvResult.count === 0) {
        throw new ValidationError(
          "Gagal memproses transaksi: Stok OFFICE berubah saat diproses (Insufficient Stock)"
        );
      }

      // 4) Atomic Card Status Update
      // Pastikan status MASIH IN_OFFICE saat di-update
      const updateCardResult = await tx.card.updateMany({
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

      if (updateCardResult.count !== sentCount) {
        // Jika jumlah yang terupdate tidak sama, berarti ada kartu yang statusnya berubah tiba-tiba
        throw new ValidationError(
          "Gagal memproses transaksi: Status beberapa kartu berubah saat diproses (Double Booking)"
        );
      }

      // 5) Create movement OUT PENDING
      const movement = await tx.cardStockMovement.create({
        data: {
          movementAt,
          type: "OUT",
          status: "PENDING",
          categoryId,
          typeId,
          stationId,
          quantity: sentCount,
          note: note ?? null,

          sentSerialNumbers: sent,
          receivedSerialNumbers: [],
          lostSerialNumbers: [],

          createdAt: new Date(),
          createdBy: userId,
        },
      });

      return {
        movementId: movement.id,
        status: movement.status,
        sentCount,
      };
    });

    return transaction;
  }

  /**
   * Validasi Stock Out Receipe
   */
  static async validateStockOutReceipe(
    movementId: string,
    receivedSerialNumbers: string[],
    lostSerialNumbers: string[] | undefined,
    damagedSerialNumbers: string[] | undefined,
    validatorUserId: string,
    validatorStationId: string,
    note?: string
  ) {
    const received = normalizeSerials(receivedSerialNumbers);
    const lost = normalizeSerials(lostSerialNumbers || []);
    const damaged = normalizeSerials(damagedSerialNumbers || []);

    // Tidak boleh overlap
    const lostSet = new Set(lost);
    const damagedSet = new Set(damaged);
    const receivedSet = new Set(received);

    // Overlap checks
    // 1. Received vs Lost
    const overlapRL = received.find((s) => lostSet.has(s));
    if (overlapRL)
      throw new ValidationError(
        `Serial tidak boleh overlap received & lost: ${overlapRL}`
      );

    // 2. Received vs Damaged
    const overlapRD = received.find((s) => damagedSet.has(s));
    if (overlapRD)
      throw new ValidationError(
        `Serial tidak boleh overlap received & damaged: ${overlapRD}`
      );

    // 3. Lost vs Damaged
    const overlapLD = lost.filter((s) => damagedSet.has(s));
    if (overlapLD.length)
      throw new ValidationError(
        `Serial tidak boleh overlap lost & damaged: ${overlapLD.join(", ")}`
      );

    const transaction = await db.$transaction(async (tx) => {
      // 1) Ambil movement
      const movement = await tx.cardStockMovement.findUnique({
        where: { id: movementId },
      });

      if (!movement) throw new ValidationError("Movement tidak ditemukan");
      if (movement.type !== "OUT")
        throw new ValidationError("Movement bukan tipe OUT");
      if (movement.status !== "PENDING")
        throw new ValidationError("Movement bukan status PENDING");
      if (!movement.stationId)
        throw new ValidationError("Movement OUT harus memiliki stationId");

      // 2) Petugas hanya boleh validasi stasiunnya sendiri
      if (movement.stationId !== validatorStationId) {
        throw new ValidationError(
          "Petugas tidak berhak memvalidasi distribusi untuk stasiun lain"
        );
      }

      // 3) Ambil sent serial dari kolom array
      const sent = normalizeSerials((movement as any).sentSerialNumbers ?? []);
      if (!sent.length)
        throw new ValidationError("Movement tidak memiliki sentSerialNumbers");

      const sentSet = new Set(sent);

      // --- SMART SERIAL RECONSTRUCTION START ---
      // Get Card Product to know the template
      const cardProduct = await tx.cardProduct.findUnique({
        where: {
          unique_category_type: {
            categoryId: movement.categoryId,
            typeId: movement.typeId,
          },
        },
        select: { id: true, serialTemplate: true },
      });

      const yearSuffix = movement.movementAt.getFullYear().toString().slice(-2);
      const template = cardProduct?.serialTemplate || "";

      const reconstruct = (input: string) => {
        // If exact match exists, return it
        if (sentSet.has(input)) return input;

        // If input is short digits (e.g. "1"), try to format it
        if (/^\d+$/.test(input) && template) {
          const padded = input.padStart(5, "0");
          const full = `${template}${yearSuffix}${padded}`;
          if (sentSet.has(full)) return full;
        }
        return input; // return original if reconstruction fails
      };

      const finalLost = lost.map(reconstruct);
      const finalDamaged = damaged.map(reconstruct);

      // --- SMART FILL LOGIC START ---
      let finalReceived: string[] = [];

      // If received is empty, we attempt to fill it with remaining items
      if (received.length === 0) {
        // Must validate lost/damaged first
        const invalidLost = finalLost.filter((s) => !sentSet.has(s));
        if (invalidLost.length)
          throw new ValidationError(
            `Lost serial invalid (tidak ada di pengiriman): ${invalidLost.join(", ")}`
          );

        const invalidDamaged = finalDamaged.filter((s) => !sentSet.has(s));
        if (invalidDamaged.length)
          throw new ValidationError(
            `Damaged serial invalid (tidak ada di pengiriman): ${invalidDamaged.join(", ")}`
          );

        const exceptions = new Set([...finalLost, ...finalDamaged]);
        // All sent Items that are NOT lost or damaged are considered RECEIVED
        finalReceived = sent.filter((s) => !exceptions.has(s));
      } else {
        // If user provided received items explicitly
        finalReceived = received.map(reconstruct);
        const invalidReceived = finalReceived.filter((s) => !sentSet.has(s));

        if (invalidReceived.length)
          throw new ValidationError(
            `Received serial invalid (tidak ada di pengiriman): ${invalidReceived.join(", ")}`
          );
      }
      // --- SMART FILL LOGIC END ---

      // Final subset check for lost/damaged (redundant if smart fill path taken, but safe)
      const invalidLost = finalLost.filter((s) => !sentSet.has(s));
      const invalidDamaged = finalDamaged.filter((s) => !sentSet.has(s));

      if (invalidLost.length)
        throw new ValidationError(
          `Lost serial invalid (tidak ada di pengiriman): ${invalidLost.join(", ")}`
        );
      if (invalidDamaged.length)
        throw new ValidationError(
          `Damaged serial invalid (tidak ada di pengiriman): ${invalidDamaged.join(", ")}`
        );

      // jumlah harus pas
      const totalInput =
        finalReceived.length + finalLost.length + finalDamaged.length;
      if (totalInput !== sent.length || totalInput !== movement.quantity) {
        throw new ValidationError(
          `Jumlah serial tidak cocok. shipment=${movement.quantity}, input=${totalInput} (received=${finalReceived.length}, lost=${finalLost.length}, damaged=${finalDamaged.length})`
        );
      }

      // 4) Pastikan semua kartu shipment masih IN_TRANSIT (mencegah double-process)
      const cards = await tx.card.findMany({
        where: {
          serialNumber: { in: sent },
          status: "IN_TRANSIT",
          cardProductId: cardProduct?.id,
        },
        select: { serialNumber: true },
      });

      if (cards.length !== sent.length) {
        const found = new Set(cards.map((c) => c.serialNumber));
        const missing = sent.filter((s) => !found.has(s));
        throw new ValidationError(
          `Sebagian kartu tidak berstatus IN_TRANSIT: ${missing.join(", ")}`
        );
      }

      // 5) Update status kartu
      if (finalReceived.length) {
        await tx.card.updateMany({
          where: { serialNumber: { in: finalReceived } },
          data: {
            status: "IN_STATION",
            updatedAt: new Date(),
            updatedBy: validatorUserId,
          },
        });
      }

      if (finalLost.length) {
        await tx.card.updateMany({
          where: { serialNumber: { in: finalLost } },
          data: {
            status: "LOST",
            updatedAt: new Date(),
            updatedBy: validatorUserId,
          },
        });
      }

      if (finalDamaged.length) {
        await tx.card.updateMany({
          where: { serialNumber: { in: finalDamaged } },
          data: {
            status: "DAMAGED",
            updatedAt: new Date(),
            updatedBy: validatorUserId,
          },
        });
      }

      // 6) Update inventory stasiun (yang diterima saja)
      const receivedCount = finalReceived.length;

      if (receivedCount > 0) {
        // Validasi di awal menjamin stationId ada
        const stationId = movement.stationId!;

        await tx.cardInventory.upsert({
          where: {
            unique_category_type_station: {
              categoryId: movement.categoryId,
              typeId: movement.typeId,
              stationId: stationId,
            },
          },
          create: {
            categoryId: movement.categoryId,
            typeId: movement.typeId,
            stationId: stationId,
            cardBelumTerjual: receivedCount,
            cardOffice: 0,
            cardBeredar: receivedCount,
            cardAktif: 0,
            cardNonAktif: 0,
            createdAt: new Date(),
            createdBy: validatorUserId,
            updatedAt: new Date(),
            updatedBy: validatorUserId,
          },
          update: {
            cardBeredar: { increment: receivedCount },
            cardBelumTerjual: { increment: receivedCount },
            updatedAt: new Date(),
            updatedBy: validatorUserId,
          },
        });
      }

      // 7) Update movement -> APPROVED + simpan hasil arrays + audit
      await tx.cardStockMovement.update({
        where: { id: movementId, status: "PENDING" },
        data: {
          status: "APPROVED",
          receivedSerialNumbers: finalReceived,
          lostSerialNumbers: finalLost,
          damagedSerialNumbers: finalDamaged,
          validatedBy: validatorUserId,
          validatedAt: new Date(),
          note: note ?? movement.note ?? null,
        } as any,
      });

      // 8) SEND NOTIFICATION (INBOX) - ALWAYS
      // We do this asynchronously or inside transaction (safe inside tx)
      // Need to fetch station name first
      const station = await tx.station.findUnique({
        where: { id: movement.stationId! },
        select: { stationName: true },
      });
      const stationName = station?.stationName || "Unknown Station";

      const title = "Laporan Validasi Stock Out";
      let message = `Laporan dari ${stationName}: Validasi Stock Out Berhasil.`;

      const msgParts = [];
      if (finalReceived.length)
        msgParts.push(`${finalReceived.length} DITERIMA`);
      if (finalLost.length) msgParts.push(`${finalLost.length} HILANG`);
      if (finalDamaged.length) msgParts.push(`${finalDamaged.length} RUSAK`);

      if (msgParts.length) {
        message = `Laporan dari ${stationName}: ${msgParts.join(", ")} pada pengiriman tanggal ${movement.movementAt.toISOString().split("T")[0]}.`;
      }

      await InboxService.broadcastToAdmins(
        title,
        message,
        validatorUserId,
        movement.stationId!,
        "STOCK_OUT_REPORT",
        {
          movementId,
          receivedCount: finalReceived.length,
          lostCount: finalLost.length,
          damagedCount: finalDamaged.length,
          receivedSerialNumbers: finalReceived, // Optional, might be too big if thousands
          lostSerialNumbers: finalLost,
          damagedSerialNumbers: finalDamaged,
        }
      );

      return {
        movementId,
        status: "APPROVED",
        receivedCount: finalReceived.length,
        lostCount: finalLost.length,
        damagedCount: finalDamaged.length,
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
    stationId?: string;
    status?: string;
    search?: string;
    stationName?: string;
    categoryName?: string;
    typeName?: string;
  }) {
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

    const where: any = {
      type: "OUT",
    };

    // --- CASE INSENSITIVE SEARCH LOGIC ---
    if (search) {
      where.OR = [
        { note: { contains: search, mode: "insensitive" } },
        {
          station: {
            stationName: { contains: search, mode: "insensitive" },
          },
        },
        {
          category: {
            categoryName: { contains: search, mode: "insensitive" },
          },
        },
        {
          cardType: {
            typeName: { contains: search, mode: "insensitive" },
          },
        },
      ];
    }

    // Specific Filters (Case Insensitive)
    if (stationName) {
      where.station = {
        ...where.station,
        stationName: { contains: stationName, mode: "insensitive" },
      };
    }

    if (categoryName) {
      where.category = {
        ...where.category,
        categoryName: { contains: categoryName, mode: "insensitive" },
      };
    }

    if (typeName) {
      where.cardType = {
        ...where.cardType,
        typeName: { contains: typeName, mode: "insensitive" },
      };
    }
    // -------------------------------------

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

    if (stationId) {
      where.stationId = stationId;
    }

    if (status) {
      where.status = status.toUpperCase();
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
          station: true,
        },
      }),
      db.cardStockMovement.count({ where }),
    ]);

    const userIds = [...new Set(items.map((i) => i.createdBy).filter(Boolean))];
    const users = await db.user.findMany({
      where: { id: { in: userIds as string[] } },
      select: { id: true, fullName: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u.fullName]));

    const mappedItems = items.map((item) => ({
      id: item.id,
      movementAt: item.movementAt.toISOString(),
      status: item.status,
      quantity: item.quantity,
      stationName: item.station?.stationName || null,
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
      sentSerialNumbers: item.sentSerialNumbers,
      receivedSerialNumbers: item.receivedSerialNumbers,
      lostSerialNumbers: item.lostSerialNumbers,
      damagedSerialNumbers: item.damagedSerialNumbers,
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
        station: true,
      },
    });

    if (!movement) {
      throw new ValidationError("Data tidak ditemukan");
    }

    if (movement.type !== "OUT") {
      throw new ValidationError("Bukan transaksi Stock Out");
    }

    let createdByName: string | null = null;
    let validatedByName: string | null = null;

    const userIds = [movement.createdBy, movement.validatedBy].filter(
      Boolean
    ) as string[];

    if (userIds.length > 0) {
      const users = await db.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, fullName: true },
      });
      const uMap = new Map(users.map((u) => [u.id, u.fullName]));
      if (movement.createdBy)
        createdByName = uMap.get(movement.createdBy) || null;
      if (movement.validatedBy)
        validatedByName = uMap.get(movement.validatedBy) || null;
    }

    return {
      movement: {
        id: movement.id,
        movementAt: movement.movementAt.toISOString(),
        status: movement.status,
        quantity: movement.quantity,
        note: movement.note,
        createdAt: movement.createdAt.toISOString(),
        createdByName,
        validatedAt: movement.validatedAt
          ? movement.validatedAt.toISOString()
          : null,
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
          id: movement.cardType.id,
          name: movement.cardType.typeName,
          code: movement.cardType.typeCode,
        },
        sentSerialNumbers: movement.sentSerialNumbers,
        receivedSerialNumbers: movement.receivedSerialNumbers,
        lostSerialNumbers: movement.lostSerialNumbers,
        damagedSerialNumbers: (movement as any).damagedSerialNumbers ?? [],
      },
    };
  }
  /**
   * Update Stock Out (Restricted)
   */
  static async update(
    id: string,
    body: {
      movementAt?: string;
      stationId?: string;
      note?: string;
      startSerial?: string;
      endSerial?: string;
    },
    userId: string
  ) {
    const movement = await db.cardStockMovement.findUnique({
      where: { id },
    });

    if (!movement) {
      throw new ValidationError("Data tidak ditemukan");
    }

    if (movement.type !== "OUT") {
      throw new ValidationError("Bukan transaksi Stock Out");
    }

    const transaction = await db.$transaction(async (tx) => {
      const dataToUpdate: any = {
        updatedBy: userId,
      };

      if (body.movementAt) {
        dataToUpdate.movementAt = new Date(body.movementAt);
      }

      if (body.note !== undefined) {
        dataToUpdate.note = body.note;
      }

      // Station Check
      if (body.stationId && body.stationId !== movement.stationId) {
        if (movement.status !== "PENDING") {
          throw new ValidationError(
            "Tidak dapat mengubah tujuan stasiun karena status sudah " +
              movement.status
          );
        }
        dataToUpdate.stationId = body.stationId;
      }

      // --- SERIAL NUMBER UPDATE LOGIC ---
      if (body.startSerial && body.endSerial) {
        if (movement.status !== "PENDING") {
          throw new ValidationError(
            "Tidak dapat mengubah stock karena status sudah " + movement.status
          );
        }

        // 1. REVERT EXISTING STOCK (Logic mirip delete pending)
        const oldSent = normalizeSerials(
          (movement as any).sentSerialNumbers ?? []
        );
        if (oldSent.length > 0) {
          // Revert Cards -> IN_OFFICE
          await tx.card.updateMany({
            where: { serialNumber: { in: oldSent } },
            data: { status: "IN_OFFICE", updatedAt: new Date() },
          });

          // Revert Inventory
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
                cardOffice: { increment: oldSent.length },
                updatedAt: new Date(),
                updatedBy: userId,
              },
            });
          }
        }

        // 2. PREPARE NEW STOCK (Logic mirip create)
        // 2. PREPARE NEW STOCK (Logic mirip create)
        // Validation
        const startSerial = body.startSerial;
        const endSerial = body.endSerial;

        if (!/^\d+$/.test(startSerial) || !/^\d+$/.test(endSerial)) {
          if (/[a-zA-Z]/.test(startSerial) || /[a-zA-Z]/.test(endSerial)) {
            throw new ValidationError("Input harus berupa angka.");
          }
          throw new ValidationError(
            "startSerial dan endSerial harus berupa digit string"
          );
        }

        // Determine Date
        const mDate = body.movementAt
          ? new Date(body.movementAt)
          : movement.movementAt;
        const yearSuffix = mDate.getFullYear().toString().slice(-2);

        // Fetch Product First for Template
        const cardProduct = await tx.cardProduct.findFirst({
          where: { categoryId: movement.categoryId, typeId: movement.typeId },
          select: { id: true, serialTemplate: true },
        });
        if (!cardProduct) throw new ValidationError("Produk tidak ditemukan");

        // --- SMART PARSING ---
        const startNum = parseSmartSerial(
          startSerial,
          cardProduct.serialTemplate,
          yearSuffix
        );
        const endNum = parseSmartSerial(
          endSerial,
          cardProduct.serialTemplate,
          yearSuffix
        );
        // ---------------------

        if (endNum < startNum)
          throw new ValidationError("endSerial harus >= startSerial");

        const count = endNum - startNum + 1;
        if (count > 10000) throw new ValidationError("Maksimal 10.000 kartu");

        const suffixLength = 5;

        const newSent = Array.from({ length: count }, (_, i) => {
          const sfx = String(startNum + i).padStart(suffixLength, "0");
          return `${cardProduct.serialTemplate}${yearSuffix}${sfx}`;
        });

        // 3. CHECK & DEDUCT NEW STOCK
        const officeInv = await tx.cardInventory.findFirst({
          where: {
            categoryId: movement.categoryId,
            typeId: movement.typeId,
            stationId: null,
          },
        });
        if (!officeInv)
          throw new ValidationError("Inventory Office tidak ditemukan");

        // Check availability
        const currentStock = (officeInv as any).cardOffice || 0;
        if (currentStock < count) {
          throw new ValidationError(
            `Stok OFFICE tidak cukup untuk update ini. Tersedia: ${currentStock}, Butuh: ${count}`
          );
        }

        // Check cards IN_OFFICE
        const cards = await tx.card.findMany({
          where: { serialNumber: { in: newSent }, status: "IN_OFFICE" },
          select: { id: true, serialNumber: true }, // Add serialNumber
        });
        if (cards.length !== count) {
          const found = new Set(cards.map((c) => c.serialNumber));
          const missing = newSent.filter((sn) => !found.has(sn));

          // Analisis detail kenapa missing (sama seperti create)
          const invalidCards = await tx.card.findMany({
            where: {
              serialNumber: { in: missing },
              cardProductId: cardProduct.id, // Fix variable name
            },
            select: { serialNumber: true, status: true },
          });

          const statusMap = new Map(
            invalidCards.map((c) => [c.serialNumber, c.status])
          );

          const alreadyDistributed = [];
          const notFound = [];

          for (const sn of missing) {
            const status = statusMap.get(sn);
            if (status) {
              alreadyDistributed.push(`${sn} (${status})`);
            } else {
              notFound.push(sn);
            }
          }

          let errMsg = "Validasi Gagal (Update):";
          if (alreadyDistributed.length > 0) {
            errMsg += ` Serial berikut bukan status IN_OFFICE (sudah terdistribusi/rusak/dll): ${alreadyDistributed.join(", ")}.`;
          }
          if (notFound.length > 0) {
            errMsg += ` Serial berikut tidak ditemukan di database: ${notFound.join(", ")}.`;
          }

          throw new ValidationError(errMsg);
        }

        // Deduct Inventory
        await tx.cardInventory.update({
          where: { id: officeInv.id },
          data: {
            cardOffice: { decrement: count },
            updatedAt: new Date(),
            updatedBy: userId,
          },
        });

        // Update Card Status -> IN_TRANSIT
        await tx.card.updateMany({
          where: { serialNumber: { in: newSent } },
          data: { status: "IN_TRANSIT", updatedAt: new Date() },
        });

        // Update Movement Data
        dataToUpdate.sentSerialNumbers = newSent;
        dataToUpdate.quantity = count;
      }

      const updated = await tx.cardStockMovement.update({
        where: { id },
        data: dataToUpdate,
      });

      return {
        id: updated.id,
        updatedAt: new Date().toISOString(),
      };
    });

    return transaction;
  }
  /**
   * Delete / Cancel Stock Out (Undo)
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
      if (movement.type !== "OUT") {
        throw new ValidationError("Bukan transaksi Stock Out");
      }

      // 2. Logic based on Status
      if (movement.status === "PENDING") {
        // --- CANCEL PENDING SHIPMENT ---
        // Cards should be IN_TRANSIT
        const sent = normalizeSerials(
          (movement as any).sentSerialNumbers ?? []
        );
        if (sent.length === 0) {
          // Empty? Just delete
          await tx.cardStockMovement.delete({ where: { id } });
          return { success: true, message: "Transaksi kosong dihapus." };
        }

        // Validate Status
        const cards = await tx.card.findMany({
          where: { serialNumber: { in: sent } },
          select: { id: true, status: true, serialNumber: true },
        });

        if (cards.length !== sent.length) {
          throw new ValidationError("Jumlah kartu tidak sesuai (Data korup?)");
        }

        const notInTransit = cards.filter((c) => c.status !== "IN_TRANSIT");
        if (notInTransit.length > 0) {
          throw new ValidationError(
            `Gagal batal! Beberapa kartu tidak status IN_TRANSIT: ${notInTransit
              .slice(0, 3)
              .map((c) => c.serialNumber)
              .join(", ")}`
          );
        }

        // Revert Cards -> IN_OFFICE
        await tx.card.updateMany({
          where: { id: { in: cards.map((c) => c.id) } },
          data: {
            status: "IN_OFFICE",
            updatedAt: new Date(),
          },
        });

        // Revert Inventory (Office + sent.length)
        // Find office inventory
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
              cardOffice: { increment: sent.length },
              updatedAt: new Date(),
              updatedBy: userId,
            },
          });
        }

        // Delete Movement
        await tx.cardStockMovement.delete({ where: { id } });

        return {
          success: true,
          message: `Pengiriman dibatalkan. ${sent.length} kartu kembali ke stok Office.`,
        };
      } else if (movement.status === "APPROVED") {
        // --- UNDO APPROVED DISTRIBUTION ---
        // Cards in Receive -> IN_STATION
        // Cards in Lost -> LOST
        // WE MUST ENSURE NONE ARE SOLD!

        const received = normalizeSerials(
          (movement as any).receivedSerialNumbers ?? []
        );
        const lost = normalizeSerials(
          (movement as any).lostSerialNumbers ?? []
        );
        const total = received.length + lost.length;

        // 1. Check Received Cards (Must be IN_STATION or LOST-but-we-treat-lost-as-part-of-batch)
        // Actually, lost cards are usually marked LOST. Received are IN_STATION.
        // We need to revert ALL to IN_OFFICE.

        // Check Received (Must be IN_STATION)
        if (received.length > 0) {
          const cardsRec = await tx.card.findMany({
            where: { serialNumber: { in: received } },
            select: { id: true, status: true, serialNumber: true },
          });

          const notInStation = cardsRec.filter(
            (c) => c.status !== "IN_STATION"
          );
          if (notInStation.length > 0) {
            throw new ValidationError(
              `Gagal undo! Kartu barang diterima sudah tidak IN_STATION (Mungkin sudah terjual?): ${notInStation
                .slice(0, 3)
                .map((c) => c.serialNumber)
                .join(", ")}`
            );
          }
        }

        // Check Lost (Must be LOST)
        if (lost.length > 0) {
          const cardsLost = await tx.card.findMany({
            where: { serialNumber: { in: lost } },
            select: { id: true, status: true, serialNumber: true },
          });

          const notLost = cardsLost.filter((c) => c.status !== "LOST");
          if (notLost.length > 0) {
            throw new ValidationError(
              `Gagal undo! Kartu hilang statusnya bukan LOST: ${notLost
                .slice(0, 3)
                .map((c) => c.serialNumber)
                .join(", ")}`
            );
          }
        }

        // ALL CLEAR -> EXECUTE REVERT

        // 2. Revert Cards -> IN_OFFICE
        const allSerials = [...received, ...lost];
        if (allSerials.length > 0) {
          await tx.card.updateMany({
            where: { serialNumber: { in: allSerials } },
            data: {
              status: "IN_OFFICE",
              updatedAt: new Date(),
            },
          });
        }

        // 3. Revert Inventory Station (Station - received)
        if (movement.stationId && received.length > 0) {
          const stationInv = await tx.cardInventory.findFirst({
            where: {
              categoryId: movement.categoryId,
              typeId: movement.typeId,
              stationId: movement.stationId,
            },
            select: { id: true },
          });

          if (stationInv) {
            await tx.cardInventory.update({
              where: { id: stationInv.id },
              data: {
                // Yang masuk stasiun cuma received
                cardBeredar: { decrement: received.length },
                cardBelumTerjual: { decrement: received.length },
                updatedAt: new Date(),
                updatedBy: userId,
              },
            });
          }
        }

        // 4. Revert Inventory Office (Office + total [received+lost])
        // Karena saat kirim, office berkurang sejumlah (received+lost) = sent
        // (Assuming sent == received + lost for approved)
        // Wait, logic: sent decrement di awal.
        // Jadi balikinnya full amount yang ada di movement (quantity / sent length)
        const sentQty = movement.quantity; // Gunakan quantity asli movement

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
              cardOffice: { increment: sentQty },
              updatedAt: new Date(),
              updatedBy: userId,
            },
          });
        }

        // 5. Delete Movement
        await tx.cardStockMovement.delete({ where: { id } });

        return {
          success: true,
          message: `Distribusi dibatalkan. ${sentQty} kartu ditarik dari stasiun ${movement.stationId} ke Office.`,
        };
      } else {
        throw new ValidationError(
          `Tidak dapat menghapus transaksi dengan status ${movement.status}`
        );
      }
    });

    return transaction;
  }
}
=======
import db from "../../../config/db";
import { ValidationError } from "../../../utils/errors";
import { parseSmartSerial } from "../../../utils/serialHelper";
import { InboxService } from "../../inbox/service";

function normalizeSerials(arr: string[]) {
  return Array.from(
    new Set((arr ?? []).map((s) => (s ?? "").trim()).filter(Boolean))
  );
}

type DistributionNote = {
  note?: string | null;
  sentSerialNumbers?: string[];
  // bisa ada field lain
};

export class StockOutService {
  /**
   * Create stock out
   */
  static async stockOutDistribution(
    movementAt: Date,
    categoryId: string,
    typeId: string,
    stationId: string,
    startSerial: string,
    endSerial: string,
    userId: string,
    note?: string
  ) {
    // 1. Validate Input - Basic Regex Only (remove strict length checks)
    if (!/^\d+$/.test(startSerial) || !/^\d+$/.test(endSerial)) {
      if (/[a-zA-Z]/.test(startSerial) || /[a-zA-Z]/.test(endSerial)) {
        throw new ValidationError("Input harus berupa angka.");
      }
      throw new ValidationError(
        "startSerial dan endSerial harus berupa digit string"
      );
    }

    const transaction = await db.$transaction(async (tx) => {
      // Find valid Card Product first
      const cardProduct = await tx.cardProduct.findUnique({
        where: {
          unique_category_type: {
            categoryId,
            typeId,
          },
        },
        select: { id: true, serialTemplate: true },
      });

      if (!cardProduct) {
        throw new ValidationError(
          "Produk kartu untuk Kategori & Tipe ini belum terdaftar."
        );
      }

      const { id: cardProductId, serialTemplate } = cardProduct;
      const suffixLength = 5;
      const yearSuffix = movementAt.getFullYear().toString().slice(-2);

      // --- SMART PARSING ---
      const startNum = parseSmartSerial(
        startSerial,
        serialTemplate,
        yearSuffix
      );
      const endNum = parseSmartSerial(endSerial, serialTemplate, yearSuffix);

      if (endNum < startNum) {
        throw new ValidationError(
          "endSerial harus lebih besar atau sama dengan startSerial"
        );
      }

      const count = endNum - startNum + 1;
      if (count > 10000) {
        throw new ValidationError(
          "Maksimal distribusi 10.000 kartu per transaksi"
        );
      }
      // ---------------------

      // 2. Generate Full List
      const sent = Array.from({ length: count }, (_, i) => {
        const sfx = String(startNum + i).padStart(suffixLength, "0");
        return `${serialTemplate}${yearSuffix}${sfx}`;
      });

      // 1) Soft Validation: Cek ketersediaan Inventory Office
      // Kita ambil ID-nya untuk locking di langkah selanjutnya
      const officeInv = await tx.cardInventory.findFirst({
        where: {
          categoryId,
          typeId,
          stationId: null, // Office
        },
        select: { id: true, cardOffice: true },
      });

      if (!officeInv) {
        throw new ValidationError(
          "Inventory OFFICE belum tersedia untuk kategori/tipe ini"
        );
      }

      // Check awal (soft check) agar error message lebih jelas sebelum kena race condition check
      // Note: Casting as any karena cardOffice bisa nullable di schema, meski logicnya harusnya int
      const currentStock = (officeInv as any).cardOffice || 0;
      if (currentStock < sent.length) {
        throw new ValidationError(
          `Stok OFFICE tidak cukup. Tersedia: ${currentStock}, dibutuhkan: ${sent.length}`
        );
      }

      // 2) Kumpulkan ID Kartu dari Serial Number
      const cards = await tx.card.findMany({
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

        // Analisis kenapa missing (apakah status bukan IN_OFFICE atau memang tidak ada)
        const invalidCards = await tx.card.findMany({
          where: {
            serialNumber: { in: missing },
            cardProductId,
          },
          select: { serialNumber: true, status: true },
        });

        const statusMap = new Map(
          invalidCards.map((c) => [c.serialNumber, c.status])
        );

        const alreadyDistributed = [];
        const notFound = [];

        for (const sn of missing) {
          const status = statusMap.get(sn);
          if (status) {
            alreadyDistributed.push(`${sn} (${status})`);
          } else {
            notFound.push(sn);
          }
        }

        let errMsg = "Validasi Gagal:";
        if (alreadyDistributed.length > 0) {
          errMsg += ` Serial berikut bukan status IN_OFFICE (sudah terdistribusi/rusak/dll): ${alreadyDistributed.join(", ")}.`;
        }
        if (notFound.length > 0) {
          errMsg += ` Serial berikut tidak ditemukan di database (Belum Stock In?): ${notFound.join(", ")}.`;
        }

        throw new ValidationError(errMsg);
      }

      const sentCount = cards.length;

      // 3) Atomic Inventory Update (Kunci utama mencegah stok minus)
      // Kita gunakan updateMany dengan filter cardOffice >= sentCount
      // Jika hasil update count = 0, berarti saat dieksekusi stok sudah berkurang drastis (Race Condition)
      const updateInvResult = await tx.cardInventory.updateMany({
        where: {
          id: officeInv.id,
          cardOffice: { gte: sentCount },
        },
        data: {
          cardOffice: { decrement: sentCount },
          updatedAt: new Date(),
          updatedBy: userId,
        },
      });

      if (updateInvResult.count === 0) {
        throw new ValidationError(
          "Gagal memproses transaksi: Stok OFFICE berubah saat diproses (Insufficient Stock)"
        );
      }

      // 4) Atomic Card Status Update
      // Pastikan status MASIH IN_OFFICE saat di-update
      const updateCardResult = await tx.card.updateMany({
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

      if (updateCardResult.count !== sentCount) {
        // Jika jumlah yang terupdate tidak sama, berarti ada kartu yang statusnya berubah tiba-tiba
        throw new ValidationError(
          "Gagal memproses transaksi: Status beberapa kartu berubah saat diproses (Double Booking)"
        );
      }

      // 5) Create movement OUT PENDING
      const movement = await tx.cardStockMovement.create({
        data: {
          movementAt,
          type: "OUT",
          status: "PENDING",
          categoryId,
          typeId,
          stationId,
          quantity: sentCount,
          note: note ?? null,

          sentSerialNumbers: sent,
          receivedSerialNumbers: [],
          lostSerialNumbers: [],

          createdAt: new Date(),
          createdBy: userId,
        },
      });

      return {
        movementId: movement.id,
        status: movement.status,
        sentCount,
      };
    });

    return transaction;
  }

  /**
   * Validasi Stock Out Receipe
   */
  static async validateStockOutReceipe(
    movementId: string,
    receivedSerialNumbers: string[],
    lostSerialNumbers: string[] | undefined,
    damagedSerialNumbers: string[] | undefined,
    validatorUserId: string,
    validatorStationId: string,
    note?: string
  ) {
    const received = normalizeSerials(receivedSerialNumbers);
    const lost = normalizeSerials(lostSerialNumbers || []);
    const damaged = normalizeSerials(damagedSerialNumbers || []);

    // Tidak boleh overlap
    const lostSet = new Set(lost);
    const damagedSet = new Set(damaged);
    const receivedSet = new Set(received);

    // Overlap checks
    // 1. Received vs Lost
    const overlapRL = received.find((s) => lostSet.has(s));
    if (overlapRL)
      throw new ValidationError(
        `Serial tidak boleh overlap received & lost: ${overlapRL}`
      );

    // 2. Received vs Damaged
    const overlapRD = received.find((s) => damagedSet.has(s));
    if (overlapRD)
      throw new ValidationError(
        `Serial tidak boleh overlap received & damaged: ${overlapRD}`
      );

    // 3. Lost vs Damaged
    const overlapLD = lost.filter((s) => damagedSet.has(s));
    if (overlapLD.length)
      throw new ValidationError(
        `Serial tidak boleh overlap lost & damaged: ${overlapLD.join(", ")}`
      );

    const transaction = await db.$transaction(async (tx) => {
      // 1) Ambil movement
      const movement = await tx.cardStockMovement.findUnique({
        where: { id: movementId },
      });

      if (!movement) throw new ValidationError("Movement tidak ditemukan");
      if (movement.type !== "OUT")
        throw new ValidationError("Movement bukan tipe OUT");
      if (movement.status !== "PENDING")
        throw new ValidationError("Movement bukan status PENDING");
      if (!movement.stationId)
        throw new ValidationError("Movement OUT harus memiliki stationId");

      // 2) Petugas hanya boleh validasi stasiunnya sendiri
      if (movement.stationId !== validatorStationId) {
        throw new ValidationError(
          "Petugas tidak berhak memvalidasi distribusi untuk stasiun lain"
        );
      }

      // 3) Ambil sent serial dari kolom array
      const sent = normalizeSerials((movement as any).sentSerialNumbers ?? []);
      if (!sent.length)
        throw new ValidationError("Movement tidak memiliki sentSerialNumbers");

      const sentSet = new Set(sent);

      // --- SMART SERIAL RECONSTRUCTION START ---
      // Get Card Product to know the template
      const cardProduct = await tx.cardProduct.findUnique({
        where: {
          unique_category_type: {
            categoryId: movement.categoryId,
            typeId: movement.typeId,
          },
        },
        select: { id: true, serialTemplate: true },
      });

      const yearSuffix = movement.movementAt.getFullYear().toString().slice(-2);
      const template = cardProduct?.serialTemplate || "";

      const reconstruct = (input: string) => {
        // If exact match exists, return it
        if (sentSet.has(input)) return input;

        // If input is short digits (e.g. "1"), try to format it
        if (/^\d+$/.test(input) && template) {
          const padded = input.padStart(5, "0");
          const full = `${template}${yearSuffix}${padded}`;
          if (sentSet.has(full)) return full;
        }
        return input; // return original if reconstruction fails
      };

      const finalLost = lost.map(reconstruct);
      const finalDamaged = damaged.map(reconstruct);

      // --- SMART FILL LOGIC START ---
      let finalReceived: string[] = [];

      // If received is empty, we attempt to fill it with remaining items
      if (received.length === 0) {
        // Must validate lost/damaged first
        const invalidLost = finalLost.filter((s) => !sentSet.has(s));
        if (invalidLost.length)
          throw new ValidationError(
            `Lost serial invalid (tidak ada di pengiriman): ${invalidLost.join(", ")}`
          );

        const invalidDamaged = finalDamaged.filter((s) => !sentSet.has(s));
        if (invalidDamaged.length)
          throw new ValidationError(
            `Damaged serial invalid (tidak ada di pengiriman): ${invalidDamaged.join(", ")}`
          );

        const exceptions = new Set([...finalLost, ...finalDamaged]);
        // All sent Items that are NOT lost or damaged are considered RECEIVED
        finalReceived = sent.filter((s) => !exceptions.has(s));
      } else {
        // If user provided received items explicitly
        finalReceived = received.map(reconstruct);
        const invalidReceived = finalReceived.filter((s) => !sentSet.has(s));

        if (invalidReceived.length)
          throw new ValidationError(
            `Received serial invalid (tidak ada di pengiriman): ${invalidReceived.join(", ")}`
          );
      }
      // --- SMART FILL LOGIC END ---

      // Final subset check for lost/damaged (redundant if smart fill path taken, but safe)
      const invalidLost = finalLost.filter((s) => !sentSet.has(s));
      const invalidDamaged = finalDamaged.filter((s) => !sentSet.has(s));

      if (invalidLost.length)
        throw new ValidationError(
          `Lost serial invalid (tidak ada di pengiriman): ${invalidLost.join(", ")}`
        );
      if (invalidDamaged.length)
        throw new ValidationError(
          `Damaged serial invalid (tidak ada di pengiriman): ${invalidDamaged.join(", ")}`
        );

      // jumlah harus pas
      const totalInput =
        finalReceived.length + finalLost.length + finalDamaged.length;
      if (totalInput !== sent.length || totalInput !== movement.quantity) {
        throw new ValidationError(
          `Jumlah serial tidak cocok. shipment=${movement.quantity}, input=${totalInput} (received=${finalReceived.length}, lost=${finalLost.length}, damaged=${finalDamaged.length})`
        );
      }

      // 4) Pastikan semua kartu shipment masih IN_TRANSIT (mencegah double-process)
      const cards = await tx.card.findMany({
        where: {
          serialNumber: { in: sent },
          status: "IN_TRANSIT",
          cardProductId: cardProduct?.id,
        },
        select: { serialNumber: true },
      });

      if (cards.length !== sent.length) {
        const found = new Set(cards.map((c) => c.serialNumber));
        const missing = sent.filter((s) => !found.has(s));
        throw new ValidationError(
          `Sebagian kartu tidak berstatus IN_TRANSIT: ${missing.join(", ")}`
        );
      }

      // 5) Update status kartu
      if (finalReceived.length) {
        await tx.card.updateMany({
          where: { serialNumber: { in: finalReceived } },
          data: {
            status: "IN_STATION",
            updatedAt: new Date(),
            updatedBy: validatorUserId,
          },
        });
      }

      if (finalLost.length) {
        await tx.card.updateMany({
          where: { serialNumber: { in: finalLost } },
          data: {
            status: "LOST",
            updatedAt: new Date(),
            updatedBy: validatorUserId,
          },
        });
      }

      if (finalDamaged.length) {
        await tx.card.updateMany({
          where: { serialNumber: { in: finalDamaged } },
          data: {
            status: "DAMAGED",
            updatedAt: new Date(),
            updatedBy: validatorUserId,
          },
        });
      }

      // 6) Update inventory stasiun (yang diterima saja)
      const receivedCount = finalReceived.length;

      if (receivedCount > 0) {
        // Validasi di awal menjamin stationId ada
        const stationId = movement.stationId!;

        await tx.cardInventory.upsert({
          where: {
            unique_category_type_station: {
              categoryId: movement.categoryId,
              typeId: movement.typeId,
              stationId: stationId,
            },
          },
          create: {
            categoryId: movement.categoryId,
            typeId: movement.typeId,
            stationId: stationId,
            cardBelumTerjual: receivedCount,
            cardOffice: 0,
            cardBeredar: receivedCount,
            cardAktif: 0,
            cardNonAktif: 0,
            createdAt: new Date(),
            createdBy: validatorUserId,
            updatedAt: new Date(),
            updatedBy: validatorUserId,
          },
          update: {
            cardBeredar: { increment: receivedCount },
            cardBelumTerjual: { increment: receivedCount },
            updatedAt: new Date(),
            updatedBy: validatorUserId,
          },
        });
      }

      // 7) Update movement -> APPROVED + simpan hasil arrays + audit
      await tx.cardStockMovement.update({
        where: { id: movementId, status: "PENDING" },
        data: {
          status: "APPROVED",
          receivedSerialNumbers: finalReceived,
          lostSerialNumbers: finalLost,
          damagedSerialNumbers: finalDamaged,
          validatedBy: validatorUserId,
          validatedAt: new Date(),
          note: note ?? movement.note ?? null,
        } as any,
      });

      // 8) SEND NOTIFICATION (INBOX) - ALWAYS
      // We do this asynchronously or inside transaction (safe inside tx)
      // Need to fetch station name first
      const station = await tx.station.findUnique({
        where: { id: movement.stationId! },
        select: { stationName: true },
      });
      const stationName = station?.stationName || "Unknown Station";

      const title = "Laporan Validasi Stock Out";
      let message = `Laporan dari ${stationName}: Validasi Stock Out Berhasil.`;

      const msgParts = [];
      if (finalReceived.length)
        msgParts.push(`${finalReceived.length} DITERIMA`);
      if (finalLost.length) msgParts.push(`${finalLost.length} HILANG`);
      if (finalDamaged.length) msgParts.push(`${finalDamaged.length} RUSAK`);

      if (msgParts.length) {
        message = `Laporan dari ${stationName}: ${msgParts.join(", ")} pada pengiriman tanggal ${movement.movementAt.toISOString().split("T")[0]}.`;
      }

      await InboxService.broadcastToAdmins(
        title,
        message,
        validatorUserId,
        movement.stationId!,
        "STOCK_OUT_REPORT",
        {
          movementId,
          receivedCount: finalReceived.length,
          lostCount: finalLost.length,
          damagedCount: finalDamaged.length,
          receivedSerialNumbers: finalReceived, // Optional, might be too big if thousands
          lostSerialNumbers: finalLost,
          damagedSerialNumbers: finalDamaged,
        }
      );

      return {
        movementId,
        status: "APPROVED",
        receivedCount: finalReceived.length,
        lostCount: finalLost.length,
        damagedCount: finalDamaged.length,
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
    stationId?: string;
    status?: string;
    search?: string;
    stationName?: string;
    categoryName?: string;
    typeName?: string;
  }) {
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

    const where: any = {
      type: "OUT",
    };

    // --- CASE INSENSITIVE SEARCH LOGIC ---
    if (search) {
      where.OR = [
        { note: { contains: search, mode: "insensitive" } },
        {
          station: {
            stationName: { contains: search, mode: "insensitive" },
          },
        },
        {
          category: {
            categoryName: { contains: search, mode: "insensitive" },
          },
        },
        {
          cardType: {
            typeName: { contains: search, mode: "insensitive" },
          },
        },
      ];
    }

    // Specific Filters (Case Insensitive)
    if (stationName) {
      where.station = {
        ...where.station,
        stationName: { contains: stationName, mode: "insensitive" },
      };
    }

    if (categoryName) {
      where.category = {
        ...where.category,
        categoryName: { contains: categoryName, mode: "insensitive" },
      };
    }

    if (typeName) {
      where.cardType = {
        ...where.cardType,
        typeName: { contains: typeName, mode: "insensitive" },
      };
    }
    // -------------------------------------

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

    if (stationId) {
      where.stationId = stationId;
    }

    if (status) {
      where.status = status.toUpperCase();
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
          station: true,
        },
      }),
      db.cardStockMovement.count({ where }),
    ]);

    const userIds = [...new Set(items.map((i) => i.createdBy).filter(Boolean))];
    const users = await db.user.findMany({
      where: { id: { in: userIds as string[] } },
      select: { id: true, fullName: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u.fullName]));

    const mappedItems = items.map((item) => ({
      id: item.id,
      movementAt: item.movementAt.toISOString(),
      status: item.status,
      quantity: item.quantity,
      stationName: item.station?.stationName || null,
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
      sentSerialNumbers: item.sentSerialNumbers,
      receivedSerialNumbers: item.receivedSerialNumbers,
      lostSerialNumbers: item.lostSerialNumbers,
      damagedSerialNumbers: item.damagedSerialNumbers,
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
        station: true,
      },
    });

    if (!movement) {
      throw new ValidationError("Data tidak ditemukan");
    }

    if (movement.type !== "OUT") {
      throw new ValidationError("Bukan transaksi Stock Out");
    }

    let createdByName: string | null = null;
    let validatedByName: string | null = null;

    const userIds = [movement.createdBy, movement.validatedBy].filter(
      Boolean
    ) as string[];

    if (userIds.length > 0) {
      const users = await db.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, fullName: true },
      });
      const uMap = new Map(users.map((u) => [u.id, u.fullName]));
      if (movement.createdBy)
        createdByName = uMap.get(movement.createdBy) || null;
      if (movement.validatedBy)
        validatedByName = uMap.get(movement.validatedBy) || null;
    }

    return {
      movement: {
        id: movement.id,
        movementAt: movement.movementAt.toISOString(),
        status: movement.status,
        quantity: movement.quantity,
        note: movement.note,
        createdAt: movement.createdAt.toISOString(),
        createdByName,
        validatedAt: movement.validatedAt
          ? movement.validatedAt.toISOString()
          : null,
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
          id: movement.cardType.id,
          name: movement.cardType.typeName,
          code: movement.cardType.typeCode,
        },
        sentSerialNumbers: movement.sentSerialNumbers,
        receivedSerialNumbers: movement.receivedSerialNumbers,
        lostSerialNumbers: movement.lostSerialNumbers,
        damagedSerialNumbers: (movement as any).damagedSerialNumbers ?? [],
      },
    };
  }
  /**
   * Update Stock Out (Restricted)
   */
  static async update(
    id: string,
    body: {
      movementAt?: string;
      stationId?: string;
      note?: string;
      startSerial?: string;
      endSerial?: string;
    },
    userId: string
  ) {
    const movement = await db.cardStockMovement.findUnique({
      where: { id },
    });

    if (!movement) {
      throw new ValidationError("Data tidak ditemukan");
    }

    if (movement.type !== "OUT") {
      throw new ValidationError("Bukan transaksi Stock Out");
    }

    const transaction = await db.$transaction(async (tx) => {
      const dataToUpdate: any = {
        updatedBy: userId,
      };

      if (body.movementAt) {
        dataToUpdate.movementAt = new Date(body.movementAt);
      }

      if (body.note !== undefined) {
        dataToUpdate.note = body.note;
      }

      // Station Check
      if (body.stationId && body.stationId !== movement.stationId) {
        if (movement.status !== "PENDING") {
          throw new ValidationError(
            "Tidak dapat mengubah tujuan stasiun karena status sudah " +
              movement.status
          );
        }
        dataToUpdate.stationId = body.stationId;
      }

      // --- SERIAL NUMBER UPDATE LOGIC ---
      if (body.startSerial && body.endSerial) {
        if (movement.status !== "PENDING") {
          throw new ValidationError(
            "Tidak dapat mengubah stock karena status sudah " + movement.status
          );
        }

        // 1. REVERT EXISTING STOCK (Logic mirip delete pending)
        const oldSent = normalizeSerials(
          (movement as any).sentSerialNumbers ?? []
        );
        if (oldSent.length > 0) {
          // Revert Cards -> IN_OFFICE
          await tx.card.updateMany({
            where: { serialNumber: { in: oldSent } },
            data: { status: "IN_OFFICE", updatedAt: new Date() },
          });

          // Revert Inventory
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
                cardOffice: { increment: oldSent.length },
                updatedAt: new Date(),
                updatedBy: userId,
              },
            });
          }
        }

        // 2. PREPARE NEW STOCK (Logic mirip create)
        // 2. PREPARE NEW STOCK (Logic mirip create)
        // Validation
        const startSerial = body.startSerial;
        const endSerial = body.endSerial;

        if (!/^\d+$/.test(startSerial) || !/^\d+$/.test(endSerial)) {
          if (/[a-zA-Z]/.test(startSerial) || /[a-zA-Z]/.test(endSerial)) {
            throw new ValidationError("Input harus berupa angka.");
          }
          throw new ValidationError(
            "startSerial dan endSerial harus berupa digit string"
          );
        }

        // Determine Date
        const mDate = body.movementAt
          ? new Date(body.movementAt)
          : movement.movementAt;
        const yearSuffix = mDate.getFullYear().toString().slice(-2);

        // Fetch Product First for Template
        const cardProduct = await tx.cardProduct.findFirst({
          where: { categoryId: movement.categoryId, typeId: movement.typeId },
          select: { id: true, serialTemplate: true },
        });
        if (!cardProduct) throw new ValidationError("Produk tidak ditemukan");

        // --- SMART PARSING ---
        const startNum = parseSmartSerial(
          startSerial,
          cardProduct.serialTemplate,
          yearSuffix
        );
        const endNum = parseSmartSerial(
          endSerial,
          cardProduct.serialTemplate,
          yearSuffix
        );
        // ---------------------

        if (endNum < startNum)
          throw new ValidationError("endSerial harus >= startSerial");

        const count = endNum - startNum + 1;
        if (count > 10000) throw new ValidationError("Maksimal 10.000 kartu");

        const suffixLength = 5;

        const newSent = Array.from({ length: count }, (_, i) => {
          const sfx = String(startNum + i).padStart(suffixLength, "0");
          return `${cardProduct.serialTemplate}${yearSuffix}${sfx}`;
        });

        // 3. CHECK & DEDUCT NEW STOCK
        const officeInv = await tx.cardInventory.findFirst({
          where: {
            categoryId: movement.categoryId,
            typeId: movement.typeId,
            stationId: null,
          },
        });
        if (!officeInv)
          throw new ValidationError("Inventory Office tidak ditemukan");

        // Check availability
        const currentStock = (officeInv as any).cardOffice || 0;
        if (currentStock < count) {
          throw new ValidationError(
            `Stok OFFICE tidak cukup untuk update ini. Tersedia: ${currentStock}, Butuh: ${count}`
          );
        }

        // Check cards IN_OFFICE
        const cards = await tx.card.findMany({
          where: { serialNumber: { in: newSent }, status: "IN_OFFICE" },
          select: { id: true, serialNumber: true }, // Add serialNumber
        });
        if (cards.length !== count) {
          const found = new Set(cards.map((c) => c.serialNumber));
          const missing = newSent.filter((sn) => !found.has(sn));

          // Analisis detail kenapa missing (sama seperti create)
          const invalidCards = await tx.card.findMany({
            where: {
              serialNumber: { in: missing },
              cardProductId: cardProduct.id, // Fix variable name
            },
            select: { serialNumber: true, status: true },
          });

          const statusMap = new Map(
            invalidCards.map((c) => [c.serialNumber, c.status])
          );

          const alreadyDistributed = [];
          const notFound = [];

          for (const sn of missing) {
            const status = statusMap.get(sn);
            if (status) {
              alreadyDistributed.push(`${sn} (${status})`);
            } else {
              notFound.push(sn);
            }
          }

          let errMsg = "Validasi Gagal (Update):";
          if (alreadyDistributed.length > 0) {
            errMsg += ` Serial berikut bukan status IN_OFFICE (sudah terdistribusi/rusak/dll): ${alreadyDistributed.join(", ")}.`;
          }
          if (notFound.length > 0) {
            errMsg += ` Serial berikut tidak ditemukan di database: ${notFound.join(", ")}.`;
          }

          throw new ValidationError(errMsg);
        }

        // Deduct Inventory
        await tx.cardInventory.update({
          where: { id: officeInv.id },
          data: {
            cardOffice: { decrement: count },
            updatedAt: new Date(),
            updatedBy: userId,
          },
        });

        // Update Card Status -> IN_TRANSIT
        await tx.card.updateMany({
          where: { serialNumber: { in: newSent } },
          data: { status: "IN_TRANSIT", updatedAt: new Date() },
        });

        // Update Movement Data
        dataToUpdate.sentSerialNumbers = newSent;
        dataToUpdate.quantity = count;
      }

      const updated = await tx.cardStockMovement.update({
        where: { id },
        data: dataToUpdate,
      });

      return {
        id: updated.id,
        updatedAt: new Date().toISOString(),
      };
    });

    return transaction;
  }
  /**
   * Delete / Cancel Stock Out (Undo)
   */
  static async delete(id: string, userId: string) {
    const transaction = await db.$transaction(async (tx) => {
      // 1. Get Movement
      const movement = await tx.cardStockMovement.findUnique({
        where: { id },
        include: {
          station: true,
        },
      });

      if (!movement) {
        throw new ValidationError("Data tidak ditemukan");
      }
      if (movement.type !== "OUT") {
        throw new ValidationError("Bukan transaksi Stock Out");
      }

      // 2. Logic based on Status
      if (movement.status === "PENDING") {
        // --- CANCEL PENDING SHIPMENT ---
        // Cards should be IN_TRANSIT
        const sent = normalizeSerials(
          (movement as any).sentSerialNumbers ?? []
        );
        if (sent.length === 0) {
          // Empty? Just delete
          await tx.cardStockMovement.delete({ where: { id } });
          return { success: true, message: "Transaksi kosong dihapus." };
        }

        // Validate Status
        const cards = await tx.card.findMany({
          where: { serialNumber: { in: sent } },
          select: { id: true, status: true, serialNumber: true },
        });

        if (cards.length !== sent.length) {
          throw new ValidationError("Jumlah kartu tidak sesuai (Data korup?)");
        }

        const notInTransit = cards.filter((c) => c.status !== "IN_TRANSIT");
        if (notInTransit.length > 0) {
          throw new ValidationError(
            `Gagal batal! Beberapa kartu tidak status IN_TRANSIT: ${notInTransit
              .slice(0, 3)
              .map((c) => c.serialNumber)
              .join(", ")}`
          );
        }

        // Revert Cards -> IN_OFFICE
        await tx.card.updateMany({
          where: { id: { in: cards.map((c) => c.id) } },
          data: {
            status: "IN_OFFICE",
            updatedAt: new Date(),
          },
        });

        // Revert Inventory (Office + sent.length)
        // Find office inventory
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
              cardOffice: { increment: sent.length },
              updatedAt: new Date(),
              updatedBy: userId,
            },
          });
        }

        // Delete Movement
        await tx.cardStockMovement.delete({ where: { id } });

        return {
          success: true,
          message: `Pengiriman dibatalkan. ${sent.length} kartu kembali ke stok Office.`,
        };
      } else if (movement.status === "APPROVED") {
        // --- UNDO APPROVED DISTRIBUTION ---
        // Cards in Receive -> IN_STATION
        // Cards in Lost -> LOST
        // WE MUST ENSURE NONE ARE SOLD!

        const received = normalizeSerials(
          (movement as any).receivedSerialNumbers ?? []
        );
        const lost = normalizeSerials(
          (movement as any).lostSerialNumbers ?? []
        );
        const total = received.length + lost.length;

        // 1. Check Received Cards (Must be IN_STATION or LOST-but-we-treat-lost-as-part-of-batch)
        // Actually, lost cards are usually marked LOST. Received are IN_STATION.
        // We need to revert ALL to IN_OFFICE.

        // Check Received (Must be IN_STATION)
        if (received.length > 0) {
          const cardsRec = await tx.card.findMany({
            where: { serialNumber: { in: received } },
            select: { id: true, status: true, serialNumber: true },
          });

          const notInStation = cardsRec.filter(
            (c) => c.status !== "IN_STATION"
          );
          if (notInStation.length > 0) {
            throw new ValidationError(
              `Gagal undo! Kartu barang diterima sudah tidak IN_STATION (Mungkin sudah terjual?): ${notInStation
                .slice(0, 3)
                .map((c) => c.serialNumber)
                .join(", ")}`
            );
          }
        }

        // Check Lost (Must be LOST)
        if (lost.length > 0) {
          const cardsLost = await tx.card.findMany({
            where: { serialNumber: { in: lost } },
            select: { id: true, status: true, serialNumber: true },
          });

          const notLost = cardsLost.filter((c) => c.status !== "LOST");
          if (notLost.length > 0) {
            throw new ValidationError(
              `Gagal undo! Kartu hilang statusnya bukan LOST: ${notLost
                .slice(0, 3)
                .map((c) => c.serialNumber)
                .join(", ")}`
            );
          }
        }

        // ALL CLEAR -> EXECUTE REVERT

        // 2. Revert Cards -> IN_OFFICE
        const allSerials = [...received, ...lost];
        if (allSerials.length > 0) {
          await tx.card.updateMany({
            where: { serialNumber: { in: allSerials } },
            data: {
              status: "IN_OFFICE",
              updatedAt: new Date(),
            },
          });
        }

        // 3. Revert Inventory Station (Station - received)
        if (movement.stationId && received.length > 0) {
          const stationInv = await tx.cardInventory.findFirst({
            where: {
              categoryId: movement.categoryId,
              typeId: movement.typeId,
              stationId: movement.stationId,
            },
            select: { id: true },
          });

          if (stationInv) {
            await tx.cardInventory.update({
              where: { id: stationInv.id },
              data: {
                // Yang masuk stasiun cuma received
                cardBeredar: { decrement: received.length },
                cardBelumTerjual: { decrement: received.length },
                updatedAt: new Date(),
                updatedBy: userId,
              },
            });
          }
        }

        // 4. Revert Inventory Office (Office + total [received+lost])
        // Karena saat kirim, office berkurang sejumlah (received+lost) = sent
        // (Assuming sent == received + lost for approved)
        // Wait, logic: sent decrement di awal.
        // Jadi balikinnya full amount yang ada di movement (quantity / sent length)
        const sentQty = movement.quantity; // Gunakan quantity asli movement

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
              cardOffice: { increment: sentQty },
              updatedAt: new Date(),
              updatedBy: userId,
            },
          });
        }

        // 5. Delete Movement
        await tx.cardStockMovement.delete({ where: { id } });

        return {
          success: true,
          message: `Distribusi dibatalkan. ${sentQty} kartu ditarik dari stasiun ${movement.station?.stationName} ke Office.`,
        };
      } else {
        throw new ValidationError(
          `Tidak dapat menghapus transaksi dengan status ${movement.status}`
        );
      }
    });

    return transaction;
  }
}
>>>>>>> da9ad286010c29f3d8e17c72ef368bf0864559eb
