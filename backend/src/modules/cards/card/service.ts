import {
  parseFilter,
  prismaFilter,
  parseSmartSearch,
} from "../../../utils/filterHelper";
import db from "../../../config/db";
import { ValidationError } from "../../../utils/errors";
import { getEnumStatus, getFriendlyStatus } from "./constants";

export class CardService {
  // Get All Cards with filters
  static async getCards(params?: {
    cardProductId?: string;
    status?: string;
    search?: string;
    categoryId?: string;
    typeId?: string;
    categoryName?: string;
    typeName?: string;
    stationId?: string;
    stationName?: string;
    programType?: "FWC" | "VOUCHER";
    page?: number;
    limit?: number;
  }) {
    const {
      cardProductId,
      status,
      search,
      page = 1,
      limit = 50,
      categoryId,
      typeId,
      stationId,
      stationName,
      programType,
      categoryName,
      typeName,
    } = params || {};

    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
      ...parseSmartSearch(search || "", [
        "serialNumber",
        "notes",
        "cardProduct.category.categoryName",
        "cardProduct.type.typeName",
        "station.stationCode",
        "station.stationName",
      ]),
    };

    // Filter by cardProductId
    if (cardProductId) {
      where.cardProductId = prismaFilter(cardProductId);
    }

    // Filter by status (Multi-value support)
    if (status) {
      const statuses = status.split(",").map((s) => {
        const trimmed = s.trim();
        return getEnumStatus(trimmed) || trimmed.toUpperCase();
      });
      where.status = { in: statuses };
    }

    // Filter by Category/Type (Relations)
    const cardProductWhere: any = {};

    if (categoryId) {
      cardProductWhere.categoryId = prismaFilter(categoryId);
    }

    if (typeId) {
      cardProductWhere.typeId = prismaFilter(typeId);
    }

    if (programType) {
      if (!cardProductWhere.category) cardProductWhere.category = {};
      cardProductWhere.category.programType = programType;
    }

    if (categoryName) {
      if (!cardProductWhere.category) cardProductWhere.category = {};
      const names = categoryName
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      cardProductWhere.category.OR = names.map((name) => ({
        categoryName: { contains: name, mode: "insensitive" },
      }));
    }

    if (typeName) {
      if (!cardProductWhere.type) cardProductWhere.type = {};
      const names = typeName
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      cardProductWhere.type.OR = names.map((name) => ({
        typeName: { contains: name, mode: "insensitive" },
      }));
    }

    if (Object.keys(cardProductWhere).length > 0) {
      where.cardProduct = cardProductWhere;
    }

    if (stationId) {
      where.stationId = prismaFilter(stationId);
    }

    const [cards, total] = await Promise.all([
      db.card.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ serialNumber: "asc" }],
        select: {
          id: true,
          serialNumber: true,
          status: true,
          cardProductId: true,
          quotaTicket: true,
          purchaseDate: true,
          expiredDate: true,
          createdAt: true,
          cardProduct: {
            select: {
              id: true,
              category: {
                select: {
                  id: true,
                  categoryName: true,
                },
              },
              type: {
                select: {
                  id: true,
                  typeName: true,
                },
              },
            },
          },
          fileObject: {
            select: {
              id: true,
              originalName: true,
              relativePath: true,
              mimeType: true,
            },
          },
          station: {
            select: {
              id: true,
              stationName: true,
              stationCode: true,
            },
          },
          previousStation: {
            select: {
              id: true,
              stationName: true,
              stationCode: true,
            },
          },
          notes: true,
        },
      }),
      db.card.count({ where }),
    ]);

    // Convert Date objects to ISO strings
    const formattedCards = cards.map((card) => ({
      ...card,
      status: getFriendlyStatus(card.status),
      createdAt: card.createdAt.toISOString(),
      purchaseDate: card.purchaseDate?.toISOString() || null,
      expiredDate: card.expiredDate?.toISOString() || null,
      station: card.station
        ? {
            id: card.station.id,
            stationName: card.station.stationName,
            stationCode: card.station.stationCode,
          }
        : null,
      notes: card.notes || null, // Added notes to mapping
    }));

    return {
      items: formattedCards,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get Card By ID
  static async getCardById(id: string) {
    const card = await db.card.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        cardProduct: {
          include: {
            category: {
              select: {
                id: true,
                categoryName: true,
              },
            },
            type: {
              select: {
                id: true,
                typeName: true,
              },
            },
          },
        },
        member: {
          select: {
            id: true,
            name: true,
            identityNumber: true,
          },
        },
        fileObject: {
          select: {
            id: true,
            originalName: true,
            relativePath: true,
            mimeType: true,
          },
        },
        station: {
          select: {
            id: true,
            stationName: true,
            stationCode: true,
          },
        },
        previousStation: {
          select: {
            id: true,
            stationName: true,
            stationCode: true,
          },
        },
      },
    });

    if (!card) {
      throw new ValidationError("Card not found");
    }

    // Convert Date objects to ISO strings; ensure cardProduct.price is number (Prisma Decimal)
    if (!card.cardProduct) {
      throw new ValidationError("Card product not found for this card");
    }

    const cardProduct = {
      ...card.cardProduct,
      price: Number(card.cardProduct.price),
    };

    return {
      ...card,
      cardProduct,
      status: getFriendlyStatus(card.status),
      createdAt: card.createdAt.toISOString(),
      updatedAt: card.updatedAt.toISOString(),
      purchaseDate: card.purchaseDate?.toISOString() || null,
      expiredDate: card.expiredDate?.toISOString() || null,
      member: card.member || null, // Ensure member is always present (can be null)
      station: card.station || null,
      previousStation: card.previousStation || null,
      fileObject: card.fileObject || null,
      notes: card.notes || null,
    };
  }

  // Get Card By Serial Number
  static async getCardBySerialNumber(serialNumber: string) {
    const card = await db.card.findFirst({
      where: {
        serialNumber,
        deletedAt: null,
      },
      include: {
        cardProduct: {
          include: {
            category: {
              select: {
                id: true,
                categoryName: true,
              },
            },
            type: {
              select: {
                id: true,
                typeName: true,
              },
            },
          },
        },
        member: {
          select: {
            id: true,
            name: true,
            identityNumber: true,
          },
        },
        fileObject: {
          select: {
            id: true,
            originalName: true,
            relativePath: true,
            mimeType: true,
          },
        },
        station: {
          select: {
            id: true,
            stationName: true,
            stationCode: true,
          },
        },
        previousStation: {
          select: {
            id: true,
            stationName: true,
            stationCode: true,
          },
        },
      },
    });

    if (!card) {
      throw new ValidationError("Card not found");
    }

    // Convert Date objects to ISO strings; ensure cardProduct.price is number (Prisma Decimal)
    if (!card.cardProduct) {
      throw new ValidationError("Card product not found for this card");
    }

    const cardProduct = {
      ...card.cardProduct,
      price: Number(card.cardProduct.price),
    };

    return {
      ...card,
      cardProduct,
      status: getFriendlyStatus(card.status),
      createdAt: card.createdAt.toISOString(),
      updatedAt: card.updatedAt.toISOString(),
      purchaseDate: card.purchaseDate?.toISOString() || null,
      expiredDate: card.expiredDate?.toISOString() || null,
      member: card.member || null, // Ensure member is always present (can be null)
      station: card.station || null,
      previousStation: card.previousStation || null,
      fileObject: card.fileObject || null,
      notes: card.notes || null,
    };
  }

  // Get Cards By Serial Numbers (Batch)
  static async getCardsBySerialNumbers(params: {
    serialNumbers: string[];
    categoryId?: string;
    typeId?: string;
    status?: string;
    stationId?: string;
    programType?: "FWC" | "VOUCHER";
  }) {
    const {
      serialNumbers,
      categoryId,
      typeId,
      status,
      stationId,
      programType,
    } = params;

    if (!serialNumbers || serialNumbers.length === 0) {
      throw new ValidationError("serialNumbers array cannot be empty");
    }

    if (serialNumbers.length > 10000) {
      throw new ValidationError(
        "Maximum 10000 serial numbers allowed per request"
      );
    }

    const where: any = {
      deletedAt: null,
      serialNumber: { in: serialNumbers },
    };

    // Filter by status
    if (status) {
      const statuses = status.split(",").map((s) => {
        const trimmed = s.trim();
        return getEnumStatus(trimmed) || trimmed.toUpperCase();
      });
      where.status = { in: statuses };
    }

    // Filter by Category/Type (Relations)
    const cardProductWhere: any = {};

    if (categoryId) {
      cardProductWhere.categoryId = prismaFilter(categoryId);
    }

    if (typeId) {
      cardProductWhere.typeId = prismaFilter(typeId);
    }

    if (programType) {
      if (!cardProductWhere.category) cardProductWhere.category = {};
      cardProductWhere.category.programType = programType;
    }

    if (Object.keys(cardProductWhere).length > 0) {
      where.cardProduct = cardProductWhere;
    }

    if (stationId) {
      where.stationId = prismaFilter(stationId);
    }

    const cards = await db.card.findMany({
      where,
      orderBy: [{ serialNumber: "asc" }],
      select: {
        id: true,
        serialNumber: true,
        status: true,
        cardProductId: true,
        quotaTicket: true,
        purchaseDate: true,
        expiredDate: true,
        createdAt: true,
        cardProduct: {
          select: {
            id: true,
            category: {
              select: {
                id: true,
                categoryName: true,
              },
            },
            type: {
              select: {
                id: true,
                typeName: true,
              },
            },
          },
        },
        fileObject: {
          select: {
            id: true,
            originalName: true,
            relativePath: true,
            mimeType: true,
          },
        },
        station: {
          select: {
            id: true,
            stationName: true,
            stationCode: true,
          },
        },
        previousStation: {
          select: {
            id: true,
            stationName: true,
            stationCode: true,
          },
        },
        notes: true,
      },
    });

    // Convert Date objects to ISO strings
    const formattedCards = cards.map((card) => ({
      ...card,
      status: getFriendlyStatus(card.status),
      createdAt: card.createdAt.toISOString(),
      purchaseDate: card.purchaseDate?.toISOString() || null,
      expiredDate: card.expiredDate?.toISOString() || null,
      station: card.station
        ? {
            id: card.station.id,
            stationName: card.station.stationName,
            stationCode: card.station.stationCode,
          }
        : null,
      previousStation: card.previousStation
        ? {
            id: card.previousStation.id,
            stationName: card.previousStation.stationName,
            stationCode: card.previousStation.stationCode,
          }
        : null,
      notes: card.notes || null,
    }));

    return {
      items: formattedCards,
      foundCount: formattedCards.length,
      requestedCount: serialNumbers.length,
    };
  }

  // Get First Available Card Serial Number
  static async getFirstAvailableCard(
    cardProductId: string,
    status: string = "IN_STATION",
  ) {
    // Find first card with matching cardProductId and status sorted by serialNumber ASC
    const card = await db.card.findFirst({
      where: {
        cardProductId,
        status: status as any, // Cast to CardStatus enum if needed, or string
        deletedAt: null,
      },
      orderBy: {
        serialNumber: "asc",
      },
      select: {
        id: true,
        serialNumber: true,
        status: true,
      },
    });

    return card;
  }

  // Get Next Available Cards After Serial Number
  static async getNextAvailableCards(params: {
    startSerial: string;
    quantity: number;
    categoryId?: string;
    typeId?: string;
    status?: string;
    stationId?: string;
    programType?: "FWC" | "VOUCHER";
  }) {
    const {
      startSerial,
      quantity,
      categoryId,
      typeId,
      status,
      stationId,
      programType,
    } = params;

    if (!startSerial || quantity < 1 || quantity > 10000) {
      throw new ValidationError(
        "startSerial is required and quantity must be between 1 and 10000"
      );
    }

    const where: any = {
      deletedAt: null,
      serialNumber: { gte: startSerial }, // Greater than or equal to start serial
    };

    // Filter by status
    if (status) {
      const statuses = status.split(",").map((s) => {
        const trimmed = s.trim();
        return getEnumStatus(trimmed) || trimmed.toUpperCase();
      });
      where.status = { in: statuses };
    }

    // Filter by Category/Type (Relations)
    const cardProductWhere: any = {};

    if (categoryId) {
      cardProductWhere.categoryId = prismaFilter(categoryId);
    }

    if (typeId) {
      cardProductWhere.typeId = prismaFilter(typeId);
    }

    if (programType) {
      if (!cardProductWhere.category) cardProductWhere.category = {};
      cardProductWhere.category.programType = programType;
    }

    if (Object.keys(cardProductWhere).length > 0) {
      where.cardProduct = cardProductWhere;
    }

    if (stationId) {
      where.stationId = prismaFilter(stationId);
    }

    const cards = await db.card.findMany({
      where,
      take: quantity, // Limit to requested quantity
      orderBy: [{ serialNumber: "asc" }], // Order by serial number ascending
      select: {
        id: true,
        serialNumber: true,
        status: true,
        cardProductId: true,
        quotaTicket: true,
        purchaseDate: true,
        expiredDate: true,
        createdAt: true,
        cardProduct: {
          select: {
            id: true,
            category: {
              select: {
                id: true,
                categoryName: true,
              },
            },
            type: {
              select: {
                id: true,
                typeName: true,
              },
            },
          },
        },
        fileObject: {
          select: {
            id: true,
            originalName: true,
            relativePath: true,
            mimeType: true,
          },
        },
        station: {
          select: {
            id: true,
            stationName: true,
            stationCode: true,
          },
        },
        previousStation: {
          select: {
            id: true,
            stationName: true,
            stationCode: true,
          },
        },
        notes: true,
      },
    });

    // Convert Date objects to ISO strings
    const formattedCards = cards.map((card) => ({
      ...card,
      status: getFriendlyStatus(card.status),
      createdAt: card.createdAt.toISOString(),
      purchaseDate: card.purchaseDate?.toISOString() || null,
      expiredDate: card.expiredDate?.toISOString() || null,
      station: card.station
        ? {
            id: card.station.id,
            stationName: card.station.stationName,
            stationCode: card.station.stationCode,
          }
        : null,
      previousStation: card.previousStation
        ? {
            id: card.previousStation.id,
            stationName: card.previousStation.stationName,
            stationCode: card.previousStation.stationCode,
          }
        : null,
      notes: card.notes || null,
    }));

    return {
      items: formattedCards,
      foundCount: formattedCards.length,
      requestedCount: quantity,
      startSerial: formattedCards[0]?.serialNumber || null,
      endSerial: formattedCards[formattedCards.length - 1]?.serialNumber || null,
    };
  }

  // Update Card
  static async updateCard(
    id: string,
    data: { status?: string; notes?: string; userId: string },
  ) {
    const card = await db.card.findUnique({
      where: { id },
    });

    if (!card) {
      throw new ValidationError("Card not found");
    }

    const { status, notes, userId } = data;
    const updateData: any = {
      updatedBy: userId,
      updatedAt: new Date(),
    };

    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    const updatedCard = await db.card.update({
      where: { id },
      data: updateData,
      include: {
        cardProduct: {
          select: {
            id: true,
            category: { select: { id: true, categoryName: true } },
            type: { select: { id: true, typeName: true } },
          },
        },
        station: {
          select: {
            id: true,
            stationName: true,
            stationCode: true,
          },
        },
        fileObject: {
          select: {
            id: true,
            originalName: true,
            relativePath: true,
            mimeType: true,
          },
        },
        previousStation: {
          select: {
            id: true,
            stationName: true,
            stationCode: true,
          },
        },
      },
    });

    // Format response
    return {
      ...updatedCard,
      status: getFriendlyStatus(updatedCard.status),
      createdAt: updatedCard.createdAt.toISOString(),
      purchaseDate: updatedCard.purchaseDate?.toISOString() || null,
      expiredDate: updatedCard.expiredDate?.toISOString() || null,
      station: updatedCard.station || null,
      previousStation: updatedCard.previousStation || null,
      fileObject: updatedCard.fileObject || null,
      cardProduct: updatedCard.cardProduct as any,
      notes: updatedCard.notes || null,
    };
  }
}
