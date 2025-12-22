import db from "../../config/db";
import { ValidationError } from "../../utils/errors";

export class StockService {
  /**
   * Add Stock Cards Batch
   */
  static async addStocks(
    categoryId: string,
    typeId: string,
    stationId: string,
    startSerialNumber: number,
    endSerialNumber: number
  ) {
    if (endSerialNumber < startSerialNumber) {
      throw new ValidationError(
        "End serial number must be greater than start serial number"
      );
    }

    const totalCards = endSerialNumber - startSerialNumber + 1;

    const serials: string[] = [];
    for (let i = startSerialNumber; i <= endSerialNumber; i++) {
      serials.push(i.toString().padStart(5, "0"));
    }

    // Check Card Product is exist
    const cardProduct = await db.cardProduct.findFirst({
      where: {
        categoryId,
        typeId,
      },
      select: {
        id: true,
        totalQuota: true,
        masaBerlaku: true,
        price: true,
      },
    });

    if (!cardProduct) {
      throw new ValidationError(
        "Card product with this category and type not found"
      );
    }

    await db.card.createMany({
      data: serials.map((serial) => ({
        serialNumber: serial,
        memberId: null,
        cardProductId: cardProduct.id,
        categoryId,
        typeId,
        quotaTicket: cardProduct.totalQuota,
        totalQuota: cardProduct.totalQuota,
        masaBerlaku: cardProduct.masaBerlaku,
        fwPrice: cardProduct.price,
        isActive: true,
        createdAt: new Date(),
        createdBy: "system",
        updatedBy: null,
        deletedAt: null,
        deletedBy: null,
      })),
      skipDuplicates: true,
    });

    await db.cardInventory.upsert({
      where: {
        unique_category_type_station: {
          categoryId,
          typeId,
          stationId,
        },
      },
      create: {
        categoryId,
        typeId,
        stationId,
        cardBeredar: totalCards,
        cardBelumTerjual: totalCards,
      },
      update: {
        cardBeredar: {
          increment: totalCards,
        },
        cardBelumTerjual: {
          increment: totalCards,
        },
        lastUpdated: new Date(),
      },
    });

    return {
      totalCardsAdded: totalCards,
    };
  }

  /**
   * Add Stock Quantity
   */
  static async addStock(
    categoryId: string,
    typeId: string,
    stationId: string,
    quantity: number,
    userId: string
  ) {
    await db.cardInventory.upsert({
      where: {
        unique_category_type_station: {
          categoryId,
          typeId,
          stationId,
        },
      },
      update: {
        cardBelumTerjual: {
          increment: quantity,
        },
        cardBeredar: {
          increment: quantity,
        },
        lastUpdated: new Date(),
        updatedBy: userId,
      },
      create: {
        categoryId,
        typeId,
        stationId,
        cardBeredar: quantity,
        cardBelumTerjual: quantity,
      },
    });

    return {
      totalCardsAdded: quantity,
    };
  }
}
