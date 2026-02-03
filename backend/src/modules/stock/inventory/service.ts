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
  programType?: "FWC" | "VOUCHER";
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
  programType?: "FWC" | "VOUCHER";
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
      programType,
    } = params;
    const skip = (page - 1) * limit;

    // 1. Build Card Filter
    const cardWhere: any = {};

    // Filter by Product (Category/Type)
    if (categoryId || typeId || categoryName || typeName || programType) {
      const productWhere: any = {};
      if (programType) {
        productWhere.category = {
          programType: programType,
        };
      }
      if (categoryId) productWhere.categoryId = categoryId;
      if (typeId) productWhere.typeId = typeId;
      if (categoryName) {
        productWhere.category = {
          categoryName: { contains: categoryName, mode: "insensitive" },
        };
      }
      if (typeName) {
        productWhere.type = {
          typeName: { contains: typeName, mode: "insensitive" },
        };
      }
      // Get relevant product IDs first (optimization) or use deep filter
      const products = await db.cardProduct.findMany({
        where: productWhere,
        select: { id: true },
      });
      cardWhere.cardProductId = { in: products.map((p) => p.id) };
    }

    if (stationId) {
      cardWhere.stationId = stationId;
    }
    if (stationName) {
      cardWhere.station = {
        stationName: { contains: stationName, mode: "insensitive" },
      };
    }
    if (search) {
      // Search is tricky with GroupBy. We usually search by Name/Code which are relations.
      // Since we reconstruct the view, we can filter AFTER aggregation, or filter relations here.
      cardWhere.OR = [
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
        { station: { stationName: { contains: search, mode: "insensitive" } } },
      ];
    }

    // Include valid statuses for inventory
    cardWhere.status = {
      in: [
        "IN_OFFICE",
        "IN_STATION",
        "IN_TRANSIT",
        "SOLD_ACTIVE",
        "SOLD_INACTIVE",
      ],
    };

    // 2. Aggregate from Cards
    const grouped = await db.card.groupBy({
      by: ["stationId", "cardProductId", "status"],
      where: cardWhere,
      _count: { _all: true },
    });

    // 3. Transform to Inventory Items
    // Key: `${stationId || 'office'}_${cardProductId}`
    const inventoryMap = new Map<string, any>();

    for (const item of grouped) {
      const key = `${item.stationId || "null"}_${item.cardProductId}`;
      if (!inventoryMap.has(key)) {
        inventoryMap.set(key, {
          id: `virtual_${key}`, // Virtual ID
          stationId: item.stationId,
          categoryId: null, // Will fill later
          typeId: null, // Will fill later
          cardProductId: item.cardProductId, // Temp helper
          cardOffice: 0,
          cardBeredar: 0,
          cardAktif: 0,
          cardNonAktif: 0,
          cardBelumTerjual: 0,
          cardInTransit: 0,
          createdAt: new Date(), // Dummy
          updatedAt: new Date(), // Dummy
        });
      }

      const entry = inventoryMap.get(key);
      const count = item._count._all;
      const status = item.status;

      if (status === "IN_OFFICE") entry.cardOffice += count;
      else if (status === "IN_STATION" || status === "IN_TRANSIT") {
        entry.cardBelumTerjual += count;
        entry.cardBeredar += count;
        if (status === "IN_TRANSIT") entry.cardInTransit += count;
      } else if (status === "SOLD_ACTIVE") {
        entry.cardAktif += count;
        entry.cardBeredar += count;
      } else if (status === "SOLD_INACTIVE") {
        entry.cardNonAktif += count;
        entry.cardBeredar += count;
      }
    }

    // 4. Enrich with Product & Station Info
    const productIds = [
      ...new Set([...inventoryMap.values()].map((i) => i.cardProductId)),
    ];
    const stationIds = [
      ...new Set(
        [...inventoryMap.values()].map((i) => i.stationId).filter(Boolean),
      ),
    ];

    const [products, stations] = await Promise.all([
      db.cardProduct.findMany({
        where: { id: { in: productIds } },
        include: { category: true, type: true },
      }),
      db.station.findMany({
        where: { id: { in: stationIds as string[] } },
      }),
    ]);

    const productMap = new Map(products.map((p) => [p.id, p]));
    const stationMap = new Map(stations.map((s) => [s.id, s]));

    let result = Array.from(inventoryMap.values())
      .map((inv) => {
        const product = productMap.get(inv.cardProductId);
        const station = inv.stationId ? stationMap.get(inv.stationId) : null;

        if (!product) return null;

        return {
          ...inv,
          categoryId: product.categoryId,
          typeId: product.typeId,
          category: product.category,
          type: product.type,
          station: station,
        };
      })
      .filter(Boolean); // Remove nulls

    // Sort by updatedAt desc (simulated) or Name
    result.sort((a, b) => (b.updatedAt > a.updatedAt ? 1 : -1));

    // 5. Pagination
    const total = result.length;
    const paginated = result.slice(skip, skip + limit);

    return {
      stocks: paginated,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getById(id: string) {
    // Since we Virtualized IDs in getAll, getById based on UUID from table might fail if we don't use real IDs.
    // However, the frontend might rely on real table IDs if they were previously fetched.
    // Ideally, we should deprecate getById for inventory since it's dynamic now.
    // OR we try to fetch from real table first.
    // User instruction: "Refactor ... to use Card table aggregation".
    // If I aggregate, there is no single "ID".
    // I will try to support the old behavior if the ID exists in the dirty table,
    // matches the user expectation of "Inventory Detail".
    // BUT the data might be wrong.
    // Let's return the AGGREGATED data for the same Station+Category+Type if possible.
    // Problem: we don't know Station+Category+Type from just ID if we don't query the table.
    // So: Query the table to get metadata (Station, Cat, Type), then RE-CALCULATE the numbers.

    const inventoryMeta = await db.cardInventory.findUnique({
      where: { id },
      include: {
        category: true,
        type: true,
        station: true,
      },
    });

    if (!inventoryMeta) {
      throw {
        statusCode: 404,
        message: "Inventory data not found",
      };
    }

    // Recalculate numbers
    const cardWhere: any = {
      status: {
        in: [
          "IN_OFFICE",
          "IN_STATION",
          "IN_TRANSIT",
          "SOLD_ACTIVE",
          "SOLD_INACTIVE",
        ],
      },
      cardProduct: {
        categoryId: inventoryMeta.categoryId,
        typeId: inventoryMeta.typeId,
      },
    };
    if (inventoryMeta.stationId) {
      cardWhere.stationId = inventoryMeta.stationId;
    } else {
      cardWhere.stationId = null;
    }

    const counts = await db.card.groupBy({
      by: ["status"],
      where: cardWhere,
      _count: { _all: true },
    });

    let cardOffice = 0;
    let cardBelumTerjual = 0;
    let cardAktif = 0;
    let cardNonAktif = 0;
    let cardBeredar = 0;
    let cardInTransit = 0;

    for (const c of counts) {
      const count = c._count._all;
      if (c.status === "IN_OFFICE") cardOffice += count;
      else if (c.status === "IN_STATION" || c.status === "IN_TRANSIT") {
        cardBelumTerjual += count;
        cardBeredar += count;
        if (c.status === "IN_TRANSIT") cardInTransit += count;
      } else if (c.status === "SOLD_ACTIVE") {
        cardAktif += count;
        cardBeredar += count;
      } else if (c.status === "SOLD_INACTIVE") {
        cardNonAktif += count;
        cardBeredar += count;
      }
    }

    return {
      ...inventoryMeta,
      cardOffice,
      cardBelumTerjual,
      cardAktif,
      cardNonAktif,
      cardBeredar,
      cardInTransit,
    };
  }

  /**
   * Get Summary Grouped by Category & Type
   * REFACTORED: Calculates directly from Card table for accuracy
   */
  static async getCategoryTypeSummary(
    options: InventoryMonitorOptions | string = {},
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
      programType,
    } = opts;

    // 1. Build Product Filter (to get Category/Type info)
    const productWhere: any = {};
    if (programType) {
      productWhere.category = {
        programType: programType,
      };
    }

    if (categoryId) productWhere.categoryId = categoryId;
    if (typeId) productWhere.typeId = typeId;
    if (categoryName) {
      productWhere.category = {
        categoryName: { contains: categoryName, mode: "insensitive" },
      };
    }
    if (typeName) {
      productWhere.type = {
        typeName: { contains: typeName, mode: "insensitive" },
      };
    }

    // Fetch Products with Category/Type info
    const products = await db.cardProduct.findMany({
      where: productWhere,
      select: {
        id: true,
        categoryId: true,
        typeId: true,
        category: { select: { categoryName: true } },
        type: { select: { typeName: true } },
      },
    });

    if (products.length === 0) return [];

    const productMap = new Map(products.map((p) => [p.id, p]));
    const productIds = products.map((p) => p.id);

    // 2. Build Card Filter
    const cardWhere: any = {
      cardProductId: { in: productIds },
      // Exclude deleted/lost/damaged from active inventory counts if desired, or keep them?
      // Usually Inventory Summary counts "Good" stock.
      // CardInventory logic tracked: Office, Beredar (BelumTerjual + Aktif + NonAktif).
      // So we should filter for these statuses.
      status: {
        in: [
          "IN_OFFICE",
          "IN_STATION",
          "IN_TRANSIT",
          "ON_TRANSFER",
          "SOLD_ACTIVE",
          "SOLD_INACTIVE",
          "LOST",
          "DAMAGED",
          "BLOCKED",
          "LOST_BY_PASSANGER",
        ] as any[],
      },
    };

    if (stationId) {
      cardWhere.stationId = stationId;
    }
    if (stationName) {
      cardWhere.station = {
        stationName: { contains: stationName, mode: "insensitive" },
      };
    }

    if (startDate || endDate) {
      // Logic Note: "Current Stock" usually implies "Now".
      // If date filters are provided, we should probably filter by 'updatedAt'
      // to show activity? But the request is Inventory Summary.
      // Standard practice for 'Summary' is snapshot.
      // If we *must* support date filtering, it effectively becomes "Stock processed within date range".
      // For now, we apply it to updatedAt if provided, matching previous capability.
      const dateFilter: any = {};
      if (startDate) dateFilter.gte = startDate;
      if (endDate) dateFilter.lte = endDate;
      cardWhere.updatedAt = dateFilter;
    }

    // 3. Aggregate Cards
    const cardCounts = await db.card.groupBy({
      by: ["cardProductId", "status"],
      where: cardWhere,
      _count: {
        _all: true,
      },
    });

    // 4. Process & Group by Category/Type
    // Key: `${categoryId}-${typeId}`
    const resultMap = new Map<
      string,
      {
        categoryId: string;
        categoryName: string;
        typeId: string;
        typeName: string;
        totalOffice: number;
        totalBelumTerjual: number;
        totalAktif: number;
        totalNonAktif: number;
        totalInTransit: number;
        totalLost: number;
        totalDamaged: number;
        totalOther: number;
      }
    >();

    // Initial population with product info (to ensure even zero counts appear if product exists? - Optional. Logic below populates based on cards found or products list)
    // Let's iterate products to ensure we list all requested products even if count is 0
    for (const p of products) {
      const key = `${p.categoryId}-${p.typeId}`;
      if (!resultMap.has(key)) {
        resultMap.set(key, {
          categoryId: p.categoryId,
          categoryName: p.category.categoryName,
          typeId: p.typeId,
          typeName: p.type.typeName,
          totalOffice: 0,
          totalBelumTerjual: 0,
          totalAktif: 0,
          totalNonAktif: 0,
          totalInTransit: 0,
          totalLost: 0,
          totalDamaged: 0,
          totalOther: 0,
        });
      }
    }

    // Fill counts
    for (const item of cardCounts) {
      const product = productMap.get(item.cardProductId);
      if (!product) continue;

      const key = `${product.categoryId}-${product.typeId}`;
      const entry = resultMap.get(key);
      if (entry) {
        const count = item._count._all;
        const status = item.status;

        if (status === "IN_OFFICE") entry.totalOffice += count;
        else if (status === "IN_STATION") entry.totalBelumTerjual += count;
        else if (status === "IN_TRANSIT") entry.totalInTransit += count;
        else if (status === "SOLD_ACTIVE") entry.totalAktif += count;
        else if (status === "SOLD_INACTIVE") entry.totalNonAktif += count;
        else {
          // LOST, DAMAGED, ON_TRANSFER, BLOCKED, OTHER -> Merge into InTransit
          // to ensure Table Total matches Total Summary without adding columns (User Request)
          entry.totalInTransit += count;
        }
      }
    }

    // 5. Transform to Final Output
    return Array.from(resultMap.values()).map((item) => {
      const totalBeredar =
        item.totalBelumTerjual + item.totalAktif + item.totalNonAktif;
      const totalStock = item.totalOffice + totalBeredar + item.totalInTransit; // item.totalInTransit now includes Lost/Damaged/Other

      return {
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        typeId: item.typeId,
        typeName: item.typeName,
        totalStock,
        totalOffice: item.totalOffice,
        totalBeredar,
        totalAktif: item.totalAktif,
        totalNonAktif: item.totalNonAktif,
        totalBelumTerjual: item.totalBelumTerjual,
        totalInTransit: item.totalInTransit,
        totalLost: item.totalLost,
        totalDamaged: item.totalDamaged,
        totalOther: item.totalOther,
      };
    });
  }

  // Get Station Summary
  static async getStationSummary(programType?: "FWC" | "VOUCHER") {
    // 1. Ambil data stasiun dahulu (Master data biasanya tidak terlalu besar)
    const stations = await db.station.findMany({
      select: {
        id: true,
        stationName: true,
        stationCode: true,
      },
      orderBy: { stationName: "asc" },
    });

    // 2. Aggregate inventory berdasarkan stationId (Realtime Count)
    const cardWhere: any = {
      status: {
        in: [
          "IN_STATION",
          "IN_TRANSIT",
          "ON_TRANSFER",
          "SOLD_ACTIVE",
          "SOLD_INACTIVE",
          "LOST",
          "DAMAGED",
          "BLOCKED",
          "LOST_BY_PASSANGER",
        ],
      },
    };

    if (programType) {
      cardWhere.cardProduct = { category: { programType } };
    }
    const cardCounts = await db.card.groupBy({
      by: ["stationId", "status"],
      where: cardWhere,
      _count: { _all: true },
    });
    // Note: cardBelumTerjual = IN_STATION.

    // Group by Station
    const summaryMap = new Map<
      string,
      {
        total: number;
        inTransit: number;
        sold: number;
        lostDamaged: number;
        inStation: number;
      }
    >();
    cardCounts.forEach((c) => {
      if (!c.stationId) return;
      const current = summaryMap.get(c.stationId) || {
        total: 0,
        inTransit: 0,
        sold: 0,
        lostDamaged: 0,
        inStation: 0,
      };
      const count = c._count._all;
      current.total += count;

      if (c.status === "IN_STATION") {
        current.inStation += count;
      } else if (c.status === "SOLD_ACTIVE" || c.status === "SOLD_INACTIVE") {
        current.sold += count;
      } else {
        // IN_TRANSIT, ON_TRANSFER, LOST, DAMAGED, BLOCKED -> Merge into InTransit
        current.inTransit += count;
      }

      summaryMap.set(c.stationId, current);
    });

    // 3. Transform
    const result = stations.map((station) => {
      const stats = summaryMap.get(station.id) || {
        total: 0,
        inTransit: 0,
        sold: 0,
        lostDamaged: 0,
        inStation: 0,
      };

      return {
        stationId: station.id,
        stationName: station.stationName,
        stationCode: station.stationCode,
        cardBeredar: stats.total - stats.sold, // Beredar = yang belum terjual (Station + Transit + Lost/Damaged)
        cardAktif: stats.sold,
        cardNonAktif: 0, // Not separated here
        cardBelumTerjual: stats.inStation,
        cardInTransit: stats.inTransit,
        cardOffice: 0,
        totalCards: stats.total,
      };
    });

    // Add Office Stats
    const officeCount = await db.card.count({ where: { status: "IN_OFFICE" } });
    if (officeCount > 0) {
      result.unshift({
        stationId: null as any,
        stationName: "Office / Unassigned",
        stationCode: "OFFICE",
        cardBeredar: 0,
        cardAktif: 0,
        cardNonAktif: 0,
        cardBelumTerjual: 0,
        cardInTransit: 0,
        cardOffice: officeCount,
        totalCards: officeCount,
      });
    }

    return result;
  }

  // Get Office Stock
  static async getOfficeStock(params: GetInventoryParams) {
    // Reuse getAll logic but force stationId = null
    // But getAll logic groups by Station first.
    // Let's customize for Office to ensure strict filtering.
    const {
      page = 1,
      limit = 10,
      categoryId,
      typeId,
      search,
      categoryName,
      typeName,
      programType,
    } = params;
    const skip = (page - 1) * limit;

    const cardWhere: any = {
      status: "IN_OFFICE",
      // stationId: null, // Usually IN_OFFICE implies stationId null, but explicit check is good.
    };

    // Filter by Product (Category/Type)
    if (categoryId || typeId || categoryName || typeName || programType) {
      const productWhere: any = {};
      if (programType) {
        productWhere.category = {
          programType: programType,
        };
      }
      if (categoryId) productWhere.categoryId = categoryId;
      if (typeId) productWhere.typeId = typeId;
      if (categoryName) {
        productWhere.category = {
          categoryName: { contains: categoryName, mode: "insensitive" },
        };
      }
      if (typeName) {
        productWhere.type = {
          typeName: { contains: typeName, mode: "insensitive" },
        };
      }
      const products = await db.cardProduct.findMany({
        where: productWhere,
        select: { id: true },
      });
      cardWhere.cardProductId = { in: products.map((p) => p.id) };
    }

    // Search
    if (search) {
      cardWhere.OR = [
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

    // Aggregate
    const grouped = await db.card.groupBy({
      by: ["cardProductId"],
      where: cardWhere,
      _count: { _all: true },
    });

    // Transform
    // Fetch Products
    const productIds = grouped.map((g) => g.cardProductId);
    const products = await db.cardProduct.findMany({
      where: { id: { in: productIds } },
      include: { category: true, type: true },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    const result = grouped
      .map((g) => {
        const product = productMap.get(g.cardProductId);
        if (!product) return null;
        return {
          id: `office_${g.cardProductId}`,
          stationId: null,
          categoryId: product.categoryId,
          typeId: product.typeId,
          cardProductId: product.id,
          cardOffice: g._count._all,
          // Others 0
          cardBeredar: 0,
          cardAktif: 0,
          cardNonAktif: 0,
          cardBelumTerjual: 0,
          cardInTransit: 0,
          category: product.category,
          type: product.type,
          station: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      })
      .filter(Boolean);

    // Pagination
    // Sort
    result.sort((a: any, b: any) =>
      (a.category.categoryName + a.type.typeName).localeCompare(
        b.category.categoryName + b.type.typeName,
      ),
    );

    const total = result.length;
    const paginated = result.slice(skip, skip + limit);

    return {
      stocks: paginated,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getTotalSummary(programType?: "FWC" | "VOUCHER") {
    const where: any = {};
    if (programType) {
      where.cardProduct = { category: { programType } };
    }

    // Menghitung total jumlah seluruh kartu dari tabel Card
    const [totalCards, totalLost, totalDamaged, totalIn, totalOut, totalOther] =
      await Promise.all([
        // Total All Physical Cards (Excluding ON_REQUEST which are not yet "in" inventory)
        db.card.count({
          where: {
            ...where,
            status: {
              not: "ON_REQUEST",
            },
          },
        }),
        db.card.count({ where: { ...where, status: "LOST" } }),
        db.card.count({ where: { ...where, status: "DAMAGED" } }),
        // Total In = Currently In Office
        db.card.count({ where: { ...where, status: "IN_OFFICE" } }),
        // Total Out = Distributed (Station + Transit + Sold + Transfer)
        db.card.count({
          where: {
            ...where,
            status: {
              in: [
                "IN_STATION",
                "IN_TRANSIT",
                "ON_TRANSFER",
                "SOLD_ACTIVE",
                "SOLD_INACTIVE",
                "LOST",
                "DAMAGED",
                "BLOCKED",
                "LOST_BY_PASSANGER",
              ],
            },
          },
        }),
        // Remaining statuses for verification/accounting (should be 0 if we covered everything)
        db.card.count({
          where: {
            ...where,
            status: {
              in: ["DELETED"],
            },
          },
        }),
      ]);

    // Note: totalOut now includes LOST/DAMAGED as requested.

    return {
      totalCards,
      totalLost,
      totalDamaged,
      totalIn,
      totalOut,
      totalOther,
    };
  }

  /**
   * Get Station Inventory Monitor
   * Returns inventory data for all stations formatted for monitoring table
   */
  static async getStationInventoryMonitor(
    options: InventoryMonitorOptions | string = {},
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
      programType,
    } = opts;

    const cardWhere: any = {
      stationId: { not: null }, // Only show valid stations
      status: {
        in: [
          "IN_STATION",
          "IN_TRANSIT",
          "ON_TRANSFER",
          "SOLD_ACTIVE",
          "SOLD_INACTIVE",
          "LOST",
          "DAMAGED",
          "BLOCKED",
          "LOST_BY_PASSANGER",
        ],
      },
    };

    if (stationId) cardWhere.stationId = stationId;

    // Filter Product
    if (categoryId || typeId || categoryName || typeName || programType) {
      const productWhere: any = {};
      if (programType) {
        productWhere.category = {
          programType: programType,
        };
      }
      if (categoryId) productWhere.categoryId = categoryId;
      if (typeId) productWhere.typeId = typeId;
      if (categoryName) {
        productWhere.category = {
          categoryName: { contains: categoryName, mode: "insensitive" },
        };
      }
      if (typeName) {
        productWhere.type = {
          typeName: { contains: typeName, mode: "insensitive" },
        };
      }
      const products = await db.cardProduct.findMany({
        where: productWhere,
        select: { id: true },
      });
      cardWhere.cardProductId = { in: products.map((p) => p.id) };
    }

    // Station Name
    if (stationName) {
      const stations = await db.station.findMany({
        where: { stationName: { contains: stationName, mode: "insensitive" } },
        select: { id: true },
      });
      if (cardWhere.stationId) {
        // Intersection if both provided, but usually singular logic
      } else {
        cardWhere.stationId = { in: stations.map((s) => s.id) };
      }
    }

    if (startDate || endDate) {
      const dateFilter: any = {};
      if (startDate) dateFilter.gte = startDate;
      if (endDate) dateFilter.lte = endDate;
      cardWhere.updatedAt = dateFilter;
    }

    // Aggregate
    const grouped = await db.card.groupBy({
      by: ["stationId", "cardProductId", "status"],
      where: cardWhere,
      _count: { _all: true },
    });

    // Populate Map
    // Key: `${stationId}_${cardProductId}`
    const inventoryMap = new Map<string, any>();

    for (const item of grouped) {
      // Allow null stationId
      const key = `${item.stationId ?? "null"}_${item.cardProductId}`;

      if (!inventoryMap.has(key)) {
        inventoryMap.set(key, {
          stationId: item.stationId,
          cardProductId: item.cardProductId,
          cardBelumTerjual: 0, // IN_STATION
          aktif: 0, // SOLD_ACTIVE
          nonAktif: 0, // SOLD_INACTIVE
          inTransit: 0, // IN_TRANSIT + ON_TRANSFER
          lost: 0,
          damaged: 0,
          other: 0,
          // Beredar = sum
        });
      }

      const entry = inventoryMap.get(key);
      const count = item._count._all;

      if (item.status === "IN_STATION") entry.cardBelumTerjual += count;
      else if (item.status === "SOLD_ACTIVE") entry.aktif += count;
      else if (item.status === "SOLD_INACTIVE") entry.nonAktif += count;
      else if (item.status === "IN_TRANSIT" || item.status === "ON_TRANSFER")
        entry.inTransit += count;
      else if (item.status === "LOST" || item.status === "LOST_BY_PASSANGER")
        entry.lost += count;
      else if (item.status === "DAMAGED") entry.damaged += count;
      else entry.other += count;
    }

    // Enrich
    const productIds = [
      ...new Set([...inventoryMap.values()].map((i) => i.cardProductId)),
    ];
    const stationIds = [
      ...new Set(
        [...inventoryMap.values()]
          .map((i) => i.stationId)
          .filter((id) => id !== null),
      ),
    ];

    const [products, stations] = await Promise.all([
      db.cardProduct.findMany({
        where: { id: { in: productIds } },
        include: { category: true, type: true },
      }),
      db.station.findMany({
        where: { id: { in: stationIds as string[] } },
      }),
    ]);

    const productMap = new Map(products.map((p) => [p.id, p]));
    const stationMap = new Map(stations.map((s) => [s.id, s]));

    const result = Array.from(inventoryMap.values())
      .map((inv) => {
        const product = productMap.get(inv.cardProductId);
        const station = stationMap.get(inv.stationId);

        if (!product) return null;

        const stationName = station
          ? station.stationName
          : "Stasiun Tidak Diketahui / Unassigned";

        const total = inv.aktif + inv.nonAktif; // Used to be cardAktif + cardNonAktif?
        // In monitor response:
        // total = aktif + nonAktif; (from previous code)
        // cardBeredar = cardBeredar (from CardInventory, which was sum of all 3)
        // cardBelumTerjual
        const cardBeredar =
          inv.cardBelumTerjual + inv.inTransit + inv.aktif + inv.nonAktif;

        return {
          stationName: stationName,
          cardCategory: product.category.categoryName,
          cardType: product.type.typeName,
          cardBeredar: cardBeredar,
          aktif: inv.aktif,
          nonAktif: inv.nonAktif,
          total: total,
          cardBelumTerjual: inv.cardBelumTerjual,
          cardInTransit: inv.inTransit,
          lost: inv.lost,
          damaged: inv.damaged,
          other: inv.other,
        };
      })
      .filter(Boolean);

    // Sort
    result.sort((a: any, b: any) => {
      if (a.stationName !== b.stationName)
        return a.stationName.localeCompare(b.stationName);
      if (a.cardCategory !== b.cardCategory)
        return a.cardCategory.localeCompare(b.cardCategory);
      return a.cardType.localeCompare(b.cardType);
    });

    return result;
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
