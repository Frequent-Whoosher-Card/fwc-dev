import db from "../../config/db";
import { CardStatus } from "@prisma/client";
import { NotFoundError, ValidationError } from "../../utils/errors";

export class RedeemService {
  /**
   * Check card details by serial number
   * @param serialNumber Serial number of the card
   */
  static async checkSerial(serialNumber: string) {
    const card = await db.card.findUnique({
      where: { serialNumber },
      include: {
        member: true,
        user: true,
        cardProduct: {
          include: {
            category: true,
            type: true,
          },
        },
      },
    });

    if (!card) {
      throw new NotFoundError("Card not found");
    }

    // Determine status text
    let statusActive = "Tidak Aktif";

    // Status logic update:
    // SOLD_ACTIVE -> Aktif
    // SOLD_INACTIVE -> Tidak Aktif (but still return data)
    // Others -> Use the raw status string (or map as needed, e.g. "Expired" was previously mapped from SOLD_INACTIVE)

    if (card.status === CardStatus.SOLD_ACTIVE) {
      statusActive = "ACTIVE";
    } else if (card.status === CardStatus.SOLD_INACTIVE) {
      statusActive = "EXPIRED";
    } else {
      statusActive = card.status;
    }

    // Customer Name & NIK
    let customerName = "-";
    let nik = "-";

    if (card.member) {
      customerName = card.member.name;
      nik = card.member.identityNumber;
    } else if (card.user) {
      // Fallback or optional: if internal card assigned to user
      // customerName = card.user.fullName;
    }

    return {
      nik,
      customerName,
      cardCategory: card.cardProduct.category.categoryName,
      cardType: card.cardProduct.type.typeName,
      serialNumber: card.serialNumber,
      quotaRemaining: card.quotaTicket,
      statusActive,
      purchaseDate: card.purchaseDate ? card.purchaseDate.toISOString() : null,
      expiredDate: card.expiredDate ? card.expiredDate.toISOString() : null,
      route: (() => {
        const desc = card.cardProduct.type.routeDescription;
        if (!desc) return null;
        const parts = desc.split("-").map((s) => s.trim());
        if (parts.length >= 2) {
          return {
            origin: parts[0],
            destination: parts[1],
          };
        }
        return {
          origin: desc,
          destination: "-",
        };
      })(),
    };
  }

  static async redeemCard(
    serialNumber: string,
    quotaUsed: number,
    operatorId: string,
    stationId: string,
    notes?: string
  ): Promise<{ transactionNumber: string; remainingQuota: number }> {
    return await db.$transaction(
      async (tx) => {
        const card = await tx.card.findUnique({
          where: { serialNumber },
          include: { cardProduct: true, fileObject: true },
        });

        if (!card) {
          throw new NotFoundError("Card not found");
        }

        // Check if card is active
        if (card.status !== CardStatus.SOLD_ACTIVE) {
          throw new ValidationError("Card is not active");
        }

        // Check Expired Date
        if (card.expiredDate && new Date() > card.expiredDate) {
          throw new ValidationError("Card is expired");
        }

        // Check Quota
        if (card.quotaTicket < quotaUsed) {
          throw new ValidationError("Not enough quota");
        }

        // Calculate transaction number
        const date = new Date();
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD
        const count = await tx.redeem.count({
          where: {
            createdAt: {
              gte: new Date(date.setHours(0, 0, 0, 0)),
              lt: new Date(date.setHours(23, 59, 59, 999)),
            },
          },
        });
        const transactionNumber = `TRX-${dateStr}-${(count + 1)
          .toString()
          .padStart(4, "0")}`;

        // Create Redeem Record
        await tx.redeem.create({
          data: {
            cardId: card.id,
            operatorId,
            stationId,
            transactionNumber,
            shiftDate: new Date(),
            status: "Success",
            fileObjectId: card.fileObjectId,
            notes: notes || null,
          },
        });

        // Update Card Quota
        const updatedCard = await tx.card.update({
          where: { id: card.id },
          data: {
            quotaTicket: { decrement: quotaUsed },
            updatedAt: new Date(),
          },
        });

        // Create Usage Log
        await tx.cardUsageLog.create({
          data: {
            cardId: card.id,
            quotaUsed: quotaUsed,
            remainingQuota: updatedCard.quotaTicket,
            usageDate: new Date(),
          },
        });

        return {
          transactionNumber,
          remainingQuota: updatedCard.quotaTicket,
        };
      },
      {
        timeout: 10000,
      }
    );
  }

  // Get All Redeems (List)
  static async getRedeems(params: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    stationId?: string;
    search?: string;
  }) {
    const {
      page = 1,
      limit = 10,
      startDate,
      endDate,
      stationId,
      search,
    } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Date Range Filter
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        // Set end date to end of day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    // Station Filter
    if (stationId) {
      where.stationId = stationId;
    }

    // Search Filter
    if (search) {
      where.OR = [
        { transactionNumber: { contains: search, mode: "insensitive" } },
        {
          card: {
            serialNumber: { contains: search, mode: "insensitive" },
          },
        },
      ];
    }

    const [items, total] = await Promise.all([
      db.redeem.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          station: {
            select: {
              id: true,
              stationName: true,
            },
          },
          operator: {
            select: {
              id: true,
              fullName: true,
            },
          },
          card: {
            select: {
              id: true,
              serialNumber: true,
              cardProduct: {
                select: {
                  category: { select: { categoryName: true } },
                  type: { select: { typeName: true } },
                },
              },
            },
          },
        },
      }),
      db.redeem.count({ where }),
    ]);

    // Format response dates
    const formattedItems = items.map((item) => ({
      ...item,
      shiftDate: item.shiftDate.toISOString(),
      createdAt: item.createdAt.toISOString(),
    }));

    return {
      items: formattedItems,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get Redeem By ID (Detail)
  static async getRedeemById(id: string) {
    const redeem = await db.redeem.findUnique({
      where: { id },
      include: {
        station: {
          select: {
            id: true,
            stationName: true,
          },
        },
        operator: {
          select: {
            id: true,
            fullName: true,
          },
        },
        card: {
          select: {
            id: true,
            serialNumber: true,
            cardProduct: {
              select: {
                category: { select: { categoryName: true } },
                type: { select: { typeName: true } },
              },
            },
          },
        },
      },
    });

    if (!redeem) {
      throw new NotFoundError("Redeem transaction not found");
    }

    return {
      ...redeem,
      shiftDate: redeem.shiftDate.toISOString(),
      createdAt: redeem.createdAt.toISOString(),
    };
  }

  // Update Redeem (e.g., Notes)
  static async updateRedeem(id: string, data: { notes?: string }) {
    const redeem = await db.redeem.findUnique({
      where: { id },
    });

    if (!redeem) {
      throw new NotFoundError("Redeem transaction not found");
    }

    const updatedRedeem = await db.redeem.update({
      where: { id },
      data: {
        notes: data.notes,
      },
      include: {
        station: {
          select: {
            id: true,
            stationName: true,
          },
        },
        operator: {
          select: {
            id: true,
            fullName: true,
          },
        },
        card: {
          select: {
            id: true,
            serialNumber: true,
            cardProduct: {
              select: {
                category: { select: { categoryName: true } },
                type: { select: { typeName: true } },
              },
            },
          },
        },
      },
    });

    return {
      ...updatedRedeem,
      shiftDate: updatedRedeem.shiftDate.toISOString(),
      createdAt: updatedRedeem.createdAt.toISOString(),
    };
  }
}
