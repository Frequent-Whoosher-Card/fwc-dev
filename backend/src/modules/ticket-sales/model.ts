import { t } from "elysia";

export class TicketSalesModel {
  static importExcelBody = t.Object({
    file: t.File({
      type: [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ],
      maxSize: 50 * 1024 * 1024, // 50MB
    }),
  });

  static importResponse = t.Object({
    success: t.Boolean(),
    message: t.String(),
    data: t.Optional(
      t.Object({
        totalRows: t.Number(),
        filename: t.String(),
      }),
    ),
  });

  static statsResponse = t.Object({
    success: t.Boolean(),
    data: t.Optional(
      t.Object({
        totalTickets: t.Number(),
        totalRevenue: t.Number(),
        stationCount: t.Number(),
      }),
    ),
  });

  static errorResponse = t.Object({
    success: t.Boolean(),
    error: t.Object({
      message: t.String(),
      code: t.String(),
    }),
  });
}
