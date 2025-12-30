import { t } from "elysia";

export namespace StockInModel {
  // Stock In Request
  export const stockInBatchBody = t.Object({
    movementAt: t.String({
      format: "date-time",
      description: "Tanggal produksi / stok masuk (ISO date-time)",
    }),

    categoryId: t.String({ format: "uuid" }),
    typeId: t.String({ format: "uuid" }),

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
      startSerial: t.Integer(),
      endSerial: t.Integer(),
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
          note: t.Union([t.String(), t.Null()]),
          createdByName: t.Union([t.String(), t.Null()]),
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
        movementType: t.String(),
        quantity: t.Number(),
        status: t.String(),
        note: t.Union([t.String(), t.Null()]),
        createdAt: t.String(),
        createdByName: t.Union([t.String(), t.Null()]),
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
      }),
    }),
  });

  // Update Body
  export const updateStockInBody = t.Object({
    movementAt: t.Optional(
      t.String({
        format: "date-time",
        description: "Tanggal produksi (ISO date-time)",
      })
    ),
    note: t.Optional(t.String({ maxLength: 500 })),
  });

  // Update Response
  export const updateStockInResponse = t.Object({
    success: t.Boolean(),
    message: t.String(),
    data: t.Object({
      id: t.String(),
      updatedAt: t.String(),
    }),
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
