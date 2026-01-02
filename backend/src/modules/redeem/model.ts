import { t } from "elysia";

export namespace RedeemModel {
  export const CheckSerialResponse = t.Object({
    status: t.Boolean(),
    message: t.String(),
    data: t.Object({
      nik: t.String(),
      customerName: t.String(),
      cardCategory: t.String(),
      cardType: t.String(),
      serialNumber: t.String(),
      quotaRemaining: t.Number(),
      statusActive: t.String(),
    }),
  });
}
