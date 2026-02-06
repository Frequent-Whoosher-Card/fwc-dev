import { t } from "elysia";

export namespace StockInVoucherModel {
  export const createStockInVoucherBody = t.Object({
    cardProductId: t.String(),
    startSerial: t.String({ minLength: 5, maxLength: 5 }), // Suffix only (e.g., "00001")
    endSerial: t.String({ minLength: 5, maxLength: 5 }), // Suffix only (e.g., "00005")
    movementAt: t.String(), // ISO Date Date
    serialDate: t.Optional(t.String()), // Date string YYYY-MM-DD for serial reconstruction
    note: t.Optional(t.String()),
    vendorName: t.Optional(t.String()),
    vcrSettle: t.Optional(t.String()),
    vcrSettleFileId: t.Optional(t.String({ format: "uuid" })),
    vcrSettleFile: t.Optional(t.File()),
    costs: t.Optional(t.String()),
  });

  export const updateStockInBody = t.Object({
    movementAt: t.Optional(t.String()),
    note: t.Optional(t.String()),
    vendorName: t.Optional(t.String()),
    vcrSettle: t.Optional(t.String()),
    vcrSettleFileId: t.Optional(t.String({ format: "uuid" })),
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
    startDate: t.Optional(t.String({ format: "date" })),
    endDate: t.Optional(t.String({ format: "date" })),
    categoryId: t.Optional(t.String()),
    typeId: t.Optional(t.String()),
    stationId: t.Optional(t.String()),
    categoryName: t.Optional(t.String()),
    typeName: t.Optional(t.String()),
    stationName: t.Optional(t.String()),
    search: t.Optional(t.String()),
  });

  export const getHistoryResponse = t.Object({
    success: t.Boolean(),
    data: t.Object({
      items: t.Array(
        t.Object({
          id: t.String(),
          movementAt: t.String(),
          quantity: t.Number(),
          status: t.String(),
          batchId: t.Union([t.String(), t.Null()]),
          note: t.Union([t.String(), t.Null()]),
          vendorName: t.Union([t.String(), t.Null()]),
          vcrSettle: t.Union([t.String(), t.Null()]),
          vcrSettleFileId: t.Union([t.String(), t.Null()]),
          costs: t.Union([t.String(), t.Null()]),
          createdByName: t.Union([t.String(), t.Null(), t.Undefined()]),
          cardCategory: t.Object({
            id: t.String(),
            name: t.String(),
            code: t.String(),
            programType: t.Nullable(
              t.Union([t.Literal("FWC"), t.Literal("VOUCHER")]),
            ),
          }),
          cardType: t.Object({
            id: t.String(),
            name: t.String(),
            code: t.String(),
          }),
          product: t.Object({
            id: t.String(),
            name: t.String(),
          }),
          sentSerialNumbers: t.Array(t.String()),
        }),
      ),
      pagination: t.Object({
        total: t.Number(),
        page: t.Number(),
        limit: t.Number(),
        totalPages: t.Number(),
      }),
    }),
  });

  export const stockInVoucherResponse = t.Object({
    success: t.Boolean(),
    message: t.String(),
    data: t.Object({
      movementId: t.String(),
      cardProductId: t.String(),
      quantityRequested: t.Number(),
      processedCount: t.Number(),
      skippedCount: t.Number(),
      startSerial: t.String(),
      endSerial: t.String(),
      serialDate: t.String(),
    }),
  });

  export const getDetailResponse = t.Object({
    success: t.Boolean(),
    data: t.Object({
      movement: t.Object({
        id: t.String(),
        movementAt: t.String(),
        movementType: t.String(),
        quantity: t.Number(),
        status: t.String(),
        batchId: t.Union([t.String(), t.Null()]),
        note: t.Union([t.String(), t.Null()]),
        vendorName: t.Union([t.String(), t.Null()]),
        vcrSettle: t.Union([t.String(), t.Null()]),
        vcrSettleFileId: t.Union([t.String(), t.Null()]),
        costs: t.Union([t.String(), t.Null()]),
        vcrSettleFile: t.Optional(
          t.Nullable(
            t.Object({
              id: t.String(),
              originalName: t.String(),
              relativePath: t.String(),
            }),
          ),
        ),
        createdAt: t.String(),
        createdByName: t.Union([t.String(), t.Null(), t.Undefined()]),
        cardCategory: t.Object({
          id: t.String(),
          name: t.String(),
          code: t.String(),
          programType: t.Nullable(
            t.Union([t.Literal("FWC"), t.Literal("VOUCHER")]),
          ),
        }),
        cardType: t.Object({
          id: t.String(),
          name: t.String(),
          code: t.String(),
        }),
        product: t.Object({
          id: t.String(),
          name: t.String(),
        }),
        sentSerialNumbers: t.Array(t.String()),
        receivedSerialNumbers: t.Array(t.String()),
        items: t.Array(
          t.Object({
            serialNumber: t.String(),
            status: t.String(),
          }),
        ),
      }),
    }),
  });

  // Update Response
  export const updateStockInResponse = t.Object({
    success: t.Boolean(),
    message: t.String(),
    data: t.Optional(
      t.Object({
        id: t.String(),
        updatedAt: t.String(),
      }),
    ),
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
