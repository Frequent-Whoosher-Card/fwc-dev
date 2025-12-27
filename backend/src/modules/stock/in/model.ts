import { t } from "elysia";

export namespace StockInModel {
  // Stock In Request
  export const stockInRequest = t.Object({
    movementAt: t.String({
      format: "date-time",
      description: "Tanggal produksi / stok masuk (ISO date-time)",
    }),
    categoryId: t.String({
      format: "uuid",
      description: "Category ID",
    }),
    typeId: t.String({
      format: "uuid",
      description: "Type ID",
    }),
    quantity: t.Number({
      minimum: 1,
      description: "Jumlah stok masuk",
    }),
    note: t.Optional(
      t.String({
        description: "Catatan stok masuk",
      })
    ),
  });

  // Stock In Response
  export const stockInResponse = t.Object({
    success: t.Boolean(),
    message: t.String(),
    data: t.Object({
      movementId: t.String({
        format: "uuid",
        description: "Movement ID",
      }),
      quantity: t.Number({
        description: "Jumlah stok masuk",
      }),
      officeInventoryId: t.String({
        format: "uuid",
        description: "Office Inventory ID",
      }),
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
