import { t } from "elysia";

export namespace StockModel {
  // Add Stock Cards Batch Request
  export const addStocksBody = t.Object({
    categoryId: t.String({
      minLength: 3,
      maxLength: 100,
      description: "Category ID Card",
    }),
    typeId: t.String({
      minLength: 3,
      maxLength: 100,
      description: "Type ID Card",
    }),
    startSerialNumber: t.Integer({
      minimum: 1,
      description: "Start Serial Number",
    }),
    quantity: t.Integer({
      minimum: 1,
      description: "Quantity",
    }),
  });

  // Add Stock Cards Batch Response
  export const addStocksResponse = t.Object({
    success: t.Boolean(),
    data: t.Object({
      totalCardsAdded: t.Integer(),
    }),
    message: t.String(),
  });

  // Add Stock Quantity Request
  export const addStockQuantityBody = t.Object({
    categoryId: t.String({
      minLength: 3,
      maxLength: 100,
      format: "uuid",
      description: "Category ID Card",
    }),
    typeId: t.String({
      minLength: 3,
      maxLength: 100,
      format: "uuid",
      description: "Type ID Card",
    }),
    stationId: t.String({
      minLength: 3,
      maxLength: 100,
      format: "uuid",
      description: "Station ID Card",
    }),
    quantity: t.Integer({
      minimum: 1,
      description: "Quantity",
    }),
  });

  // Add Stock Quantity Response
  export const addStockQuantityResponse = t.Object({
    success: t.Boolean(),
    data: t.Object({
      totalCardsAdded: t.Integer(),
    }),
    message: t.String(),
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
