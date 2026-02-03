import { t } from "elysia";

export namespace LowStockModel {
  export const getLowStockQuery = t.Object({
    scope: t.Optional(
      t.Union([t.Literal("OFFICE"), t.Literal("STATION"), t.Literal("GLOBAL")]),
    ),
    programType: t.Optional(t.Union([t.Literal("FWC"), t.Literal("VOUCHER")])),
    stationId: t.Optional(t.String({ format: "uuid" })),
  });

  export const lowStockItem = t.Object({
    id: t.String(), // Unique key for frontend (e.g., stationId_productId)
    stationName: t.String(),
    categoryName: t.String(),
    typeName: t.String(),
    currentStock: t.Number(),
    minThreshold: t.Number(),
    programType: t.Union([t.Literal("FWC"), t.Literal("VOUCHER")]), // Enforce specific strings
    scope: t.String(), // OFFICE or STATION
  });

  export const getLowStockResponse = t.Object({
    success: t.Boolean(),
    message: t.String(),
    data: t.Array(lowStockItem),
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
