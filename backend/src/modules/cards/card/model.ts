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
  });

  // Get Cards Query
  export const getCardsQuery = t.Object({
    cardProductId: t.Optional(
      t.String({
        format: "uuid",
        description:
          "Filter by card product ID. Returns only cards belonging to the specified card product.",
      })
    ),
    status: t.Optional(
      t.String({
        description:
          "Filter by card status. Valid values: IN_OFFICE, IN_TRANSIT, IN_STATION, LOST, DAMAGED, SOLD_ACTIVE, SOLD_INACTIVE",
      })
    ),
    search: t.Optional(
      t.String({
        description:
          "Search by serial number (case-insensitive partial match). Useful for finding cards by serial number.",
      })
    ),
    page: t.Optional(
      t.String({
        description: "Page number for pagination (default: 1). Minimum: 1",
      })
    ),
    limit: t.Optional(
      t.String({
        description: "Number of items per page (default: 50). Maximum: 100",
      })
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
