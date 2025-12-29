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
    quantity: number,
    userId: string,
    note?: string | null
  ) {
    if (!/^\d+$/.test(startSerial)) {
      throw new ValidationError("startSerial harus berupa digit string");
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new ValidationError("quantity harus lebih dari 0");
    }

    const width = startSerial.length;
    const startNum = Number(startSerial);
    if (!Number.isSafeInteger(startNum)) {
      throw new ValidationError("startSerial terlalu besar");
    }

    const endNum = startNum + quantity - 1;
    const endSerial = String(endNum).padStart(width, "0");

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

      // 2) Generate suffix serial berurutan (tetap leading zero)
      const suffixSerials = Array.from({ length: quantity }, (_, i) =>
        String(startNum + i).padStart(width, "0")
      );

      // 3) Bentuk serialNumber final: serialTemplate + suffix
      const serialNumbers = suffixSerials.map(
        (sfx) => `${product.serialTemplate}${sfx}`
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
          categoryId,
          typeId,

          totalQuota: product.totalQuota,
          fwPrice: product.price, // mapping ke Card.fwPrice
          masaBerlaku: product.masaBerlaku,

          status: "IN_OFFICE",
          createdBy: userId,
          // quotaTicket default 0 sudah di schema
        })),
      });

      // 6) Catat stock movement IN
      const movement = await tx.cardStockMovement.create({
        data: {
          movementAt: new Date(),
          type: "IN",
          status: "APPROVED",
          categoryId,
          typeId,
          stationId: null,
          quantity,
          note:
            note ??
            `Batch ${product.serialTemplate}${startSerial} - ${product.serialTemplate}${endSerial}`,
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
        startSerial,
        endSerial,
        quantity,
        startSerialNumber: `${product.serialTemplate}${startSerial}`,
        endSerialNumber: `${product.serialTemplate}${endSerial}`,
      };
    });

    return transaction;
  }
}
