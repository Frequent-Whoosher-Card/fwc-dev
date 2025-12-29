import db from "../../../config/db";
import { ValidationError } from "../../../utils/errors";

function normalizeSerials(input?: string[]) {
  return Array.from(
    new Set((input ?? []).map((s) => (s ?? "").trim()).filter(Boolean))
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
    serialNumbers: string[],
    userId: string,
    note?: string
  ) {
    if (!serialNumbers?.length)
      throw new ValidationError("serialNumbers wajib diisi");

    // Deduplicate & trim
    const uniqueSerials = Array.from(
      new Set(serialNumbers.map((s) => (s ?? "").trim()).filter(Boolean))
    );

    if (!uniqueSerials.length)
      throw new ValidationError("serialNumbers kosong/invalid");

    const transaction = await db.$transaction(async (tx) => {
      // 1) Validasi: serial harus ada di DB, sesuai category/type, dan status IN_OFFICE
      const cards = await tx.card.findMany({
        where: {
          serialNumber: { in: uniqueSerials },
          categoryId,
          typeId,
          status: "IN_OFFICE",
        },
        select: { id: true, serialNumber: true },
      });

      if (cards.length !== uniqueSerials.length) {
        const found = new Set(cards.map((c) => c.serialNumber));
        const missing = uniqueSerials.filter((sn) => !found.has(sn));
        throw new ValidationError(
          `Sebagian serial tidak valid / bukan IN_OFFICE / tidak sesuai category/type: ${missing.join(", ")}`
        );
      }

      const sentCount = cards.length;

      // 2) Validasi stok office cukup (mengacu ke cardInventory.cardOffice)
      const officeInv = await tx.cardInventory.findFirst({
        where: { categoryId, typeId, stationId: null },
        select: { id: true, cardOffice: true },
      });

      if (!officeInv)
        throw new ValidationError(
          "Inventory OFFICE belum tersedia untuk kategori/tipe ini"
        );
      if ((officeInv as any).cardOffice < sentCount) {
        throw new ValidationError(
          `Stok OFFICE (cardOffice) tidak cukup. Tersedia: ${(officeInv as any).cardOffice}, dibutuhkan: ${sentCount}`
        );
      }

      // 3) Create movement OUT (PENDING) + simpan serialNumbers sebagai JSON di note
      const payloadNote = {
        note: note ?? null,
        sentSerialNumbers: uniqueSerials,
      };

      const movement = await tx.cardStockMovement.create({
        data: {
          movementAt,
          type: "OUT",
          status: "PENDING",
          categoryId,
          typeId,
          stationId,
          quantity: sentCount,
          note: JSON.stringify(payloadNote),
          createdBy: userId,
        },
      });

      // 4) Update cards -> IN_TRANSIT
      await tx.card.updateMany({
        where: { id: { in: cards.map((c) => c.id) } },
        data: {
          status: "IN_TRANSIT",
          updatedAt: new Date(),
          updatedBy: userId,
        } as any,
      });

      // 5) Kurangi stok office
      await tx.cardInventory.update({
        where: { id: officeInv.id },
        data: {
          cardOffice: { decrement: sentCount },
          lastUpdated: new Date(),
          updatedBy: userId,
        } as any,
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
    validatorUserId: string,
    validatorStationId: string,
    receivedSerialNumbers: string[],
    lostSerials?: string[],
    note?: string
  ) {
    const received = normalizeSerials(receivedSerialNumbers);
    const lost = normalizeSerials(lostSerials);

    // Tidak boleh overlap
    const lostSet = new Set(lost);
    const overlap = received.find((s) => lostSet.has(s));
    if (overlap)
      throw new ValidationError(
        `Serial tidak boleh ada di received & lost sekaligus: ${overlap}`
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

      // 2) Validasi petugas harus stasiun tujuan
      if (movement.stationId !== validatorStationId) {
        throw new ValidationError(
          "Petugas tidak berhak memvalidasi distribusi untuk stasiun lain"
        );
      }

      // 3) Ambil daftar serial yang dikirim dari note JSON
      let sentSerials: string[] = [];
      try {
        const parsed = JSON.parse(movement.note ?? "{}") as DistributionNote;
        sentSerials = normalizeSerials(parsed.sentSerialNumbers ?? []);
      } catch {
        throw new ValidationError(
          "Format note movement tidak valid (serialNumbers tidak ditemukan)"
        );
      }

      if (!sentSerials.length) {
        throw new ValidationError(
          "Movement ini tidak memiliki daftar serial yang dikirim"
        );
      }

      // 4) Validasi serial input adalah subset dari sentSerials
      const sentSet = new Set(sentSerials);
      const invalidReceived = received.filter((s) => !sentSet.has(s));
      const invalidLost = lost.filter((s) => !sentSet.has(s));

      if (invalidReceived.length) {
        throw new ValidationError(
          `Received serial tidak termasuk shipment: ${invalidReceived.join(", ")}`
        );
      }
      if (invalidLost.length) {
        throw new ValidationError(
          `Lost serial tidak termasuk shipment: ${invalidLost.join(", ")}`
        );
      }

      // 5) Validasi total harus match quantity shipment
      const totalInput = received.length + lost.length;
      if (
        totalInput !== sentSerials.length ||
        totalInput !== movement.quantity
      ) {
        throw new ValidationError(
          `Jumlah serial tidak cocok. Shipment=${movement.quantity}, input=${totalInput}`
        );
      }

      // 6) Pastikan semua kartu masih IN_TRANSIT (untuk mencegah double validate)
      const cards = await tx.card.findMany({
        where: {
          serialNumber: { in: sentSerials },
          status: "IN_TRANSIT",
          categoryId: movement.categoryId,
          typeId: movement.typeId,
        },
        select: { id: true, serialNumber: true },
      });

      if (cards.length !== sentSerials.length) {
        const found = new Set(cards.map((c) => c.serialNumber));
        const missing = sentSerials.filter((s) => !found.has(s));
        throw new ValidationError(
          `Sebagian kartu tidak berstatus IN_TRANSIT / tidak sesuai movement: ${missing.join(", ")}`
        );
      }

      // 7) Update status kartu
      if (received.length) {
        await tx.card.updateMany({
          where: { serialNumber: { in: received } },
          data: {
            status: "IN_STATION",
            updatedAt: new Date(),
            updatedBy: validatorUserId,
          } as any,
        });
      }

      if (lost.length) {
        await tx.card.updateMany({
          where: { serialNumber: { in: lost } },
          data: {
            status: "LOST",
            updatedAt: new Date(),
            updatedBy: validatorUserId,
          } as any,
        });
      }

      // 8) Update inventory stasiun: tambah kartu yang diterima
      const receivedCount = received.length;

      if (receivedCount > 0) {
        const stationInv = await tx.cardInventory.findFirst({
          where: {
            categoryId: movement.categoryId,
            typeId: movement.typeId,
            stationId: movement.stationId,
          },
          select: { id: true },
        });

        if (!stationInv) {
          await tx.cardInventory.create({
            data: {
              categoryId: movement.categoryId,
              typeId: movement.typeId,
              stationId: movement.stationId,
              cardBelumTerjual: receivedCount,
              cardBeredar: 0,
              cardAktif: 0,
              cardNonAktif: 0,
              cardOffice: 0,
              lastUpdated: new Date(),
              updatedBy: validatorUserId,
            } as any,
          });
        } else {
          await tx.cardInventory.update({
            where: { id: stationInv.id },
            data: {
              cardBelumTerjual: { increment: receivedCount },
              lastUpdated: new Date(),
              updatedBy: validatorUserId,
            } as any,
          });
        }
      }

      // 9) Update movement menjadi APPROVED + simpan hasil validasi
      const validationNote = {
        ...(() => {
          try {
            return JSON.parse(movement.note ?? "{}");
          } catch {
            return {};
          }
        })(),
        validation: {
          validatedBy: validatorUserId,
          validatedAt: new Date().toISOString(),
          receivedSerialNumbers: received,
          lostSerialNumbers: lost,
          note: note ?? null,
        },
      };

      await tx.cardStockMovement.update({
        where: { id: movementId },
        data: {
          status: "APPROVED",
          note: JSON.stringify(validationNote),
        },
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
}
