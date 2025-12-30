import { t } from "elysia";

export namespace StationModel {
  // --- Data Shape ---
  export const stationData = t.Object({
    id: t.String({ format: "uuid" }),
    stationCode: t.String(),
    stationName: t.String(),
    location: t.Union([t.String(), t.Null()]),
    createdAt: t.String({ format: "date-time" }),
    updatedAt: t.String({ format: "date-time" }),
    createdByName: t.Union([t.String(), t.Null()]),
    updatedByName: t.Union([t.String(), t.Null()]),
  });

  // --- Requests ---
  export const createStationBody = t.Object({
    stationCode: t.String({ minLength: 1, maxLength: 50 }),
    stationName: t.String({ minLength: 1, maxLength: 100 }),
    location: t.Optional(t.String({ maxLength: 255 })),
  });

  export const updateStationBody = t.Object({
    stationCode: t.Optional(t.String({ minLength: 1, maxLength: 50 })),
    stationName: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
    location: t.Optional(t.String({ maxLength: 255 })),
  });

  export const getStationsQuery = t.Object({
    page: t.Optional(t.String()),
    limit: t.Optional(t.String()),
    search: t.Optional(t.String({ description: "Search by code or name" })),
  });

  // --- Responses ---
  export const genericResponse = t.Object({
    success: t.Boolean(),
    message: t.String(),
  });

  export const createStationResponse = t.Object({
    success: t.Boolean(),
    message: t.String(),
    data: stationData,
  });

  export const getListStationResponse = t.Object({
    success: t.Boolean(),
    data: t.Object({
      items: t.Array(stationData),
      pagination: t.Object({
        total: t.Number(),
        page: t.Number(),
        limit: t.Number(),
        totalPages: t.Number(),
      }),
    }),
  });

  export const getDetailStationResponse = t.Object({
    success: t.Boolean(),
    data: stationData,
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
