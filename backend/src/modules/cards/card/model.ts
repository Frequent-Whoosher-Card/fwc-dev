import { t } from "elysia";

export namespace CardModel {
  // Card Data Shape
  export const cardData = t.Object({
    id: t.String({ format: "uuid" }),
    serialNumber: t.String(),
    status: t.String(),
    cardProductId: t.String({ format: "uuid" }),
    quotaTicket: t.Number(),
    purchaseDate: t.Union([t.String({ format: "date-time" }), t.Null()]),
    expiredDate: t.Union([t.String({ format: "date-time" }), t.Null()]),
    createdAt: t.String({ format: "date-time" }),
    cardProduct: t.Object({
      id: t.String({ format: "uuid" }),
      category: t.Object({
        id: t.String({ format: "uuid" }),
        categoryName: t.String(),
      }),
      type: t.Object({
        id: t.String({ format: "uuid" }),
        typeName: t.String(),
      }),
    }),
    fileObject: t.Union([
      t.Object({
        id: t.String({ format: "uuid" }),
        originalName: t.String(),
        relativePath: t.String(),
        mimeType: t.String(),
      }),
      t.Null(),
    ]),
    station: t.Union([
      t.Object({
        id: t.String({ format: "uuid" }),
        stationName: t.String(),
        stationCode: t.String(),
      }),
      t.Null(),
    ]),
    previousStation: t.Union([
      t.Object({
        id: t.String({ format: "uuid" }),
        stationName: t.String(),
        stationCode: t.String(),
      }),
      t.Null(),
    ]),
    notes: t.Union([t.String(), t.Null()]),
  });

  // Get Cards Query
  export const getCardsQuery = t.Object({
    cardProductId: t.Optional(
      t.String({
        format: "uuid",
        description:
          "Filter by card product ID. Returns only cards belonging to the specified card product.",
      }),
    ),
    status: t.Optional(
      t.String({
        description:
          "Filter by card status. Accepts both raw Enum (e.g., IN_OFFICE) and friendly names (e.g., Office, Stasiun, Hilang)",
      }),
    ),
    search: t.Optional(
      t.String({
        description:
          "Search by serial number (case-insensitive partial match). Useful for finding cards by serial number.",
      }),
    ),
    categoryId: t.Optional(t.String({ format: "uuid" })),
    typeId: t.Optional(t.String({ format: "uuid" })),
    stationId: t.Optional(t.String({ format: "uuid" })),
    categoryName: t.Optional(t.String()),
    typeName: t.Optional(t.String()),
    stationName: t.Optional(t.String()),
    page: t.Optional(
      t.String({
        description: "Page number for pagination (default: 1). Minimum: 1",
      }),
    ),
    limit: t.Optional(
      t.String({
        description: "Number of items per page (default: 50). Maximum: 100",
      }),
    ),
    programType: t.Optional(
      t.Union([t.Literal("FWC"), t.Literal("VOUCHER")], {
        description: "Filter by program type (FWC or VOUCHER)",
      }),
    ),
  });

  // Get First Available Card Query
  export const getFirstAvailableCardQuery = t.Object({
    cardProductId: t.String({ format: "uuid" }),
    status: t.Optional(
      t.String({
        description:
          "Card status to search for (default: IN_STATION). Valid values: IN_OFFICE, IN_STATION, etc.",
      }),
    ),
  });

  // Get Cards Response
  export const getCardsResponse = t.Object({
    success: t.Boolean(),
    message: t.String(),
    data: t.Object({
      items: t.Array(cardData),
      pagination: t.Object({
        total: t.Number(),
        page: t.Number(),
        limit: t.Number(),
        totalPages: t.Number(),
      }),
    }),
  });

  // Get Card By ID Response
  export const getCardByIdResponse = t.Object({
    success: t.Boolean(),
    message: t.String(),
    data: t.Object({
      id: t.String({ format: "uuid" }),
      serialNumber: t.String(),
      status: t.String(),
      cardProductId: t.String({ format: "uuid" }),
      quotaTicket: t.Number(),
      purchaseDate: t.Union([t.String({ format: "date-time" }), t.Null()]),
      expiredDate: t.Union([t.String({ format: "date-time" }), t.Null()]),
      createdAt: t.String({ format: "date-time" }),
      updatedAt: t.String({ format: "date-time" }),
      cardProduct: t.Object({
        id: t.String({ format: "uuid" }),
        price: t.Number({ description: "Card product price" }),
        category: t.Object({
          id: t.String({ format: "uuid" }),
          categoryName: t.String(),
        }),
        type: t.Object({
          id: t.String({ format: "uuid" }),
          typeName: t.String(),
        }),
      }),
      member: t.Union([
        t.Object({
          id: t.String({ format: "uuid" }),
          name: t.String(),
          identityNumber: t.String(),
        }),
        t.Null(),
      ]),
      fileObject: t.Union([
        t.Object({
          id: t.String({ format: "uuid" }),
          originalName: t.String(),
          relativePath: t.String(),
          mimeType: t.String(),
        }),
        t.Null(),
      ]),
      previousStation: t.Union([
        t.Object({
          id: t.String({ format: "uuid" }),
          stationName: t.String(),
          stationCode: t.String(),
        }),
        t.Null(),
      ]),
      station: t.Union([
        t.Object({
          id: t.String({ format: "uuid" }),
          stationName: t.String(),
          stationCode: t.String(),
        }),
        t.Null(),
      ]),
      notes: t.Union([t.String(), t.Null()]),
    }),
  });

  // Update Card Body
  export const updateCardBody = t.Object({
    status: t.Optional(
      t.String({
        description:
          "New status for the card (e.g., IN_OFFICE, IN_STATION, LOST, DAMAGED)",
      }),
    ),
    notes: t.Optional(t.String({ description: "Notes for the card" })),
  });

  // Update Card Response
  export const updateCardResponse = t.Object({
    success: t.Boolean(),
    message: t.String(),
    data: cardData,
  });

  // Get First Available Card Response
  export const getFirstAvailableCardResponse = t.Object({
    success: t.Boolean(),
    message: t.String(),
    data: t.Union([
      t.Object({
        id: t.String({ format: "uuid" }),
        serialNumber: t.String(),
        status: t.String(),
      }),
      t.Null(),
    ]),
  });

  // Batch By Serials Request Body
  export const batchBySerialsRequest = t.Object({
    serialNumbers: t.Array(
      t.String({
        description: "Array of serial numbers to fetch",
      }),
      { minItems: 1, maxItems: 10000 }
    ),
    categoryId: t.Optional(t.String({ format: "uuid" })),
    typeId: t.Optional(t.String({ format: "uuid" })),
    status: t.Optional(t.String()),
    stationId: t.Optional(t.String({ format: "uuid" })),
    programType: t.Optional(
      t.Union([t.Literal("FWC"), t.Literal("VOUCHER")])
    ),
  });

  // Batch By Serials Response
  export const batchBySerialsResponse = t.Object({
    success: t.Boolean(),
    message: t.String(),
    data: t.Object({
      items: t.Array(cardData),
      foundCount: t.Number(),
      requestedCount: t.Number(),
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
