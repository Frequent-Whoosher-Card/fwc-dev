import db from "../../../config/db";
import { ValidationError } from "../../../utils/errors";

export class StockService {
  /**
   * Add Stock Cards Batch
   */
  static async addStocks(
    categoryId: string,
    typeId: string,
    startSerialNumber: number,
    quantity: number
  ) {
    if (quantity < 1) {
      throw new ValidationError("Quantity must be greater than 0");
    }

    const totalCards = quantity;

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
      data: Array.from({ length: totalCards }, (_, i) => ({
        serialNumber: (i + 1).toString().padStart(5, "0"),
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
    updatedBy?: string
  ) {
    // Validate inputs exist
    const [category, type, station] = await Promise.all([
      db.cardCategory.findUnique({ where: { id: categoryId } }),
      db.cardType.findUnique({ where: { id: typeId } }),
      db.station.findUnique({ where: { id: stationId } }),
    ]);

    if (!category) {
      throw new ValidationError("Card Category not found");
    }
    if (!type) {
      throw new ValidationError("Card Type not found");
    }
    if (!station) {
      throw new ValidationError("Station not found");
    }

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
        updatedBy: updatedBy || null,
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
