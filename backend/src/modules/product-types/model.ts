import { t } from "elysia";

export const ProductTypeModel = {
  productTypeResponse: t.Object({
    id: t.String({ format: "uuid" }),
    programId: t.String(),
    description: t.Optional(t.String()),
    abbreviation: t.Optional(t.String()),
    programType: t.Union([t.Literal("FWC"), t.Literal("VOUCHER")]),
    createdAt: t.String({ format: "date-time" }),
  }),
};
