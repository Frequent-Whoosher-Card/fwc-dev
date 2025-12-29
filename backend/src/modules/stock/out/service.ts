import db from "../../../config/db";
import { ValidationError } from "../../../utils/errors";

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
    cardProductId: string,
    stationId: string,
    sentSerialNumbers: string[],
    userId: string,
    note?: string
  ) {
    if (!sentSerialNumbers?.length)
      throw new ValidationError("sentSerialNumbers wajib diisi");

    // Deduplicate & trim
    const sent = normalizeSerials(sentSerialNumbers);

    if (!sent.length)
      throw new ValidationError("sentSerialNumbers kosong/invalid");

    const transaction = await db.$transaction(async (tx) => {
      const cardProduct = await tx.cardProduct.findUnique({
        where: { id: cardProductId },
        select: { categoryId: true, typeId: true },
      });

      if (!cardProduct) {
        throw new ValidationError("Produk kartu tidak ditemukan");
      }

      const { categoryId, typeId } = cardProduct;

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
        throw new ValidationError(
          `Sebagian serial tidak valid / bukan IN_OFFICE: ${missing.join(", ")}`
        );
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
          lastUpdated: new Date(),
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

  static async validateStockOutReceipe(
    movementId: string,
    receivedSerialNumbers: string[],
    lostSerialNumbers: string[],
    validatorUserId: string,
    validatorStationId: string,
    note?: string
  ) {
    const received = normalizeSerials(receivedSerialNumbers);
    const lost = normalizeSerials(lostSerialNumbers);

    // Tidak boleh overlap
    const lostSet = new Set(lost);
    const overlap = received.find((s) => lostSet.has(s));
    if (overlap)
      throw new ValidationError(
        `Serial tidak boleh overlap received & lost: ${overlap}`
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

      // subset check
      const invalidReceived = received.filter((s) => !sentSet.has(s));
      const invalidLost = lost.filter((s) => !sentSet.has(s));
      if (invalidReceived.length)
        throw new ValidationError(
          `Received serial invalid: ${invalidReceived.join(", ")}`
        );
      if (invalidLost.length)
        throw new ValidationError(
          `Lost serial invalid: ${invalidLost.join(", ")}`
        );

      // jumlah harus pas
      const totalInput = received.length + lost.length;
      if (totalInput !== sent.length || totalInput !== movement.quantity) {
        throw new ValidationError(
          `Jumlah serial tidak cocok. shipment=${movement.quantity}, input=${totalInput}`
        );
      }

      // 4) Pastikan semua kartu shipment masih IN_TRANSIT (mencegah double-process)
      const cardProduct = await tx.cardProduct.findUnique({
        where: {
          unique_category_type: {
            categoryId: movement.categoryId,
            typeId: movement.typeId,
          },
        },
        select: { id: true, categoryId: true, typeId: true },
      });

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
      if (received.length) {
        await tx.card.updateMany({
          where: { serialNumber: { in: received } },
          data: {
            status: "IN_STATION",
            updatedAt: new Date(),
            updatedBy: validatorUserId,
          },
        });
      }

      if (lost.length) {
        await tx.card.updateMany({
          where: { serialNumber: { in: lost } },
          data: {
            status: "LOST",
            updatedAt: new Date(),
            updatedBy: validatorUserId,
          },
        });
      }

      // 6) Update inventory stasiun (yang diterima saja)
      const receivedCount = received.length;

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
            lastUpdated: new Date(),
            updatedBy: validatorUserId,
          },
          update: {
            cardBeredar: { increment: receivedCount },
            cardBelumTerjual: { increment: receivedCount },
            lastUpdated: new Date(),
            updatedBy: validatorUserId,
          },
        });
      }

      // 7) Update movement -> APPROVED + simpan hasil arrays + audit
      await tx.cardStockMovement.update({
        where: { id: movementId, status: "PENDING" },
        data: {
          status: "APPROVED",
          receivedSerialNumbers: received,
          lostSerialNumbers: lost,
          validatedBy: validatorUserId,
          validatedAt: new Date(),
          note: note ?? movement.note ?? null,
        } as any,
      });

      return {
        movementId,
        status: "APPROVED",
        receivedCount: received.length,
        lostCount: lost.length,
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
    status?: "PENDING" | "APPROVED" | "REJECTED";
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
      type: "OUT",
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

    if (stationId) {
      where.stationId = stationId;
    }

    if (status) {
      where.status = status;
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
    if (body.stationId) {
      if (movement.status !== "PENDING") {
        // Jika sudah APPROVED/REJECTED, tidak boleh ganti stasiun
        throw new ValidationError(
          "Tidak dapat mengubah tujuan stasiun karena status sudah " +
            movement.status
        );
      }
      dataToUpdate.stationId = body.stationId;
    }

    const updated = await db.cardStockMovement.update({
      where: { id },
      data: dataToUpdate,
    });

    return {
      id: updated.id,
      updatedAt: new Date().toISOString(),
    };
  }
  /**
   * Delete / Cancel Stock Out (Undo)
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
              lastUpdated: new Date(),
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
                lastUpdated: new Date(),
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
              lastUpdated: new Date(),
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
