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

interface InventoryMonitorOptions {
  stationId?: string;
  categoryId?: string;
  typeId?: string;
  startDate?: Date;
  endDate?: Date;
  categoryName?: string;
  typeName?: string;
  stationName?: string;
}

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

  /**
   * Get Summary Grouped by Category & Type
   */
  static async getCategoryTypeSummary(
    options: InventoryMonitorOptions | string = {}
  ) {
    const opts: InventoryMonitorOptions =
      typeof options === "string" ? { stationId: options } : options;
    const {
      stationId,
      categoryId,
      typeId,
      startDate,
      endDate,
      categoryName,
      typeName,
      stationName,
    } = opts;

    const where: any = {};

    if (stationId) where.stationId = stationId;
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
    if (stationName) {
      where.station = {
        stationName: { contains: stationName, mode: "insensitive" },
      };
    }

    if (startDate && endDate) {
      where.updatedAt = { gte: startDate, lte: endDate };
    } else if (startDate) {
      where.updatedAt = { gte: startDate };
    } else if (endDate) {
      where.updatedAt = { lte: endDate };
    }

    // 1. Group by Category & Type
    const grouped = await db.cardInventory.groupBy({
      by: ["categoryId", "typeId"],
      where,
      _sum: {
        cardOffice: true,
        cardBeredar: true,
        cardAktif: true,
        cardNonAktif: true,
        cardBelumTerjual: true,
      },
    });

    if (grouped.length === 0) return [];

    // 2. Fetch Names
    const categoryIds = [...new Set(grouped.map((g) => g.categoryId))];
    const typeIds = [...new Set(grouped.map((g) => g.typeId))];

    const [categories, types] = await Promise.all([
      db.cardCategory.findMany({ where: { id: { in: categoryIds } } }),
      db.cardType.findMany({ where: { id: { in: typeIds } } }),
    ]);

    const catMap = new Map(categories.map((c) => [c.id, c.categoryName]));
    const typeMap = new Map(types.map((t) => [t.id, t.typeName]));

    // 3. Map & Return
    return grouped.map((item) => {
      const office = item._sum.cardOffice ?? 0;
      const beredar = item._sum.cardBeredar ?? 0;
      const aktif = item._sum.cardAktif ?? 0;
      const nonAktif = item._sum.cardNonAktif ?? 0;
      const belumTerjual = item._sum.cardBelumTerjual ?? 0;

      return {
        categoryId: item.categoryId,
        categoryName: catMap.get(item.categoryId) || "Unknown",
        typeId: item.typeId,
        typeName: typeMap.get(item.typeId) || "Unknown",
        totalStock: office + beredar, // Total Asset = Office + Station
        totalOffice: office,
        totalBeredar: beredar,
        totalAktif: aktif,
        totalNonAktif: nonAktif,
        totalBelumTerjual: belumTerjual,
      };
    });
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
    const [totalCards, totalLost, totalDamaged, totalIn, totalOut] =
      await Promise.all([
        db.card.count({
          where: {
            status: {
              in: ["IN_OFFICE", "IN_STATION"],
            },
          },
        }),
        db.card.count({ where: { status: "LOST" } }),
        db.card.count({ where: { status: "DAMAGED" } }),
        db.card.count({ where: { status: "IN_OFFICE" } }),
        db.card.count({ where: { status: "IN_STATION" } }),
      ]);

    return {
      totalCards,
      totalLost,
      totalDamaged,
      totalIn,
      totalOut,
    };
  }

  /**
   * Get Station Inventory Monitor
   * Returns inventory data for all stations formatted for monitoring table
   */
  static async getStationInventoryMonitor(
    options: InventoryMonitorOptions | string = {}
  ) {
    // Handle overload for backwards compatibility or single arg usage if any
    const opts: InventoryMonitorOptions =
      typeof options === "string" ? { stationId: options } : options;
    const {
      stationId,
      categoryId,
      typeId,
      startDate,
      endDate,
      categoryName,
      typeName,
      stationName,
    } = opts;

    const where: any = {
      stationId: {
        not: null, // Only get entries assigned to a station
      },
    };

    if (stationId) {
      where.stationId = stationId;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (typeId) {
      where.typeId = typeId;
    }

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

    if (startDate && endDate) {
      where.updatedAt = {
        gte: startDate,
        lte: endDate,
      };
    } else if (startDate) {
      where.updatedAt = {
        gte: startDate,
      };
    } else if (endDate) {
      where.updatedAt = {
        lte: endDate,
      };
    }

    const inventories = await db.cardInventory.findMany({
      where,
      include: {
        category: true,
        type: true,
        station: true,
      },
      orderBy: [
        { station: { stationName: "asc" } },
        { category: { categoryName: "asc" } },
        { type: { typeName: "asc" } },
      ],
    });

    return inventories.map((inv) => {
      const aktif = inv.cardAktif;
      const nonAktif = inv.cardNonAktif;
      const total = aktif + nonAktif;

      return {
        stationName: inv.station?.stationName || "Unknown Station",
        cardCategory: inv.category.categoryName,
        cardType: inv.type.typeName,
        cardBeredar: inv.cardBeredar,
        aktif,
        nonAktif,
        total,
        cardBelumTerjual: inv.cardBelumTerjual,
      };
    });
  }

  // Get Low Stock Alerts (Mirroring StockService for convenience)
  static async getLowStockAlerts() {
    const alerts = await db.inbox.findMany({
      where: {
        type: "LOW_STOCK",
      },
      orderBy: { sentAt: "desc" },
      take: 20,
    });

    return alerts.map((a) => ({
      id: a.id,
      title: a.title,
      message: a.message,
      sentAt: a.sentAt.toISOString(),
      isRead: a.isRead,
      payload: a.payload,
    }));
  }
}
