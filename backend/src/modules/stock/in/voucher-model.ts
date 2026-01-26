import { t } from "elysia";

export namespace StockInVoucherModel {
  export const createStockInVoucherBody = t.Object({
    cardProductId: t.String(),
    startSerial: t.String({ minLength: 5, maxLength: 5 }), // Suffix only (e.g., "00001")
    endSerial: t.String({ minLength: 5, maxLength: 5 }), // Suffix only (e.g., "00005")
    movementAt: t.String(), // ISO Date Date
    serialDate: t.Optional(t.String()), // Date string YYYY-MM-DD for serial reconstruction
    note: t.Optional(t.String()),
  });

  export const updateStockInBody = t.Object({
    movementAt: t.Optional(t.String()),
    note: t.Optional(t.String()),
  });

  export const updateBatchStatusBody = t.Object({
    updates: t.Array(
      t.Object({
        serialNumber: t.String(),
        status: t.Union([
          t.Literal("IN_OFFICE"),
          t.Literal("DAMAGED"),
          t.Literal("LOST"),
        ]),
      }),
    ),
  });

  export const getAvailableSerialsQuery = t.Object({
    cardProductId: t.String(),
  });

  export const getHistoryQuery = t.Object({
    page: t.Optional(t.String()),
    limit: t.Optional(t.String()),
    startDate: t.Optional(t.String()),
    endDate: t.Optional(t.String()),
    categoryId: t.Optional(t.String()),
    typeId: t.Optional(t.String()),
    search: t.Optional(t.String()),
  });

  export const stockInVoucherResponse = t.Object({
    success: t.Boolean(),
    message: t.String(),
    data: t.Object({
      id: t.String(),
      movementAt: t.String(),
      quantity: t.Number(),
      status: t.String(),
      batchId: t.Union([t.String(), t.Null()]),
      note: t.Union([t.String(), t.Null()]),
      category: t.Object({
        id: t.String(),
        name: t.String(),
        programType: t.Union([t.String(), t.Null()]),
      }),
      type: t.Object({
        id: t.String(),
        name: t.String(),
      }),
      product: t.Object({
        id: t.String(),
        name: t.String(),
      }),
    }),
  });

  export const errorResponse = t.Object({
    success: t.Boolean(),
    message: t.String(),
  });
}
