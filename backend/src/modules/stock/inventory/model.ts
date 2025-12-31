import { t } from "elysia";

export namespace CardInventoryModel {
  export const getInventoryQuery = t.Object({
    page: t.Optional(t.String()),
    limit: t.Optional(t.String()),
    categoryId: t.Optional(t.String()),
    typeId: t.Optional(t.String()),
    stationId: t.Optional(t.String()),
    search: t.Optional(t.String()),
    categoryName: t.Optional(t.String()),
    typeName: t.Optional(t.String()),
    stationName: t.Optional(t.String()),
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
        })
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
      })
    ),
  });

  export const getTotalSummaryResponse = t.Object({
    success: t.Boolean(),
    data: t.Object({
      totalCards: t.Number(),
      totalLost: t.Number(),
      totalDamaged: t.Number(),
    }),
  });

  export const errorResponse = t.Object({
    success: t.Boolean(),
    message: t.String(),
    error: t.Optional(t.Any()),
  });
}
