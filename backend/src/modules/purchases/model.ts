<<<<<<< HEAD
import { t } from "elysia";

export namespace PurchaseModel {
  // --- Data Shape ---
  export const purchaseData = t.Object({
    id: t.String({ format: "uuid" }),
    cardId: t.String({ format: "uuid" }),
    memberId: t.Union([t.String({ format: "uuid" }), t.Null()]),
    operatorId: t.String({ format: "uuid" }),
    stationId: t.String({ format: "uuid" }),
    edcReferenceNumber: t.String(),
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
      cardProduct: t.Object({
        id: t.String({ format: "uuid" }),
        category: t.Object({
          id: t.String({ format: "uuid" }),
          categoryCode: t.String(),
          categoryName: t.String(),
        }),
        type: t.Object({
          id: t.String({ format: "uuid" }),
          typeCode: t.String(),
          typeName: t.String(),
        }),
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
      description: "Card ID to purchase. Card must exist and have status 'IN_STATION'.",
      examples: ["123e4567-e89b-12d3-a456-426614174000"],
    }),
    memberId: t.String({
        format: "uuid",
      description: "Member ID (required - every transaction must have a member)",
      examples: ["123e4567-e89b-12d3-a456-426614174001"],
    }),
    edcReferenceNumber: t.String({
      minLength: 1,
      maxLength: 100,
      description: "EDC Reference Number (No. Reference EDC). Must be unique across all purchases.",
      examples: ["EDC-20260102-001", "REF-123456"],
    }),
    price: t.Optional(
      t.Number({
        description: "Purchase price (default: from cardProduct.price, can be overridden for discounts/promos). Must be >= 0.",
        examples: [50000, 75000, 100000],
      minimum: 0,
      })
    ),
    notes: t.Optional(
      t.String({
        maxLength: 500,
        description: "Optional notes for this transaction",
        examples: ["Customer requested discount", "Promo special"],
      })
    ),
  });

  export const getPurchasesQuery = t.Object({
    page: t.Optional(
      t.String({
        description: "Page number for pagination (default: 1). Note: For petugas role, this filter applies to today's transactions only.",
        examples: ["1"],
      })
    ),
    limit: t.Optional(
      t.String({
        description: "Number of items per page (default: 10)",
        examples: ["10", "20", "50"],
      })
    ),
    startDate: t.Optional(
      t.String({
        format: "date",
        description: "Start date filter (YYYY-MM-DD). Note: Ignored for petugas role (always uses today). Only applies to admin/superadmin roles.",
        examples: ["2026-01-01"],
      })
    ),
    endDate: t.Optional(
      t.String({
        format: "date",
        description: "End date filter (YYYY-MM-DD). Note: Ignored for petugas role (always uses today). Only applies to admin/superadmin roles.",
        examples: ["2026-01-31"],
      })
    ),
    stationId: t.Optional(
      t.String({
        format: "uuid",
        description: "Filter by station ID. Note: Ignored for supervisor role (always uses supervisor's station). Only applies to admin/superadmin roles.",
        examples: ["123e4567-e89b-12d3-a456-426614174000"],
      })
    ),
    categoryId: t.Optional(
      t.String({
        format: "uuid",
        description: "Filter by card category ID",
        examples: ["123e4567-e89b-12d3-a456-426614174000"],
      })
    ),
    typeId: t.Optional(
      t.String({
        format: "uuid",
        description: "Filter by card type ID",
        examples: ["123e4567-e89b-12d3-a456-426614174000"],
      })
    ),
    operatorId: t.Optional(
      t.String({
        format: "uuid",
        description: "Filter by operator ID. Note: Ignored for petugas role (always uses petugas's own ID). Only applies to admin/superadmin roles.",
        examples: ["123e4567-e89b-12d3-a456-426614174000"],
      })
    ),
    search: t.Optional(
      t.String({
        description: "Search by EDC reference number, card serial number, customer name, identity number, or operator name (case-insensitive partial match)",
        examples: ["EDC123", "CARD001", "John Doe", "1234567890"],
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

=======
import { t } from "elysia";

export namespace PurchaseModel {
  // --- Data Shape ---
  export const purchaseData = t.Object({
    id: t.String({ format: "uuid" }),
    cardId: t.String({ format: "uuid" }),
    memberId: t.Union([t.String({ format: "uuid" }), t.Null()]),
    operatorId: t.String({ format: "uuid" }),
    stationId: t.String({ format: "uuid" }),
    edcReferenceNumber: t.String(),
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
      expiredDate: t.Union([t.String({ format: "date-time" }), t.Null()]),
      quotaTicket: t.Number(),
      cardProduct: t.Object({
        id: t.String({ format: "uuid" }),
        totalQuota: t.Number(),
        masaBerlaku: t.Number(),
        category: t.Object({
          id: t.String({ format: "uuid" }),
          categoryCode: t.String(),
          categoryName: t.String(),
        }),
        type: t.Object({
          id: t.String({ format: "uuid" }),
          typeCode: t.String(),
          typeName: t.String(),
        }),
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
      description: "Card ID to purchase. Card must exist and have status 'IN_STATION'.",
      examples: ["123e4567-e89b-12d3-a456-426614174000"],
    }),
    memberId: t.String({
        format: "uuid",
      description: "Member ID (required - every transaction must have a member)",
      examples: ["123e4567-e89b-12d3-a456-426614174001"],
    }),
    edcReferenceNumber: t.String({
      minLength: 1,
      maxLength: 100,
      description: "EDC Reference Number (No. Reference EDC). Must be unique across all purchases.",
      examples: ["EDC-20260102-001", "REF-123456"],
    }),
    price: t.Optional(
      t.Number({
        description: "Purchase price (default: from cardProduct.price, can be overridden for discounts/promos). Must be >= 0.",
        examples: [50000, 75000, 100000],
      minimum: 0,
      })
    ),
    notes: t.Optional(
      t.String({
        maxLength: 500,
        description: "Optional notes for this transaction",
        examples: ["Customer requested discount", "Promo special"],
      })
    ),
  });

  export const getPurchasesQuery = t.Object({
    page: t.Optional(
      t.String({
        description: "Page number for pagination (default: 1). Note: For petugas role, this filter applies to today's transactions only.",
        examples: ["1"],
      })
    ),
    limit: t.Optional(
      t.String({
        description: "Number of items per page (default: 10)",
        examples: ["10", "20", "50"],
      })
    ),
    startDate: t.Optional(
      t.String({
        format: "date",
        description: "Start date filter (YYYY-MM-DD). Note: Ignored for petugas role (always uses today). Only applies to admin/superadmin roles.",
        examples: ["2026-01-01"],
      })
    ),
    endDate: t.Optional(
      t.String({
        format: "date",
        description: "End date filter (YYYY-MM-DD). Note: Ignored for petugas role (always uses today). Only applies to admin/superadmin roles.",
        examples: ["2026-01-31"],
      })
    ),
    stationId: t.Optional(
      t.String({
        format: "uuid",
        description: "Filter by station ID. Note: Ignored for supervisor role (always uses supervisor's station). Only applies to admin/superadmin roles.",
        examples: ["123e4567-e89b-12d3-a456-426614174000"],
      })
    ),
    categoryId: t.Optional(
      t.String({
        format: "uuid",
        description: "Filter by card category ID",
        examples: ["123e4567-e89b-12d3-a456-426614174000"],
      })
    ),
    typeId: t.Optional(
      t.String({
        format: "uuid",
        description: "Filter by card type ID",
        examples: ["123e4567-e89b-12d3-a456-426614174000"],
      })
    ),
    operatorId: t.Optional(
      t.String({
        format: "uuid",
        description: "Filter by operator ID. Note: Ignored for petugas role (always uses petugas's own ID). Only applies to admin/superadmin roles.",
        examples: ["123e4567-e89b-12d3-a456-426614174000"],
      })
    ),
    search: t.Optional(
      t.String({
        description: "Search by EDC reference number, card serial number, customer name, identity number, or operator name (case-insensitive partial match)",
        examples: ["EDC123", "CARD001", "John Doe", "1234567890"],
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

>>>>>>> da9ad286010c29f3d8e17c72ef368bf0864559eb
