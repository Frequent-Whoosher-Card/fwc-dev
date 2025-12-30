import db from "../../../config/db";

type GetInventoryParams = {
  page?: number;
  limit?: number;
  categoryId?: string;
  typeId?: string;
  stationId?: string;
  search?: string;
};

export class CardInventoryService {
  static async getAll(params: GetInventoryParams) {
    const {
      page = 1,
      limit = 10,
      categoryId,
      typeId,
      stationId,
      search,
    } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (categoryId) where.categoryId = categoryId;
    if (typeId) where.typeId = typeId;
    if (stationId) where.stationId = stationId;

    if (search) {
      where.OR = [
        {
          category: { categoryName: { contains: search, mode: "insensitive" } },
        },
        { type: { typeName: { contains: search, mode: "insensitive" } } },
        { station: { stationName: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [inventories, total] = await Promise.all([
      db.cardInventory.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: true,
          type: true,
          station: true,
        },
        orderBy: {
          lastUpdated: "desc",
        },
      }),
      db.cardInventory.count({ where }),
    ]);

    return {
      stocks: inventories,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getById(id: string) {
    const inventory = await db.cardInventory.findUnique({
      where: { id },
      include: {
        category: true,
        type: true,
        station: true,
      },
    });

    if (!inventory) {
      throw {
        statusCode: 404,
        message: "Inventory data not found",
      };
    }

    return inventory;
  }
}
