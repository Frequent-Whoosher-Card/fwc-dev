import { t } from "elysia";

export namespace TransferModel {
  // Request Body
  export const createTransferBody = t.Object({
    stationId: t.String({ format: "uuid" }),
    toStationId: t.String({ format: "uuid" }),
    categoryId: t.String({ format: "uuid" }),
    typeId: t.String({ format: "uuid" }),
    quantity: t.Number({ minimum: 1 }),
    note: t.Optional(t.String()),
  });

  // Query Params
  export const getTransfersQuery = t.Object({
    stationId: t.Optional(t.String({ format: "uuid" })),
    status: t.Optional(t.String()),
  });

  // Path Params
  export const transferParams = t.Object({
    id: t.String({ format: "uuid" }),
  });

  // Data Shape for Transfer (reuse this in responses)
  const transferData = t.Object({
    id: t.String({ format: "uuid" }),
    movementAt: t.String({ format: "date-time" }),
    type: t.String(),
    status: t.String(),
    quantity: t.Number(),
    note: t.Union([t.String(), t.Null()]),
    station: t.Optional(
      t.Union([
        t.Object({
          stationName: t.String(),
        }),
        t.Null(),
      ])
    ),
    toStation: t.Optional(
      t.Union([
        t.Object({
          stationName: t.String(),
        }),
        t.Null(),
      ])
    ),
    category: t.Object({
      id: t.String({ format: "uuid" }),
      categoryName: t.String(),
    }),
    cardType: t.Object({
      id: t.String({ format: "uuid" }),
      typeName: t.String(),
    }),
  });

  // Responses
  export const createTransferResponse = t.Object({
    success: t.Boolean(),
    message: t.String(),
    data: t.Any(), // Simplification as create returns movement object, ideally use transferData
  });

  export const getTransfersResponse = t.Object({
    success: t.Boolean(),
    message: t.String(),
    data: t.Array(transferData),
  });

  export const getTransferByIdResponse = t.Object({
    success: t.Boolean(),
    message: t.String(),
    data: transferData,
  });

  export const receiveTransferResponse = t.Object({
    success: t.Boolean(),
    message: t.String(),
    data: t.Any(),
  });

  // Error Response
  export const errorResponse = t.Object({
    success: t.Boolean(),
    error: t.Object({
      message: t.String(),
      code: t.String(),
      statusCode: t.Number(),
      details: t.Optional(t.Any()),
    }),
  });
}
