import { t } from "elysia";

export namespace StockModel {
  export const getHistoryQuery = t.Object({
    page: t.Optional(t.String()),
    limit: t.Optional(t.String()),
    startDate: t.Optional(t.String()),
    endDate: t.Optional(t.String()),
    type: t.Optional(t.String()),
    status: t.Optional(t.String()),
    cardCategory: t.Optional(t.String()),
    cardCategoryId: t.Optional(t.String()),
    cardType: t.Optional(t.String()),
    cardTypeId: t.Optional(t.String()),
    station: t.Optional(t.String()),
    search: t.Optional(t.String()),
  });

  export const stockMovementItem = t.Object({
    id: t.String(),
    movementAt: t.String(),
    type: t.String(), // IN, OUT
    status: t.String(), // PENDING, APPROVED, REJECTED
    categoryId: t.String(),
    typeId: t.String(),
    quantity: t.Number(),
    note: t.Union([t.String(), t.Null()]),
    stationId: t.Union([t.String(), t.Null()]),
    // Serial info (summary)
    sentSerialNumbersCount: t.Number(),
    receivedSerialNumbersCount: t.Number(),
    lostSerialNumbersCount: t.Number(),

    createdAt: t.String(),
    createdBy: t.Union([t.String(), t.Null()]),

    category: t.Object({
      categoryName: t.String(),
      categoryCode: t.String(),
    }),
    cardType: t.Object({
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

  // Detail includes full arrays of serial numbers
  export const stockMovementDetail = t.Object({
    id: t.String(),
    movementAt: t.String(),
    type: t.String(),
    status: t.String(),
    categoryId: t.String(),
    typeId: t.String(),
    quantity: t.Number(),
    note: t.Union([t.String(), t.Null()]),
    stationId: t.Union([t.String(), t.Null()]),

    sentSerialNumbers: t.Array(t.String()),
    receivedSerialNumbers: t.Array(t.String()),
    lostSerialNumbers: t.Array(t.String()),

    validatedBy: t.Union([t.String(), t.Null()]),
    validatedAt: t.Union([t.String(), t.Null()]),

    createdAt: t.String(),

    category: t.Object({
      categoryName: t.String(),
      categoryCode: t.String(),
    }),
    cardType: t.Object({
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

  export const getHistoryResponse = t.Object({
    success: t.Boolean(),
    data: t.Object({
      movements: t.Array(
        t.Object({
          id: t.String(),
          movementAt: t.String(),
          type: t.String(),
          status: t.String(),
          categoryId: t.String(),
          typeId: t.String(),
          quantity: t.Number(),
          note: t.Union([t.String(), t.Null()]),
          stationId: t.Union([t.String(), t.Null()]),

          createdAt: t.String(),

          category: t.Object({
            categoryName: t.String(),
            categoryCode: t.String(),
          }),
          cardType: t.Object({
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

  export const getDetailResponse = t.Object({
    success: t.Boolean(),
    data: t.Any(), // Using Any for now to avoid deep nesting issues, or reuse stockMovementDetail if possible
  });

  export const errorResponse = t.Object({
    success: t.Boolean(),
    message: t.String(),
    error: t.Optional(t.Any()),
  });
}
