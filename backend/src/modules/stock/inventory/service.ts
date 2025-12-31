import db from "../../../config/db";

type GetInventoryParams = {
  page?: number;
  limit?: number;
  categoryId?: string;
  typeId?: string;
  stationId?: string;
  search?: string;
  categoryName?: string;
  typeName?: string;
  stationName?: string;
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
      categoryName,
      typeName,
      stationName,
    } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (categoryId) where.categoryId = categoryId;
    if (typeId) where.typeId = typeId;
    if (stationId) where.stationId = stationId;

    if (categoryName) {
      where.category = {
        categoryName: { contains: categoryName, mode: "insensitive" },
      };
    }
    if (typeName) {
      where.type = { typeName: { contains: typeName, mode: "insensitive" } };
    }
    if (stationName) {
      where.station = {
        stationName: { contains: stationName, mode: "insensitive" },
      };
    }

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
          updatedAt: "desc",
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

  // Get Station Summary
  static async getStationSummary() {
    // 1. Ambil data stasiun dahulu (Master data biasanya tidak terlalu besar)
    const stations = await db.station.findMany({
      select: {
        id: true,
        stationName: true,
        stationCode: true,
      },
      orderBy: { stationName: "asc" },
    });

    // 2. Aggregate inventory berdasarkan stationId
    // Note: Inventory yang stationId-nya null (biasanya Office/HQ) akan ter-group dengan stationId = null
    const inventoryGroups = await db.cardInventory.groupBy({
      by: ["stationId"],
      _sum: {
        cardBeredar: true,
        cardAktif: true,
        cardNonAktif: true,
        cardBelumTerjual: true,
        cardOffice: true,
      },
    });

    // 3. Gabungkan hasil
    // Kita buat map untuk akses cepat hasil agregasi
    const summaryMap = new Map();
    inventoryGroups.forEach((group) => {
      summaryMap.set(group.stationId, group._sum);
    });

    // 4. Transform data stations dengan data inventory
    const result = stations.map((station) => {
      const stats = summaryMap.get(station.id) || {
        cardBeredar: 0,
        cardAktif: 0,
        cardNonAktif: 0,
        cardBelumTerjual: 0,
        cardOffice: 0,
      };

      return {
        stationId: station.id,
        stationName: station.stationName,
        stationCode: station.stationCode,
        ...stats,
        // Per stasiun: hanya hitung cardBelumTerjual
        totalCards: stats.cardBelumTerjual || 0,
      };
    });

    // Optional: Tambahkan entry untuk 'Office / No Station' jika ada stok yang tidak assign ke station
    // Tapi biasanya 'stationId: null' bisa dianggap Office.
    // Cek apakah ada grup dengan stationId null
    const nullStationGroup = summaryMap.get(null);
    if (nullStationGroup) {
      result.unshift({
        stationId: null,
        stationName: "Office / Unassigned",
        stationCode: "OFFICE",
        ...nullStationGroup,
        // Office: hanya hitung cardOffice
        totalCards: nullStationGroup.cardOffice || 0,
      });
    }

    return result;
  }

  // Get Office Stock
  static async getOfficeStock(params: GetInventoryParams) {
    const {
      page = 1,
      limit = 10,
      categoryId,
      typeId,
      search,
      categoryName,
      typeName,
    } = params;
    const skip = (page - 1) * limit;

    const where: any = {
      stationId: null, // Critical: Office stock has no station assigned
    };

    if (categoryId) where.categoryId = categoryId;
    if (typeId) where.typeId = typeId;

    if (categoryName) {
      where.category = {
        categoryName: { contains: categoryName, mode: "insensitive" },
      };
    }
    if (typeName) {
      where.type = { typeName: { contains: typeName, mode: "insensitive" } };
    }

    if (search) {
      where.OR = [
        {
          category: { categoryName: { contains: search, mode: "insensitive" } },
        },
        { type: { typeName: { contains: search, mode: "insensitive" } } },
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
          updatedAt: "desc",
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

  static async getTotalSummary() {
    // Menghitung total jumlah seluruh kartu dari tabel Card
    const [totalCards, totalLost, totalDamaged] = await Promise.all([
      db.card.count({
        where: {
          status: {
            notIn: ["LOST", "DAMAGED"],
          },
        },
      }),
      db.card.count({ where: { status: "LOST" } }),
      db.card.count({ where: { status: "DAMAGED" } }),
    ]);

    return {
      totalCards,
      totalLost,
      totalDamaged,
    };
  }
}
