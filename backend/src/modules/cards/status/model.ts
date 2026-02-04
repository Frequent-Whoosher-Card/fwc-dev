import { t } from "elysia";

export namespace CardStatusModel {
  export const getCardStatusesResponse = t.Object({
    success: t.Boolean(),
    data: t.Array(t.String()),
  });

  export const errorResponse = t.Object({
    success: t.Boolean(),
    message: t.Optional(t.String()),
    error: t.Object({
      message: t.String(),
      code: t.String(),
      statusCode: t.Number(),
    }),
  });
}
