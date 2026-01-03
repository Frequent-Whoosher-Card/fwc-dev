import { t } from "elysia";

export namespace PurchaseModel {
  // --- Data Shape ---
  export const purchaseData = t.Object({
    id: t.String({ format: "uuid" }),
    cardId: t.String({ format: "uuid" }),
    memberId: t.Union([t.String({ format: "uuid" }), t.Null()]),
    operatorId: t.String({ format: "uuid" }),
    stationId: t.String({ format: "uuid" }),
    transactionNumber: t.String(),
    purchaseDate: t.String({ format: "date-time" }),
    price: t.Number(),
    notes: t.Union([t.String(), t.Null()]),
    createdAt: t.String({ format: "date-time" }),
    updatedAt: t.String({ format: "date-time" }),
    createdByName: t.Union([t.String(), t.Null()]),
    updatedByName: t.Union([t.String(), t.Null()]),
    // Relations
    card: t.Object({
      id: t.String({ format: "uuid" }),
      serialNumber: t.String(),
      status: t.String(),
    }),
    member: t.Union([
      t.Object({
        id: t.String({ format: "uuid" }),
        name: t.String(),
        identityNumber: t.String(),
      }),
      t.Null(),
    ]),
    operator: t.Object({
      id: t.String({ format: "uuid" }),
      fullName: t.String(),
      username: t.String(),
    }),
    station: t.Object({
      id: t.String({ format: "uuid" }),
      stationCode: t.String(),
      stationName: t.String(),
    }),
  });

  // --- Requests ---
  export const createPurchaseBody = t.Object({
    cardId: t.String({
      format: "uuid",
      description: "Card ID to purchase",
    }),
    memberId: t.Optional(
      t.String({
        format: "uuid",
        description: "Member ID (optional)",
      })
    ),
    price: t.Number({
      description: "Purchase price",
      minimum: 0,
    }),
    notes: t.Optional(
      t.String({
        maxLength: 500,
        description: "Optional notes",
      })
    ),
  });

  export const getPurchasesQuery = t.Object({
    page: t.Optional(t.String()),
    limit: t.Optional(t.String()),
    startDate: t.Optional(
      t.String({
        format: "date",
        description: "Start date filter (YYYY-MM-DD)",
      })
    ),
    endDate: t.Optional(
      t.String({
        format: "date",
        description: "End date filter (YYYY-MM-DD)",
      })
    ),
    stationId: t.Optional(
      t.String({
        format: "uuid",
        description: "Filter by station ID",
      })
    ),
    operatorId: t.Optional(
      t.String({
        format: "uuid",
        description: "Filter by operator ID",
      })
    ),
    search: t.Optional(
      t.String({
        description: "Search by transaction number, card serial number, customer name, identity number, or operator name",
      })
    ),
  });

  // --- Responses ---
  export const genericResponse = t.Object({
    success: t.Boolean(),
    message: t.String(),
  });

  export const createPurchaseResponse = t.Object({
    success: t.Boolean(),
    message: t.String(),
    data: purchaseData,
  });

  export const getListPurchaseResponse = t.Object({
    success: t.Boolean(),
    data: t.Object({
      items: t.Array(purchaseData),
      pagination: t.Object({
        total: t.Number(),
        page: t.Number(),
        limit: t.Number(),
        totalPages: t.Number(),
      }),
    }),
    message: t.Optional(t.String()),
  });

  export const getDetailPurchaseResponse = t.Object({
    success: t.Boolean(),
    data: purchaseData,
    message: t.Optional(t.String()),
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

