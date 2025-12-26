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
    quantity: number,
    userId: string,
    note?: string | null
  ) {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new ValidationError("Quantity must be a positive integer");
    }

    const transaction = await db.$transaction(async (tx) => {
      // Catat movement log
      const movement = await tx.cardStockMovement.create({
        data: {
          movementAt,
          type: "IN",
          status: "APPROVED",
          categoryId,
          typeId,
          stationId: null,
          quantity,
          note: note ?? null,
          createdAt: new Date(),
          createdBy: userId,
        },
      });

      const officeInv = await tx.cardInventory.findFirst({
        where: {
          categoryId,
          typeId,
          stationId: null,
        },
      });

      if (!officeInv) {
        const createdInventory = await tx.cardInventory.create({
          data: {
            categoryId,
            typeId,
            stationId: null,

            cardBeredar: 0,
            cardAktif: 0,
            cardNonAktif: 0,
            cardBelumTerjual: 0,
            cardOffice: quantity,

            lastUpdated: new Date(),
            updatedBy: userId,
          },
        });

        return {
          movementId: movement.id,
          quantity,
          officeInventoryId: createdInventory.id,
        };
      }

      const updatedInventory = await tx.cardInventory.update({
        where: {
          id: officeInv.id,
        },
        data: {
          cardOffice: { increment: quantity },

          lastUpdated: new Date(),
          updatedBy: userId,
        },
      });

      return {
        movementId: movement.id,
        quantity,
        officeInventoryId: updatedInventory.id,
      };
    });

    return transaction;
  }
}
