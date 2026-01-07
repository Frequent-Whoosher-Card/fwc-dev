import { t } from "elysia";

export namespace StockOutModel {
  // Stock Out Request
  export const stockOutRequest = t.Object({
    movementAt: t.String({ format: "date-time" }),
    categoryId: t.String({ format: "uuid" }),
    typeId: t.String({ format: "uuid" }),
    stationId: t.String({ format: "uuid" }),

    // start and end serial numbers (e.g., FWC2500001)
    startSerial: t.String({ minLength: 1 }),
    endSerial: t.String({ minLength: 1 }),

    note: t.Optional(t.String({ maxLength: 500 })),
  });
  // Stock Out Response
  export const stockOutResponse = t.Object({
    success: t.Boolean(),
    message: t.String(),
    data: t.Object({
      movementId: t.String(),
      status: t.String(),
      sentCount: t.Number(),
    }),
  });

  // Stock Out Validate Request
  export const stockOutValidateRequest = t.Object({
    receivedSerialNumbers: t.Optional(
      t.Array(t.String({ minLength: 1 }), {
        minItems: 0,
        maxItems: 10000,
      })
    ),
    lostSerialNumbers: t.Optional(
      t.Array(t.String({ minLength: 1 }), {
        minItems: 0,
        maxItems: 10000,
      })
    ),
    damagedSerialNumbers: t.Optional(
      t.Array(t.String({ minLength: 1 }), {
        minItems: 0,
        maxItems: 10000,
      })
    ),
    note: t.Optional(t.String({ maxLength: 500 })),
  });

  // Stock Out Validate Response
  export const stockOutValidateResponse = t.Object({
    success: t.Boolean(),
    message: t.String(),
    data: t.Object({
      movementId: t.String(),
      status: t.String(),
      receivedCount: t.Integer(),
      lostCount: t.Integer(),
      damagedCount: t.Integer(),
    }),
  });

  // Query Params
  export const getHistoryQuery = t.Object({
    page: t.Optional(t.String()),
    limit: t.Optional(t.String()),
    startDate: t.Optional(t.String({ format: "date" })),
    endDate: t.Optional(t.String({ format: "date" })),
    stationId: t.Optional(t.String({ format: "uuid" })),
    status: t.Optional(t.String()),
    // New Search Params
    search: t.Optional(t.String()),
    stationName: t.Optional(t.String()),
    categoryName: t.Optional(t.String()),
    typeName: t.Optional(t.String()),
  });

  // History Response
  export const getHistoryResponse = t.Object({
    success: t.Boolean(),
    data: t.Object({
      items: t.Array(
        t.Object({
          id: t.String(),
          movementAt: t.String(),
          status: t.String(),
          quantity: t.Number(),
          stationName: t.Union([t.String(), t.Null()]),
          note: t.Union([t.String(), t.Null()]),
          createdByName: t.Union([t.String(), t.Null()]),
          cardCategory: t.Object({
            id: t.String(),
            name: t.String(),
          }),
          cardType: t.Object({
            id: t.String(),
            name: t.String(),
          }),
          sentSerialNumbers: t.Array(t.String()),
          receivedSerialNumbers: t.Array(t.String()),
          lostSerialNumbers: t.Array(t.String()),
          damagedSerialNumbers: t.Array(t.String()),
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

  // Detail Response
  export const getDetailResponse = t.Object({
    success: t.Boolean(),
    data: t.Object({
      movement: t.Object({
        id: t.String(),
        movementAt: t.String(),
        status: t.String(),
        quantity: t.Number(),
        note: t.Union([t.String(), t.Null()]),
        createdAt: t.String(),
        createdByName: t.Union([t.String(), t.Null()]),
        validatedAt: t.Union([t.String(), t.Null()]),
        validatedByName: t.Union([t.String(), t.Null()]),
        station: t.Union([
          t.Object({
            id: t.String(),
            name: t.String(),
            code: t.String(),
          }),
          t.Null(),
        ]),
        cardCategory: t.Object({
          id: t.String(),
          name: t.String(),
        }),
        cardType: t.Object({
          id: t.String(),
          name: t.String(),
        }),
        sentSerialNumbers: t.Array(t.String()),
        receivedSerialNumbers: t.Array(t.String()),
        lostSerialNumbers: t.Array(t.String()),
        damagedSerialNumbers: t.Array(t.String()),
      }),
    }),
  });

  // Update Body
  export const updateStockOutBody = t.Object({
    movementAt: t.Optional(t.String({ format: "date-time" })),
    stationId: t.Optional(t.String({ format: "uuid" })),
    note: t.Optional(t.String({ maxLength: 500 })),
    startSerial: t.Optional(t.String({ minLength: 1 })),
    endSerial: t.Optional(t.String({ minLength: 1 })),
  });

  // Update Response
  export const updateStockOutResponse = t.Object({
    success: t.Boolean(),
    message: t.String(),
    data: t.Object({
      id: t.String(),
      updatedAt: t.String(),
    }),
  });

  export const deleteStockOutResponse = t.Object({
    success: t.Boolean(),
    message: t.String(),
  });

  // Error Response
  export const errorResponse = t.Object({
    success: t.Boolean(),
    error: t.Object({
      message: t.String(),
      code: t.String(),
      statusCode: t.Number(),
    }),
  });
}
