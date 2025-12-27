import { t } from "elysia";

export namespace MetricsModel {
  // Get Metrics Query Params
  export const getMetricsQuery = t.Object({
    startDate: t.Optional(
      t.String({
        description: "Start date in ISO format (YYYY-MM-DD) - filter by purchase date",
        examples: ["2025-01-01"],
      })
    ),
    endDate: t.Optional(
      t.String({
        description: "End date in ISO format (YYYY-MM-DD) - filter by purchase date",
        examples: ["2025-12-31"],
      })
    ),
  });

  // Metrics Data
  export const metricsData = t.Object({
    cardIssued: t.Number({
      description: "Total jumlah kartu yang sudah diterbitkan",
    }),
    quotaTicketIssued: t.Number({
      description: "Total kuota ticket yang sudah diterbitkan",
    }),
    redeem: t.Number({
      description: "Jumlah ticket yang sudah di-redeem/digunakan",
    }),
    expiredTicket: t.Number({
      description: "Jumlah ticket dari kartu yang sudah expired",
    }),
    remainingActiveTickets: t.Number({
      description: "Sisa kuota ticket yang masih aktif dan bisa digunakan",
    }),
  });

  // Get Metrics Response
  export const getMetricsResponse = t.Object({
    success: t.Boolean(),
    message: t.String(),
    data: metricsData,
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
