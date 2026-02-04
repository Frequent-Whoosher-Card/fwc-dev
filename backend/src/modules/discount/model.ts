import { t } from "elysia";

export namespace BulkDiscountModel {
  export const createBulkDiscountBody = t.Object({
    minQuantity: t.Numeric({ minimum: 1 }),
    maxQuantity: t.Optional(t.Numeric({ minimum: 1 })),
    discount: t.Numeric({ minimum: 0 }),
    roleAccess: t.Optional(t.Array(t.String())), // Role Filter
    isActive: t.Optional(t.Boolean()),
  });

  export const updateBulkDiscountBody = t.Object({
    minQuantity: t.Optional(t.Numeric({ minimum: 1 })),
    maxQuantity: t.Optional(t.Numeric({ minimum: 1 })),
    discount: t.Optional(t.Numeric({ minimum: 0 })),
    roleAccess: t.Optional(t.Array(t.String())),
    isActive: t.Optional(t.Boolean()),
  });

  export const bulkDiscountResponse = t.Object({
    id: t.Number(),
    minQuantity: t.Union([t.Number(), t.Null()]),
    maxQuantity: t.Union([t.Number(), t.Null()]),
    discount: t.Union([t.String(), t.Number(), t.Null()]),
    roleAccess: t.Array(t.String()),
    isActive: t.Union([t.Boolean(), t.Null()]),
  });

  export const listBulkDiscountQuery = t.Object({
    search: t.Optional(t.String()),
    role: t.Optional(t.String()), // Allow filtering by role
  });

  export const listBulkDiscountResponse = t.Object({
    success: t.Boolean(),
    data: t.Array(bulkDiscountResponse),
  });

  export const singleBulkDiscountResponse = t.Object({
    success: t.Boolean(),
    data: bulkDiscountResponse,
  });

  export const deleteBulkDiscountResponse = t.Object({
    success: t.Boolean(),
    message: t.String(),
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
