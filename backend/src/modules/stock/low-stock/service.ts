import db from "../../../config/db";

interface LowStockItem {
  id: string;
  stationName: string;
  categoryName: string;
  typeName: string;
  currentStock: number;
  minThreshold: number;
  programType: "FWC" | "VOUCHER";
  scope: "OFFICE" | "STATION";
}

export class LowStockEndpointService {
  /**
   * Get Low Stock Items based on scope and filters
   */
  static async getLowStockItems(params: {
    scope?: "OFFICE" | "STATION" | "GLOBAL";
    programType?: "FWC" | "VOUCHER";
    stationId?: string;
  }): Promise<LowStockItem[]> {
    const { scope = "GLOBAL", programType, stationId } = params;
    const results: LowStockItem[] = [];

    // 1. Fetch Master Data (Products & Thresholds)
    const productWhere: any = {};
    if (programType) {
      productWhere.category = { programType };
    }

    const products = await db.cardProduct.findMany({
      where: productWhere,
      include: {
        category: true,
        type: true,
      },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    // 2. Helper to check threshold
    const checkLimit = (
      qty: number,
      product: any,
    ): { isLow: boolean; threshold: number } => {
      // Logic for threshold (can be customized per product type logic)
      // Defaulting to type.minStockThreshold or 0
      const threshold = product.type.minStockThreshold || 0;
      return { isLow: qty <= threshold, threshold };
    };

    // --- CASE A: OFFICE SCOPE (or GLOBAL) ---
    if (scope === "OFFICE" || scope === "GLOBAL") {
      // Count IN_OFFICE cards per product
      const officeCounts = await db.card.groupBy({
        by: ["cardProductId"],
        where: {
          status: "IN_OFFICE",
          cardProduct: programType ? { category: { programType } } : undefined,
        },
        _count: { _all: true },
      });

      // Map existing counts
      const officeStockMap = new Map(
        officeCounts.map((c) => [c.cardProductId, c._count._all]),
      );

      // Check ALL products (even if 0 stock)
      for (const product of products) {
        const qty = officeStockMap.get(product.id) || 0;
        const { isLow, threshold } = checkLimit(qty, product);

        if (isLow) {
          results.push({
            id: `OFFICE_${product.id}`,
            stationName: "Head Office",
            categoryName: product.category.categoryName,
            typeName: product.type.typeName,
            currentStock: qty,
            minThreshold: threshold,
            programType: product.category.programType as "FWC" | "VOUCHER",
            scope: "OFFICE",
          });
        }
      }
    }

    // --- CASE B: STATION SCOPE (or GLOBAL) ---
    if (scope === "STATION" || scope === "GLOBAL") {
      // 1. Fetch Stations (to ensure we list Station Name correctly)
      const stationWhere: any = {};
      if (stationId) stationWhere.id = stationId;

      const stations = await db.station.findMany({
        where: stationWhere,
        select: { id: true, stationName: true },
      });

      const stationMap = new Map(stations.map((s) => [s.id, s.stationName]));

      // 2. Count IN_STATION cards per Station per Product
      const stationCounts = await db.card.groupBy({
        by: ["stationId", "cardProductId"],
        where: {
          status: "IN_STATION",
          stationId: stationId || undefined, // Filter if specific station requested
          cardProduct: programType ? { category: { programType } } : undefined,
        },
        _count: { _all: true },
      });

      // Map counts: Key = `${stationId}_${productId}`
      const stationStockMap = new Map();
      stationCounts.forEach((c) => {
        if (c.stationId) {
          stationStockMap.set(
            `${c.stationId}_${c.cardProductId}`,
            c._count._all,
          );
        }
      });

      // Iterate ALL Stations x ALL Products => Check Low Stock
      // This ensures we catch "0 stock" cases which findMany/groupBy implies as missing rows
      for (const station of stations) {
        for (const product of products) {
          const qty = stationStockMap.get(`${station.id}_${product.id}`) || 0;
          const { isLow, threshold } = checkLimit(qty, product);

          if (isLow) {
            results.push({
              id: `${station.id}_${product.id}`,
              stationName: station.stationName,
              categoryName: product.category.categoryName,
              typeName: product.type.typeName,
              currentStock: qty,
              minThreshold: threshold,
              programType: product.category.programType as "FWC" | "VOUCHER",
              scope: "STATION",
            });
          }
        }
      }
    }

    return results;
  }
}
