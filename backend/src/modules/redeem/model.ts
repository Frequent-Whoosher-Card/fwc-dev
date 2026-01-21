import { t } from "elysia";

export namespace RedeemModel {
  export const checkSerialParams = t.Object({
    serialNumber: t.String({
      description: "Serial number of the card to check",
      examples: ["01112600001"],
    }),
    product: t.Optional(t.String({
      description: "Product type for redeem (FWC or VOUCHER)",
      examples: ["FWC", "VOUCHER"],
    })),
  });

  export const checkSerialResponse = t.Object({
    success: t.Boolean(),
    message: t.String(),
    data: t.Object({
      nik: t.String(),
      customerName: t.String(),
      cardCategory: t.String(),
      cardType: t.String(),
      serialNumber: t.String(),
      quotaRemaining: t.Number(),
      statusActive: t.String(),
      purchaseDate: t.Union([t.String(), t.Null()]),
      expiredDate: t.Union([t.String(), t.Null()]),
      route: t.Union([
        t.Object({
          origin: t.String(),
          destination: t.String(),
        }),
        t.Null(),
      ]),
      cardProduct: t.Optional(
        t.Object({
          totalQuota: t.Optional(t.Number()),
        })
      ),
    }),
  });

  export const redeemRequest = t.Object({
    serialNumber: t.String({
      description: "Serial number of the card to redeem",
      examples: ["01112600001"],
    }),
    redeemType: t.Union([
      t.Literal("SINGLE"),
      t.Literal("ROUNDTRIP"),
    ], {
      description: "Type of redemption: SINGLE (1 quota) or ROUNDTRIP (2 quota)",
    }),
    product: t.String({
      description: "Product type for redeem (FWC or VOUCHER)",
      examples: ["FWC", "VOUCHER"],
    }),
    notes: t.Optional(
      t.String({
        description: "Optional notes for the redemption",
        examples: ["Priority customer"],
      })
    ),
  });

  export const getRedeemsQuery = t.Object({
    page: t.Optional(t.String()),
    limit: t.Optional(t.String()),
    startDate: t.Optional(t.String({ format: "date" })),
    endDate: t.Optional(t.String({ format: "date" })),
    stationId: t.Optional(t.String()),
    search: t.Optional(t.String()),
    category: t.Optional(t.String()),
    cardType: t.Optional(t.String()),
    redeemType: t.Optional(t.String()),
    product: t.Optional(t.String()),
  });

  const redeemData = t.Object({
    id: t.String({ format: "uuid" }),
    transactionNumber: t.String(),
    cardId: t.String({ format: "uuid" }),
    operatorId: t.String({ format: "uuid" }),
    stationId: t.String({ format: "uuid" }),
    shiftDate: t.String({ format: "date-time" }),
    status: t.String(),
    redeemType: t.String(),
    quotaUsed: t.Number(),
    notes: t.Union([t.String(), t.Null()]),
    createdAt: t.String({ format: "date-time" }),
    updatedAt: t.String({ format: "date-time" }),
    station: t.Object({
      id: t.String({ format: "uuid" }),
      stationName: t.String(),
    }),
    operator: t.Object({
      id: t.String({ format: "uuid" }),
      fullName: t.String(),
    }),
    card: t.Object({
      id: t.String({ format: "uuid" }),
      serialNumber: t.String(),
      quotaTicket: t.Number(),
      member: t.Union([
        t.Object({
          id: t.String({ format: "uuid" }),
          name: t.String(),
          identityNumber: t.String(),
        }),
        t.Null(),
      ]),
      cardProduct: t.Object({
        category: t.Object({ categoryName: t.String() }),
        type: t.Object({ typeName: t.String() }),
      }),
    }),
  });

  export const getRedeemsResponse = t.Object({
    success: t.Boolean(),
    message: t.String(),
    data: t.Object({
      items: t.Array(redeemData),
      pagination: t.Object({
        total: t.Number(),
        page: t.Number(),
        limit: t.Number(),
        totalPages: t.Number(),
      }),
    }),
  });

  export const getRedeemByIdResponse = t.Object({
    success: t.Boolean(),
    message: t.String(),
    data: redeemData,
  });

  export const updateRedeemBody = t.Object({
    notes: t.Optional(t.String()),
  });

  export const updateRedeemResponse = t.Object({
    success: t.Boolean(),
    message: t.String(),
    data: redeemData,
  });

  // Upload last redeem documentation (image base64)
  export const lastDocBody = t.Object({
    imageBase64: t.String({
      description: "Base64-encoded image (JPEG/PNG)",
    }),
    mimeType: t.Optional(t.String({
      description: "Optional mimeType override (image/jpeg or image/png)",
    })),
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
