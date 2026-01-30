import { t } from "elysia";

export namespace CardCategoryModel {
  // Get Card Categories Response
  export const getCardCategoriesResponse = t.Object({
    success: t.Boolean(),
    data: t.Array(
      t.Object({
        id: t.String(),
        categoryCode: t.String(),
        categoryName: t.String(),
        description: t.Nullable(t.String()),
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
        deletedAt: t.Nullable(t.Date()),
        deletedBy: t.Nullable(t.String()),
      }),
    ),
  });

  // Get spesific card category response
  export const getCardCategoryByIdResponse = t.Object({
    success: t.Boolean(),
    data: t.Nullable(
      t.Object({
        id: t.String(),
        categoryCode: t.String(),
        categoryName: t.String(),
        description: t.Nullable(t.String()),
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
        deletedAt: t.Nullable(t.Date()),
        deletedBy: t.Nullable(t.String()),
      }),
    ),
  });

  //   Create Card Category Request
  export const createCardCategoryRequest = t.Object({
    categoryCode: t.String({
      description: "Kode kategori kartu",
    }),
    categoryName: t.String({
      description: "Nama kategori kartu",
    }),
    description: t.String({
      description: "Deskripsi kategori kartu",
    }),
    programType: t.Union([t.Literal("FWC"), t.Literal("VOUCHER")], {
      default: "FWC",
      description: "Tipe Program (FWC/VOUCHER)",
    }),
  });

  // Create Card Category Response
  export const createCardCategoryResponse = t.Object({
    success: t.Boolean(),
    message: t.String(),
    data: t.Object({
      id: t.String(),
      categoryCode: t.String(),
      categoryName: t.String(),
      description: t.Nullable(t.String()),
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
      deletedAt: t.Nullable(t.Date()),
      deletedBy: t.Nullable(t.String()),
    }),
  });

  // Edit Card Category Request
  export const editCardCategoryRequest = t.Object({
    categoryCode: t.String({
      description: "Kode kategori kartu",
    }),
    categoryName: t.String({
      description: "Nama kategori kartu",
    }),
    description: t.String({
      description: "Deskripsi kategori kartu",
    }),
    programType: t.Union([t.Literal("FWC"), t.Literal("VOUCHER")], {
      default: "FWC",
      description: "Tipe Program (FWC/VOUCHER)",
    }),
  });

  // Edit Card Category Response
  export const editCardCategoryResponse = t.Object({
    success: t.Boolean(),
    message: t.String(),
    data: t.Object({
      id: t.String(),
      categoryCode: t.String(),
      categoryName: t.String(),
      description: t.Nullable(t.String()),
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
      deletedAt: t.Nullable(t.Date()),
      deletedBy: t.Nullable(t.String()),
    }),
  });

  // Delete Card Category Response
  export const deleteCardCategoryResponse = t.Object({
    success: t.Boolean(),
    message: t.String(),
    data: t.Object({
      id: t.String(),
      categoryCode: t.String(),
      categoryName: t.String(),
      description: t.Nullable(t.String()),
      createdAt: t.Date(),
      createdBy: t.Nullable(t.String()),
      updatedAt: t.Date(),
      updatedBy: t.Nullable(t.String()),
      deletedAt: t.Nullable(t.Date()),
      deletedBy: t.Nullable(t.String()),
    }),
  });

  // Error Response
  export const errorResponse = t.Object({
    success: t.Boolean(),
    message: t.Optional(t.String()),
    error: t.Object({
      message: t.String(),
      code: t.String(),
      statusCode: t.Number(),
    }),
  });

  // Get Recommended Code Response
  export const getRecommendedCodeResponse = t.Object({
    success: t.Boolean(),
    data: t.Object({
      recommendedCode: t.String(),
    }),
  });
}
