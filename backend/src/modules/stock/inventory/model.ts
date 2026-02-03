import { t } from "elysia";

export namespace CardInventoryModel {
  export const getInventoryListQuery = t.Object({
    page: t.Optional(t.String()),
    limit: t.Optional(t.String()),
    categoryId: t.Optional(t.String()),
    typeId: t.Optional(t.String()),
    stationId: t.Optional(t.String()),
    search: t.Optional(t.String()),
    categoryName: t.Optional(t.String()),
    typeName: t.Optional(t.String()),
    stationName: t.Optional(t.String()),
    programType: t.Optional(t.Union([t.Literal("FWC"), t.Literal("VOUCHER")])),
  });

  export const getOfficeStockQuery = t.Object({
    page: t.Optional(t.String()),
    limit: t.Optional(t.String()),
    categoryId: t.Optional(t.String()),
    typeId: t.Optional(t.String()),
    search: t.Optional(t.String()),
    categoryName: t.Optional(t.String()),
    typeName: t.Optional(t.String()),
    programType: t.Optional(t.Union([t.Literal("FWC"), t.Literal("VOUCHER")])),
  });

  export const getCategoryTypeSummaryQuery = t.Object({
    stationId: t.Optional(t.String()),
    categoryId: t.Optional(t.String()),
    typeId: t.Optional(t.String()),
    startDate: t.Optional(t.String()),
    endDate: t.Optional(t.String()),
    categoryName: t.Optional(t.String()),
    typeName: t.Optional(t.String()),
    stationName: t.Optional(t.String()),
    programType: t.Optional(t.Union([t.Literal("FWC"), t.Literal("VOUCHER")])),
  });

  export const inventoryItem = t.Object({
    id: t.String(),
    categoryId: t.String(),
    typeId: t.String(),
    stationId: t.Union([t.String(), t.Null()]),
    cardBeredar: t.Number(),
    cardAktif: t.Number(),
    cardNonAktif: t.Number(),
    cardBelumTerjual: t.Number(),
    cardInTransit: t.Number(),
    cardOffice: t.Union([t.Number(), t.Null()]),
    updatedAt: t.Date(),
    category: t.Object({
      categoryName: t.String(),
      categoryCode: t.String(),
    }),
    type: t.Object({
      typeName: t.String(),
      typeCode: t.String(),
    }),
    station: t.Union([
      t.Object({
        stationName: t.String(),
        stationCode: t.String(),
      }),
      t.Null(),
    ]),
  });

  export const getInventoryListResponse = t.Object({
    success: t.Boolean(),
    data: t.Object({
      stocks: t.Array(
        t.Nullable(
          t.Object({
            id: t.String(),
            categoryId: t.String(),
            typeId: t.String(),
            stationId: t.Union([t.String(), t.Null()]),
            cardBeredar: t.Number(),
            cardAktif: t.Number(),
            cardNonAktif: t.Number(),
            cardBelumTerjual: t.Number(),
            cardOffice: t.Union([t.Number(), t.Null()]),
            updatedAt: t.Date(),
            category: t.Object({
              categoryName: t.String(),
              categoryCode: t.String(),
            }),
            type: t.Object({
              typeName: t.String(),
              typeCode: t.String(),
            }),
            station: t.Union([
              t.Object({
                stationName: t.String(),
                stationCode: t.String(),
              }),
              t.Null(),
            ]),
          }),
        ),
      ),
      pagination: t.Object({
        total: t.Number(),
        page: t.Number(),
        limit: t.Number(),
        totalPages: t.Number(),
      }),
    }),
  });

  export const getInventoryDetailResponse = t.Object({
    success: t.Boolean(),
    data: t.Object({
      id: t.String(),
      categoryId: t.String(),
      typeId: t.String(),
      stationId: t.Union([t.String(), t.Null()]),
      cardBeredar: t.Number(),
      cardAktif: t.Number(),
      cardNonAktif: t.Number(),
      cardBelumTerjual: t.Number(),
      cardInTransit: t.Number(),
      cardOffice: t.Union([t.Number(), t.Null()]),
      updatedAt: t.Date(),
      category: t.Object({
        categoryName: t.String(),
        categoryCode: t.String(),
      }),
      type: t.Object({
        typeName: t.String(),
        typeCode: t.String(),
      }),
      station: t.Union([
        t.Object({
          stationName: t.String(),
          stationCode: t.String(),
        }),
        t.Null(),
      ]),
    }),
  });

  export const getStationSummaryResponse = t.Object({
    success: t.Boolean(),
    data: t.Array(
      t.Object({
        stationId: t.Union([t.String(), t.Null()]),
        stationName: t.String(),
        stationCode: t.String(),
        totalCards: t.Number(),
      }),
    ),
  });

  export const getTotalSummaryResponse = t.Object({
    success: t.Boolean(),
    data: t.Object({
      totalCards: t.Number(),
      totalLost: t.Number(),
      totalDamaged: t.Number(),
      totalIn: t.Number(),
      totalOut: t.Number(),
      totalOther: t.Number(),
    }),
  });

  export const getCategoryTypeSummaryResponse = t.Object({
    success: t.Boolean(),
    data: t.Array(
      t.Object({
        categoryId: t.String(),
        categoryName: t.String(),
        typeId: t.String(),
        typeName: t.String(),
        totalStock: t.Number(), // Total Aset (Office + Beredar)
        totalOffice: t.Number(),
        totalBeredar: t.Number(), // Di Stasiun
        totalAktif: t.Number(),
        totalNonAktif: t.Number(),
        totalBelumTerjual: t.Number(),
        totalInTransit: t.Number(),
        totalLost: t.Number(),
        totalDamaged: t.Number(),
        totalOther: t.Number(),
      }),
    ),
  });

  export const stationInventoryMonitorItem = t.Object({
    stationName: t.String(),
    cardCategory: t.String(),
    cardType: t.String(),
    cardBeredar: t.Number(),
    aktif: t.Number(),
    nonAktif: t.Number(),
    total: t.Number(), // aktif + nonAktif
    cardBelumTerjual: t.Number(),
    cardInTransit: t.Number(),
    lost: t.Number(),
    damaged: t.Number(),
    other: t.Number(),
  });

  export const getStationInventoryMonitorResponse = t.Object({
    success: t.Boolean(),
    data: t.Array(t.Nullable(stationInventoryMonitorItem)),
  });

  export const stockConfigResponse = t.Object({
    success: t.Boolean(),
    data: t.Object({
      minStockThreshold: t.Number(),
      lowStockWarning: t.Number(),
    }),
  });

  export const errorResponse = t.Object({
    success: t.Boolean(),
    error: t.Object({
      message: t.String(),
      code: t.String(),
      statusCode: t.Number(),
    }),
  });
}
