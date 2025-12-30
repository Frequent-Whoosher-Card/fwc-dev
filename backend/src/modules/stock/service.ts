import db from "../../config/db";
import { StockMovementStatus, StockMovementType, Prisma } from "@prisma/client";

type GetHistoryParams = {
  page?: number;
  limit?: number;
  startDate?: Date;
  endDate?: Date;
  type?: StockMovementType;
  status?: StockMovementStatus;
  categoryId?: string;
  stationId?: string;
  search?: string;
};

export class StockService {
  static async getAllMovements(params: GetHistoryParams) {
    const {
      page = 1,
      limit = 10,
      startDate,
      endDate,
      type,
      status,
      categoryId,
      stationId,
      search,
    } = params;

    const skip = (page - 1) * limit;

    const where: Prisma.CardStockMovementWhereInput = {};

    if (startDate || endDate) {
      where.movementAt = {};
      if (startDate) where.movementAt.gte = startDate;
      if (endDate) {
        // Set end date to end of day if provided
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        where.movementAt.lte = endOfDay;
      }
    }

    if (type) where.type = type;
    if (status) where.status = status;
    if (categoryId) where.categoryId = categoryId;
    if (stationId) where.stationId = stationId;

    if (search) {
      where.OR = [
        {
          category: { categoryName: { contains: search, mode: "insensitive" } },
        },
        { cardType: { typeName: { contains: search, mode: "insensitive" } } },
        { station: { stationName: { contains: search, mode: "insensitive" } } },
        { note: { contains: search, mode: "insensitive" } },
      ];
    }

    const [movements, total] = await Promise.all([
      db.cardStockMovement.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: true,
          cardType: true,
          station: true,
        },
        orderBy: {
          movementAt: "desc",
        },
      }),
      db.cardStockMovement.count({ where }),
    ]);

    return {
      movements: movements.map((m) => ({
        ...m,
        movementAt: m.movementAt.toISOString(),
        createdAt: m.createdAt.toISOString(),
        // Add minimal metadata if needed
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getMovementById(id: string) {
    const movement = await db.cardStockMovement.findUnique({
      where: { id },
      include: {
        category: true,
        cardType: true,
        station: true,
      },
    });

    if (!movement) {
      throw {
        statusCode: 404,
        message: "Stock movement not found",
      };
    }

    return {
      ...movement,
      movementAt: movement.movementAt.toISOString(),
      createdAt: movement.createdAt.toISOString(),
      validatedAt: movement.validatedAt?.toISOString() || null,
    };
  }
}
