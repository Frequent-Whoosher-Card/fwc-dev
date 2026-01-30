import { t } from "elysia";

export namespace BulkDiscountModel {
  export const createBulkDiscountBody = t.Object({
    minQuantity: t.Numeric({ minimum: 1 }),
    maxQuantity: t.Optional(t.Numeric({ minimum: 1 })),
    discount: t.Numeric({ minimum: 0 }), // Decimal value or percentage depending on requirements. Assuming flat amount or percentage based on DB schema. Schema says Decimal(65,30).
    // Schema check: "discount" DECIMAL. Let's assume it's a value.
  });

  export const updateBulkDiscountBody = t.Object({
    minQuantity: t.Optional(t.Numeric({ minimum: 1 })),
    maxQuantity: t.Optional(t.Numeric({ minimum: 1 })),
    discount: t.Optional(t.Numeric({ minimum: 0 })),
  });

  export const bulkDiscountResponse = t.Object({
    id: t.Number(),
    minQuantity: t.Union([t.Number(), t.Null()]),
    maxQuantity: t.Union([t.Number(), t.Null()]),
    discount: t.Union([t.String(), t.Number(), t.Null()]), // Decimal returned as string or number depending on driver/prisma
  });

  export const listBulkDiscountQuery = t.Object({
    search: t.Optional(t.String()),
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
