import { t } from "elysia";

export namespace CardGenerateModel {
  export const generateBody = t.Object({
    cardProductId: t.String({ format: "uuid" }), // Changed from categoryId/typeId
    // Removed strict regex pattern to allow alphanumeric full serials (validated by logic)
    startSerial: t.String(),
    endSerial: t.String(),
  });

  export const generateVoucherBody = t.Object({
    cardProductId: t.String({ format: "uuid" }),
    startSerial: t.String(),
    endSerial: t.String(),
  });

  export const generateVoucherResponse = t.Object({
    status: t.String(),
    message: t.String(),
    data: t.Object({
      message: t.String(),
      firstSerial: t.String(),
      lastSerial: t.String(),
      generatedFilesCount: t.Number(),
    }),
  });

  export const generateResponse = t.Object({
    status: t.String(),
    message: t.String(),
    data: t.Object({
      message: t.String(),
      firstSerial: t.String(),
      lastSerial: t.String(),
      generatedFilesCount: t.Number(),
    }),
  });

  // Error Response
  export const errorResponse = t.Object({
    success: t.Boolean(),
    message: t.Optional(t.String()),
    error: t.Object({
      message: t.String(),
      code: t.String(),
      statusCode: t.Number(),
    }),
  });

  // History Query Params
  export const getHistoryQuery = t.Object({
    page: t.Optional(t.String()),
    limit: t.Optional(t.String()),
    startDate: t.Optional(t.String({ format: "date" })),
    endDate: t.Optional(t.String({ format: "date" })),
    categoryId: t.Optional(t.String({ format: "uuid" })),
    typeId: t.Optional(t.String({ format: "uuid" })),
    programType: t.Optional(t.Union([t.Literal("FWC"), t.Literal("VOUCHER")])),
  });

  // History Response
  export const getHistoryResponse = t.Object({
    success: t.Boolean(),
    message: t.String(),
    data: t.Object({
      items: t.Array(
        t.Object({
          id: t.String(),
          movementAt: t.String(),
          quantity: t.Number(),
          status: t.String(),
          note: t.Union([t.String(), t.Null()]),
          createdByName: t.Union([t.String(), t.Null()]),
          programType: t.Union([t.String(), t.Null()]),
          category: t.Object({
            id: t.String(),
            name: t.String(),
          }),
          type: t.Object({
            id: t.String(),
            name: t.String(),
          }),
          serialNumbers: t.Array(t.String()),
          cards: t.Array(
            t.Object({
              id: t.String(),
              serialNumber: t.String(),
              status: t.String(),
              barcodeUrl: t.Union([t.String(), t.Null()]),
              createdAt: t.String(),
            }),
          ),
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
  export const getHistoryDetailResponse = t.Object({
    success: t.Boolean(),
    message: t.String(),
    data: t.Object({
      movement: t.Object({
        id: t.String(),
        movementAt: t.String(),
        quantity: t.Number(),
        status: t.String(),
        note: t.Union([t.String(), t.Null()]),
        createdByName: t.Union([t.String(), t.Null()]),
        programType: t.Union([t.String(), t.Null()]),
        category: t.Object({
          id: t.String(),
          name: t.String(),
        }),
        type: t.Object({
          id: t.String(),
          name: t.String(),
        }),
        serialNumbers: t.Array(t.String()),
      }),
      cards: t.Array(
        t.Object({
          id: t.String(),
          serialNumber: t.String(),
          status: t.String(),
          createdAt: t.String(),
          barcodeUrl: t.Union([t.String(), t.Null()]),
        }),
      ),
    }),
  });

  // Next Serial Query
  export const getNextSerialQuery = t.Object({
    cardProductId: t.String({ format: "uuid" }),
  });

  // Next Serial Response
  export const getNextSerialResponse = t.Object({
    success: t.Boolean(),
    data: t.Object({
      nextSerial: t.String(),
      prefix: t.String(),
      lastSerial: t.Union([t.String(), t.Null()]),
    }),
  });
}
