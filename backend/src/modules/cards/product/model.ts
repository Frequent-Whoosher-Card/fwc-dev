import { t } from "elysia";

export namespace CardProductModel {
  // Get Card Products Response
  export const getCardProductsResponse = t.Object({
    success: t.Boolean(),
    message: t.String(),
    data: t.Array(
      t.Object({
        id: t.String(),
        categoryId: t.String(),
        typeId: t.String(),
        totalQuota: t.Number(),
        masaBerlaku: t.Number(),
        price: t.String(),
        serialTemplate: t.String(),
        isActive: t.Boolean(),
        createdAt: t.Nullable(t.Date()),
        createdBy: t.Nullable(t.String()),
        updatedAt: t.Nullable(t.Date()),
        updatedBy: t.Nullable(t.String()),
        deletedAt: t.Nullable(t.Date()),
        deletedBy: t.Nullable(t.String()),
        category: t.Object({
          id: t.String(),
          categoryName: t.String(),
        }),
        type: t.Object({
          id: t.String(),
          typeName: t.String(),
        }),
      })
    ),
  });

  // Get Card Product by ID Response
  export const getCardProductByIdResponse = t.Object({
    success: t.Boolean(),
    message: t.String(),
    data: t.Object({
      id: t.String(),
      categoryId: t.String(),
      typeId: t.String(),
      totalQuota: t.Number(),
      masaBerlaku: t.Number(),
      price: t.String(),
      serialTemplate: t.String(),
      isActive: t.Boolean(),
      createdAt: t.Nullable(t.Date()),
      createdBy: t.Nullable(t.String()),
      updatedAt: t.Nullable(t.Date()),
      updatedBy: t.Nullable(t.String()),
      deletedAt: t.Nullable(t.Date()),
      deletedBy: t.Nullable(t.String()),
    }),
  });

  // Create Card Product Request
  export const createCardProductRequest = t.Object({
    categoryId: t.String({
      format: "uuid",
      description: "Category ID",
    }),
    typeId: t.String({
      format: "uuid",
      description: "Type ID",
    }),
    totalQuota: t.Number({
      description: "Total quota",
    }),
    masaBerlaku: t.Number({
      description: "Masa berlaku",
    }),
    price: t.Number({
      description: "Harga",
    }),
    serialTemplate: t.String({
      description: "Template serial untuk produk ini",
    }),
  });

  // Create Card Product Response
  export const createCardProductResponse = t.Object({
    success: t.Boolean(),
    message: t.String(),
    data: t.Object({
      id: t.String(),
      categoryId: t.String(),
      typeId: t.String(),
      totalQuota: t.Number(),
      masaBerlaku: t.Number(),
      price: t.String(),
      serialTemplate: t.String(),
      isActive: t.Boolean(),
      createdAt: t.Nullable(t.Date()),
      createdBy: t.Nullable(t.String()),
      updatedAt: t.Nullable(t.Date()),
      updatedBy: t.Nullable(t.String()),
      deletedAt: t.Nullable(t.Date()),
      deletedBy: t.Nullable(t.String()),
    }),
  });

  // Update Card Product Request
  export const updateCardProductRequest = t.Object({
    categoryId: t.String({
      format: "uuid",
      description: "Category ID",
    }),
    typeId: t.String({
      format: "uuid",
      description: "Type ID",
    }),
    totalQuota: t.Number({
      description: "Total quota",
    }),
    masaBerlaku: t.Number({
      description: "Masa berlaku",
    }),
    price: t.Number({
      description: "Harga",
    }),
    serialTemplate: t.String({
      description: "Template serial untuk produk ini",
    }),
  });

  // Update Card Product Response
  export const updateCardProductResponse = t.Object({
    success: t.Boolean(),
    message: t.String(),
    data: t.Object({
      id: t.String(),
      categoryId: t.String(),
      typeId: t.String(),
      totalQuota: t.Number(),
      masaBerlaku: t.Number(),
      price: t.String(),
      serialTemplate: t.String(),
      isActive: t.Boolean(),
      createdAt: t.Nullable(t.Date()),
      createdBy: t.Nullable(t.String()),
      updatedAt: t.Nullable(t.Date()),
      updatedBy: t.Nullable(t.String()),
      deletedAt: t.Nullable(t.Date()),
      deletedBy: t.Nullable(t.String()),
    }),
  });

  // Delete Card Product Response
  export const deleteCardProductResponse = t.Object({
    success: t.Boolean(),
    message: t.String(),
    data: t.Object({
      id: t.String(),
      categoryId: t.String(),
      typeId: t.String(),
      totalQuota: t.Number(),
      masaBerlaku: t.Number(),
      price: t.String(),
      isActive: t.Boolean(),
      createdAt: t.Nullable(t.Date()),
      createdBy: t.Nullable(t.String()),
      updatedAt: t.Nullable(t.Date()),
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
}
