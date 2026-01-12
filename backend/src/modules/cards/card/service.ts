import db from "../../../config/db";
import { ValidationError } from "../../../utils/errors";

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
    page?: number;
    limit?: number;
  }) {
    const {
      cardProductId,
      status,
      search,
      page = 1,
      limit = 50,
    } = params || {};

    const where: any = {
      deletedAt: null,
    };

    // Filter by cardProductId
    if (cardProductId) {
      where.cardProductId = cardProductId;
    }

    // Filter by status
    if (status) {
      where.status = status.toUpperCase();
    }

    // Search by serialNumber, Category Name, or Type Name
    if (search) {
      where.OR = [
        { serialNumber: { contains: search, mode: "insensitive" } },
        {
          cardProduct: {
            category: {
              categoryName: { contains: search, mode: "insensitive" },
            },
          },
        },
        {
          cardProduct: {
            type: { typeName: { contains: search, mode: "insensitive" } },
          },
        },
      ];
    }

    // Filter by Category/Type (Relations)
    const cardProductWhere: any = {};

    if (params?.categoryId) {
      cardProductWhere.categoryId = params.categoryId;
    }

    if (params?.typeId) {
      cardProductWhere.typeId = params.typeId;
    }

    if (params?.categoryName) {
      cardProductWhere.category = {
        categoryName: {
          contains: params.categoryName,
          mode: "insensitive",
        },
      };
    }

    if (params?.typeName) {
      cardProductWhere.type = {
        typeName: {
          contains: params.typeName,
          mode: "insensitive",
        },
      };
    }

    if (Object.keys(cardProductWhere).length > 0) {
      where.cardProduct = cardProductWhere;
    }

    const skip = (page - 1) * limit;

    const [cards, total] = await Promise.all([
      db.card.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
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
        },
      }),
      db.card.count({ where }),
    ]);

    // Convert Date objects to ISO strings
    const formattedCards = cards.map((card) => ({
      ...card,
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
      },
    });

    if (!card) {
      throw new ValidationError("Card not found");
    }

    // Convert Date objects to ISO strings
    return {
      ...card,
      createdAt: card.createdAt.toISOString(),
      updatedAt: card.updatedAt.toISOString(),
      purchaseDate: card.purchaseDate?.toISOString() || null,
      expiredDate: card.expiredDate?.toISOString() || null,
      member: card.member || null, // Ensure member is always present (can be null)
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
      },
    });

    if (!card) {
      throw new ValidationError("Card not found");
    }

    // Convert Date objects to ISO strings
    return {
      ...card,
      createdAt: card.createdAt.toISOString(),
      updatedAt: card.updatedAt.toISOString(),
      purchaseDate: card.purchaseDate?.toISOString() || null,
      expiredDate: card.expiredDate?.toISOString() || null,
      member: card.member || null, // Ensure member is always present (can be null)
    };
  }

  // Get First Available Card Serial Number
  static async getFirstAvailableCard(
    cardProductId: string,
    status: string = "IN_STATION"
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
}
