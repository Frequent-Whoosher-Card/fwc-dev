import { t } from "elysia";

export namespace InboxModel {
  export const inboxSchema = t.Object({
    id: t.String({ format: "uuid" }),
    title: t.String(),
    message: t.String(),
    isRead: t.Boolean(),
    readAt: t.Union([t.String({ format: "date-time" }), t.Null()]),
    sentAt: t.String({ format: "date-time" }),
    sender: t.Object({
      id: t.String(),
      fullName: t.String(),
    }),
    type: t.Union([t.String(), t.Null()]),
    payload: t.Any(), // simplified for now
  });

  export const getInboxQuery = t.Object({
    page: t.Optional(t.String()),
    limit: t.Optional(t.String()),
    isRead: t.Optional(t.BooleanString()),
  });

  export const getInboxResponse = t.Object({
    success: t.Boolean(),
    data: t.Object({
      items: t.Array(inboxSchema),
      pagination: t.Object({
        total: t.Number(),
        page: t.Number(),
        limit: t.Number(),
        totalPages: t.Number(),
        unreadCount: t.Number(),
      }),
    }),
  });

  export const markReadResponse = t.Object({
    success: t.Boolean(),
    message: t.String(),
  });

  export const lowStockResponse = t.Object({
    success: t.Boolean(),
    message: t.String(),
    data: t.Object({
      alertsSent: t.Number(),
      stationsChecked: t.Number(),
    }),
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
