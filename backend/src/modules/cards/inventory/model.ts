import { t } from "elysia";

export const CardInventoryModel = {
  getInventoryQuery: t.Object({
    page: t.Optional(t.String()),
    limit: t.Optional(t.String()),
    categoryId: t.Optional(t.String()),
    typeId: t.Optional(t.String()),
    stationId: t.Optional(t.String()),
    search: t.Optional(t.String()),
  }),

  inventoryItem: t.Object({
    id: t.String(),
    categoryId: t.String(),
    typeId: t.String(),
    stationId: t.Union([t.String(), t.Null()]),
    cardBeredar: t.Number(),
    cardAktif: t.Number(),
    cardNonAktif: t.Number(),
    cardBelumTerjual: t.Number(),
    cardOffice: t.Union([t.Number(), t.Null()]),
    lastUpdated: t.String(),
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

  getInventoryListResponse: t.Object({
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
          lastUpdated: t.String(), // Prisma Date returns as ISO string in JSON
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
  }),

  getInventoryDetailResponse: t.Object({
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
      lastUpdated: t.String(),
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
  }),

  errorResponse: t.Object({
    success: t.Boolean(),
    message: t.String(),
    error: t.Optional(t.Any()),
  }),
};
