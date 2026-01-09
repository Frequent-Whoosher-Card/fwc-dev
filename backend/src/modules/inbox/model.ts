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
      role: t.String(),
    }),
    recipient: t.Object({
      id: t.String(),
      fullName: t.String(),
    }),
    station: t.Union([
      t.Object({
        id: t.String(),
        stationName: t.String(),
      }),
      t.Null(),
    ]),
    type: t.Union([t.String(), t.Null()]),
    payload: t.Any(),
  });

  export const getInboxQuery = t.Object({
    page: t.Optional(t.String()),
    limit: t.Optional(t.String()),
    isRead: t.Optional(t.BooleanString()),
    startDate: t.Optional(t.String()),
    endDate: t.Optional(t.String()),
    type: t.Optional(t.String()),
  });

  export const getSupervisorInboxQuery = t.Object({
    page: t.Optional(t.String()),
    limit: t.Optional(t.String()),
    startDate: t.Optional(t.String()),
    endDate: t.Optional(t.String()),
    status: t.Optional(t.String()),
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

  export const getSupervisorInboxResponse = t.Object({
    success: t.Boolean(),
    data: t.Object({
      items: t.Array(
        t.Object({
          id: t.String(),
          title: t.String(),
          message: t.String(),
          sentAt: t.String({ format: "date-time" }),
          isRead: t.Boolean(),
          sender: t.Object({
            id: t.String(),
            fullName: t.String(),
            role: t.String(),
          }),
          recipient: t.Object({
            id: t.String(),
            fullName: t.String(),
          }),
          station: t.Union([
            t.Object({
              id: t.String(),
              stationName: t.String(),
            }),
            t.Null(),
          ]),
        })
      ),
      pagination: t.Object({
        total: t.Number(),
        page: t.Number(),
        limit: t.Number(),
        totalPages: t.Number(),
      }),
    }),
  });
  export const getInboxDetailResponse = t.Object({
    success: t.Boolean(),
    data: t.Object({
      id: t.String(),
      title: t.String(),
      message: t.String(),
      isRead: t.Boolean(),
      readAt: t.Union([t.String(), t.Null()]),
      sentAt: t.String(),
      type: t.Union([t.String(), t.Null()]),
      payload: t.Any(),
      sender: t.Object({
        id: t.String(),
        fullName: t.String(),
        role: t.Object({
          code: t.String(),
          name: t.String(),
        }),
      }),
      recipient: t.Object({
        id: t.String(),
        fullName: t.String(),
      }),
      station: t.Union([
        t.Object({
          id: t.String(),
          code: t.String(),
          name: t.String(),
        }),
        t.Null(),
      ]),
    }),
  });
}
