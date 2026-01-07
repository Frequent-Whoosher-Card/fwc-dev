import { t } from "elysia";

export namespace RedeemModel {
  export const checkSerialParams = t.Object({
    serialNumber: t.String({
      description: "Serial number of the card to check",
      examples: ["01112600001"],
    }),
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
    }),
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
