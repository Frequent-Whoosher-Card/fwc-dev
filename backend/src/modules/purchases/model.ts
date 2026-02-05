import { t } from "elysia";

export namespace PurchaseModel {
  // --- Bulk Purchase Item Data Shape ---
  export const bulkPurchaseItemData = t.Object({
    id: t.String({ format: "uuid" }),
    purchaseId: t.String({ format: "uuid" }),
    cardId: t.String({ format: "uuid" }),
    price: t.Number(),
    createdAt: t.String({ format: "date-time" }),
    updatedAt: t.String({ format: "date-time" }),
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
  });

  // --- Data Shape ---
  export const purchaseData = t.Object({
    id: t.String({ format: "uuid" }),
    cardId: t.Union([t.String({ format: "uuid" }), t.Null()]),
    memberId: t.Union([t.String({ format: "uuid" }), t.Null()]),
    employeeTypeId: t.Union([t.String({ format: "uuid" }), t.Null()]),
    operatorId: t.String({ format: "uuid" }),
    stationId: t.String({ format: "uuid" }),
    edcReferenceNumber: t.String(),
    purchaseDate: t.String({ format: "date-time" }),
    price: t.Number(),
    notes: t.Union([t.String(), t.Null()]),
    programType: t.Union([t.Literal("FWC"), t.Literal("VOUCHER"), t.Null()]),
    createdAt: t.String({ format: "date-time" }),
    updatedAt: t.String({ format: "date-time" }),
    createdByName: t.Union([t.String(), t.Null()]),
    updatedByName: t.Union([t.String(), t.Null()]),
    deletedAt: t.Optional(t.Union([t.String({ format: "date-time" }), t.Null()])),
    deletedByName: t.Optional(t.Union([t.String(), t.Null()])),
    // Relations
    card: t.Union([
      t.Object({
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
      t.Null(),
    ]),
    bulkPurchaseItems: t.Array(bulkPurchaseItemData),
    bulkPurchaseItemsCount: t.Optional(t.Number()), // Actual total count (for display when only 1 item is returned for preview)
    firstSerialNumber: t.Optional(t.Union([t.String(), t.Null()])), // First serial number for bulk purchase
    lastSerialNumber: t.Optional(t.Union([t.String(), t.Null()])), // Last serial number for bulk purchase
    member: t.Union([
      t.Object({
        id: t.String({ format: "uuid" }),
        name: t.String(),
        identityNumber: t.String(),
        companyName: t.Union([t.String(), t.Null()]),
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
    employeeType: t.Union([
      t.Object({
        id: t.String({ format: "uuid" }),
        code: t.String(),
        name: t.String(),
      }),
      t.Null(),
    ]),
  });

  // --- Requests ---
  export const createPurchaseBody = t.Object({
    cardId: t.Optional(
      t.String({
        format: "uuid",
        description:
          "Card ID to purchase (required for FWC, must be null for VOUCHER bulk purchase). Card must exist and have status 'IN_STATION'.",
        examples: ["123e4567-e89b-12d3-a456-426614174000"],
      }),
    ),
    cards: t.Optional(
      t.Array(
        t.Object({
          cardId: t.String({
            format: "uuid",
            description: "Card ID to purchase in bulk",
            examples: ["123e4567-e89b-12d3-a456-426614174000"],
          }),
          price: t.Optional(
            t.Number({
              description: "Price for this specific card (default: from cardProduct.price)",
              examples: [50000, 75000],
              minimum: 0,
            }),
          ),
        }),
        {
          description:
            "Array of cards for bulk purchase (required for VOUCHER, must be empty for FWC). Minimum 1 card for bulk purchase.",
          minItems: 1,
        },
      ),
    ),
    memberId: t.String({
      format: "uuid",
      description:
        "Member ID (required - every transaction must have a member)",
      examples: ["123e4567-e89b-12d3-a456-426614174001"],
    }),
    edcReferenceNumber: t.String({
      minLength: 1,
      maxLength: 12,
      pattern: "^[0-9]{1,12}$",
      description:
        "EDC Reference Number (No. Reference EDC). Hanya angka, maksimal 12 digit, dan harus unik.",
      examples: ["123456789012", "123456"],
    }),
    programType: t.Optional(
      t.Union([
        t.Literal("FWC"),
        t.Literal("VOUCHER"),
      ], {
        description:
          "Program type: FWC (single card purchase) or VOUCHER (bulk purchase). If not provided, defaults to FWC.",
        examples: ["FWC", "VOUCHER"],
      }),
    ),
    bulkDiscountId: t.Optional(
      t.Number({
        description: "Bulk discount ID (optional, for bulk purchases)",
        examples: [1, 2],
        minimum: 1,
      }),
    ),
    price: t.Optional(
      t.Number({
        description:
          "Total purchase price (for FWC: single card price, for VOUCHER: total of all cards after discount). Default: calculated from cardProduct.price or sum of cards. Can be overridden for discounts/promos. Must be >= 0.",
        examples: [50000, 75000, 100000, 225000],
        minimum: 0,
      }),
    ),
    notes: t.Optional(
      t.String({
        maxLength: 500,
        description: "Optional notes for this transaction",
        examples: ["Customer requested discount", "Promo special", "Bulk purchase 5 vouchers"],
      }),
    ),
  });

  export const updatePurchaseBody = t.Object({
    memberId: t.Optional(
      t.String({
        format: "uuid",
        description: "Update member ID",
        examples: ["123e4567-e89b-12d3-a456-426614174001"],
      }),
    ),
    operatorId: t.Optional(
      t.String({
        format: "uuid",
        description: "Update operator ID",
        examples: ["123e4567-e89b-12d3-a456-426614174002"],
      }),
    ),
    stationId: t.Optional(
      t.String({
        format: "uuid",
        description: "Update station ID",
        examples: ["123e4567-e89b-12d3-a456-426614174003"],
      }),
    ),
    edcReferenceNumber: t.Optional(
      t.String({
        minLength: 1,
        maxLength: 12,
        pattern: "^[0-9]{1,12}$",
        description: "Update EDC Reference Number (hanya angka, maksimal 12 digit)",
        examples: ["123456789012"],
      }),
    ),
    price: t.Optional(
      t.Number({
        description: "Update price",
        examples: [50000, 75000],
        minimum: 0,
      }),
    ),
    notes: t.Optional(
      t.String({
        maxLength: 500,
        description: "Update notes",
        examples: ["Updated notes"],
      }),
    ),
    shiftDate: t.Optional(
      t.String({
        format: "date-time",
        description: "Update shift date",
        examples: ["2026-01-21T00:00:00.000Z"],
      }),
    ),
  });

  export const getPurchasesQuery = t.Object({
    page: t.Optional(
      t.String({
        description:
          "Page number for pagination (default: 1). Note: For petugas role, this filter applies to today's transactions only.",
        examples: ["1"],
      }),
    ),
    limit: t.Optional(
      t.String({
        description: "Number of items per page (default: 10)",
        examples: ["10", "20", "50"],
      }),
    ),
    startDate: t.Optional(
      t.String({
        description:
          "Start date filter (YYYY-MM-DD). Note: Ignored for petugas role (always uses today). Only applies to admin/superadmin roles.",
        examples: ["2026-01-01"],
      }),
    ),
    endDate: t.Optional(
      t.String({
        description:
          "End date filter (YYYY-MM-DD). Note: Ignored for petugas role (always uses today). Only applies to admin/superadmin roles.",
        examples: ["2026-01-31"],
      }),
    ),
    stationId: t.Optional(
      t.String({
        description:
          "Filter by station ID. Supervisor can use this to filter by station or omit to see all stations. Only applies to admin/superadmin when not restricted by role.",
        examples: ["123e4567-e89b-12d3-a456-426614174000"],
      }),
    ),
    categoryId: t.Optional(
      t.String({
        description: "Filter by card category ID",
        examples: ["123e4567-e89b-12d3-a456-426614174000"],
      }),
    ),
    typeId: t.Optional(
      t.String({
        description: "Filter by card type ID",
        examples: ["123e4567-e89b-12d3-a456-426614174000"],
      }),
    ),
    operatorId: t.Optional(
      t.String({
        description:
          "Filter by operator ID. Note: Ignored for petugas role (always uses petugas's own ID). Only applies to admin/superadmin roles.",
        examples: ["123e4567-e89b-12d3-a456-426614174000"],
      }),
    ),
    search: t.Optional(
      t.String({
        description:
          "Search by EDC reference number, card serial number, customer name, identity number, or operator name (case-insensitive partial match)",
        examples: ["EDC123", "CARD001", "John Doe", "1234567890"],
      }),
    ),
    transactionType: t.Optional(
      t.Union([t.Literal("fwc"), t.Literal("voucher")], {
        description:
          "Filter by transaction type: 'fwc' for FWC purchases (single card), 'voucher' for VOUCHER bulk purchases",
        examples: ["fwc", "voucher"],
      }),
    ),
    employeeTypeId: t.Optional(
      t.String({
        format: "uuid",
        description: "Filter by employee type UUID (tipe karyawan)",
        examples: ["123e4567-e89b-12d3-a456-426614174000"],
      }),
    ),
    isDeleted: t.Optional(
      t.Union([t.Literal("true"), t.Literal("false")], {
        description: "When 'true', return only soft-deleted purchases (riwayat penghapusan)",
      }),
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

  export const updatePurchaseResponse = t.Object({
    success: t.Boolean(),
    message: t.String(),
    data: purchaseData,
  });

  export const correctCardMismatchBody = t.Object({
    wrongCardId: t.String({
      format: "uuid",
      description: "Card ID that was mistakenly given to customer",
      examples: ["123e4567-e89b-12d3-a456-426614174001"],
    }),
    correctCardId: t.String({
      format: "uuid",
      description: "Card ID that should have been given to customer",
      examples: ["123e4567-e89b-12d3-a456-426614174002"],
    }),
    notes: t.Optional(
      t.String({
        maxLength: 500,
        description: "Explanation for the card correction",
        examples: ["Petugas salah kasih kartu"],
      }),
    ),
  });

  export const correctCardMismatchResponse = t.Object({
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

  export const getBulkPurchaseItemsResponse = t.Object({
    success: t.Boolean(),
    data: t.Object({
      items: t.Array(bulkPurchaseItemData),
      pagination: t.Object({
        total: t.Number(),
        page: t.Number(),
        limit: t.Number(),
        totalPages: t.Number(),
      }),
    }),
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
