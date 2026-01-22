import { t } from "elysia";

export namespace CardTypeModel {
  // Get Card Types Response
  export const getCardTypesResponse = t.Object({
    success: t.Boolean(),
    data: t.Array(
      t.Object({
        id: t.String(),
        typeCode: t.String(),
        typeName: t.String(),
        routeDescription: t.Nullable(t.String()),
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

  // Get Card Type By Id Response
  export const getCardTypeByIdResponse = t.Object({
    success: t.Boolean(),
    data: t.Object({
      id: t.String(),
      typeCode: t.String(),
      typeName: t.String(),
      routeDescription: t.String(),
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

  //   Create Card Type Request
  export const createCardTypeRequest = t.Object({
    typeCode: t.String({
      description: "Kode tipe kartu",
    }),
    typeName: t.String({
      description: "Nama tipe kartu",
    }),
    routeDescription: t.String({
      description: "Deskripsi rute",
    }),
    programType: t.Optional(
      t.Union([t.Literal("FWC"), t.Literal("VOUCHER")], {
        default: "FWC",
        description: "Tipe Program (FWC/VOUCHER)",
      }),
    ),
  });

  // Create Card Type Response
  export const createCardTypeResponse = t.Object({
    success: t.Boolean(),
    message: t.String(),
    data: t.Object({
      id: t.String(),
      typeCode: t.String(),
      typeName: t.String(),
      routeDescription: t.String(),
      programType: t.Union([t.Literal("FWC"), t.Literal("VOUCHER")], {
        default: "FWC",
        description: "Tipe Program (FWC/VOUCHER)",
      }),
      createdAt: t.Date(),
      createdBy: t.Nullable(t.String()),
      updatedAt: t.Date(),
      updatedBy: t.Nullable(t.String()),
      deletedAt: t.Nullable(t.Date()),
      deletedBy: t.Nullable(t.String()),
    }),
  });

  // Edit Card Type Request
  export const editCardTypeRequest = t.Object({
    typeCode: t.String({
      description: "Kode tipe kartu",
    }),
    typeName: t.String({
      description: "Nama tipe kartu",
    }),
    routeDescription: t.String({
      description: "Deskripsi rute",
    }),
    programType: t.Union([t.Literal("FWC"), t.Literal("VOUCHER")], {
      default: "FWC",
      description: "Tipe Program (FWC/VOUCHER)",
    }),
  });

  // Edit Card Type Response
  export const editCardTypeResponse = t.Object({
    success: t.Boolean(),
    message: t.String(),
    data: t.Object({
      id: t.String(),
      typeCode: t.String(),
      typeName: t.String(),
      routeDescription: t.String(),
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

  // Delete Card Type Response
  export const deleteCardTypeResponse = t.Object({
    success: t.Boolean(),
    message: t.String(),
    data: t.Object({
      id: t.String(),
      typeCode: t.String(),
      typeName: t.String(),
      routeDescription: t.String(),
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
