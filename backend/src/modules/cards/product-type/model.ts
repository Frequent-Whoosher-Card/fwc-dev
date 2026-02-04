import { t } from "elysia";

export namespace ProductTypeModel {
  const ProductTypeSchema = t.Object({
    id: t.String(),
    programId: t.String({ description: "2 digit serial awal" }),
    description: t.Nullable(t.String()),
    abbreviation: t.Nullable(t.String()),
    programType: t.Nullable(
      t.Union([t.Literal("FWC"), t.Literal("VOUCHER")], {
        default: "FWC",
        description: "Tipe Program (FWC/VOUCHER)",
      }),
    ),
    createdAt: t.Date(),
    createdBy: t.Nullable(t.String()),
    updatedAt: t.Date(),
    updatedBy: t.Nullable(t.String()),
  });

  export const getProductTypesResponse = t.Object({
    success: t.Boolean(),
    data: t.Array(ProductTypeSchema),
  });

  export const getProductTypeByIdResponse = t.Object({
    success: t.Boolean(),
    data: t.Nullable(ProductTypeSchema),
  });

  export const createProductTypeRequest = t.Object({
    programId: t.String({ description: "2 digit serial awal" }),
    description: t.Optional(t.String()),
    abbreviation: t.Optional(t.String()),
    programType: t.Optional(
      t.Union([t.Literal("FWC"), t.Literal("VOUCHER")], {
        default: "FWC",
      }),
    ),
  });

  export const createProductTypeResponse = t.Object({
    success: t.Boolean(),
    message: t.String(),
    data: ProductTypeSchema,
  });

  export const editProductTypeRequest = t.Object({
    programId: t.String({ description: "2 digit serial awal" }),
    description: t.Optional(t.String()),
    abbreviation: t.Optional(t.String()),
    programType: t.Optional(
      t.Union([t.Literal("FWC"), t.Literal("VOUCHER")], {
        default: "FWC",
      }),
    ),
  });

  export const editProductTypeResponse = t.Object({
    success: t.Boolean(),
    message: t.String(),
    data: ProductTypeSchema,
  });

  export const deleteProductTypeResponse = t.Object({
    success: t.Boolean(),
    message: t.String(),
    data: ProductTypeSchema,
  });

  export const errorResponse = t.Object({
    success: t.Boolean(),
    message: t.Optional(t.String()),
    error: t.Object({
      message: t.String(),
      code: t.String(),
      statusCode: t.Number(),
    }),
  });
}
