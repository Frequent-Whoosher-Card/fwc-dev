import { t } from "elysia";

export namespace StockInFwcModel {
  // Stock In Request
  export const stockInBatchBody = t.Object({
    movementAt: t.String({
      format: "date-time",
      description: "Tanggal produksi / stok masuk (ISO date-time)",
    }),

    cardProductId: t.String({ format: "uuid" }),

    // contoh: "000123" atau "123"
    startSerial: t.String({
      pattern: "^[0-9]+$",
      description:
        "Nomor serial awal (digit). Leading zero akan dipertahankan.",
    }),

    // contoh: "000125" atau "125"
    endSerial: t.String({
      pattern: "^[0-9]+$",
      description:
        "Nomor serial akhir (digit). Harus lebih besar atau sama dengan startSerial.",
    }),

    note: t.Optional(t.String({ maxLength: 500 })),
  });

  // Stock In Response
  export const stockInBatchResponse = t.Object({
    success: t.Boolean(),
    message: t.String(),
    data: t.Object({
      movementId: t.String(),
      startSerial: t.String(),
      endSerial: t.String(),
      quantity: t.Integer(),
      // contoh serial full (template + suffix)
      startSerialNumber: t.String(),
      endSerialNumber: t.String(),
    }),
  });

  // Query Params
  export const getHistoryQuery = t.Object({
    page: t.Optional(t.String()),
    limit: t.Optional(t.String()),
    startDate: t.Optional(t.String({ format: "date" })),
    endDate: t.Optional(t.String({ format: "date" })),
    categoryId: t.Optional(t.String({ format: "uuid" })),
    typeId: t.Optional(t.String({ format: "uuid" })),
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
          movementType: t.String(),
          quantity: t.Number(),
          status: t.String(),
          batchId: t.Union([t.String(), t.Null()]),
          note: t.Union([t.String(), t.Null()]),
          createdByName: t.Union([t.String(), t.Null(), t.Undefined()]),
          cardCategory: t.Object({
            id: t.String(),
            name: t.String(),
            code: t.String(),
          }),
          cardType: t.Object({
            id: t.String(),
            name: t.String(),
            code: t.String(),
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

  // Detail Response
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
        createdAt: t.String(),
        createdByName: t.Union([t.String(), t.Null(), t.Undefined()]),
        cardCategory: t.Object({
          id: t.String(),
          name: t.String(),
          code: t.String(),
        }),
        cardType: t.Object({
          id: t.String(),
          name: t.String(),
          code: t.String(),
        }),
        sentSerialNumbers: t.Array(t.String()),
        items: t.Array(
          t.Object({
            serialNumber: t.String(),
            status: t.String(),
          }),
        ),
      }),
    }),
  });

  // Report Damaged Body
  export const reportDamagedBody = t.Object({
    serialNumbers: t.Array(t.String()),
    note: t.Optional(t.String({ maxLength: 500 })),
  });

  // Update Body
  export const updateStockInBody = t.Object({
    movementAt: t.Optional(
      t.String({
        format: "date-time",
        description: "Tanggal produksi (ISO date-time)",
      }),
    ),
    note: t.Optional(t.String({ maxLength: 500 })),
    startSerial: t.String({
      pattern: "^[0-9]+$",
      description: "Nomor serial awal (digit).",
    }),
    endSerial: t.String({
      pattern: "^[0-9]+$",
      description: "Nomor serial akhir (digit).",
    }),
  });

  // Update Batch Status Body
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

  // Error Response
  export const errorResponse = t.Object({
    success: t.Boolean(),
    error: t.Object({
      message: t.String(),
      code: t.String(),
      statusCode: t.Number(),
    }),
  });

  // Available Serials Query
  export const getAvailableSerialsQuery = t.Object({
    cardProductId: t.String({ format: "uuid" }),
  });

  // Available Serials Response
  export const getAvailableSerialsResponse = t.Object({
    success: t.Boolean(),
    data: t.Object({
      startSerial: t.Union([t.String(), t.Null()]),
      endSerial: t.Union([t.String(), t.Null()]),
      count: t.Number(),
    }),
  });
}
