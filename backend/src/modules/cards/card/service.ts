import db from "../../../config/db";
import { ValidationError } from "../../../utils/errors";

export class CardService {
  // Get All Cards with filters
  static async getCards(params?: {
    cardProductId?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { cardProductId, status, search, page = 1, limit = 50 } = params || {};

    const where: any = {
      deletedAt: null,
    };

    // Filter by cardProductId
    if (cardProductId) {
      where.cardProductId = cardProductId;
    }

    // Filter by status
    if (status) {
      where.status = status;
    }

    // Search by serialNumber
    if (search) {
      where.serialNumber = {
        contains: search,
        mode: "insensitive" as const,
      };
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
    };
  }
}

