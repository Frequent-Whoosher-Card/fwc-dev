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

  // Revenue Data
  export const revenueData = t.Object({
    cardIssued: t.Number({
      description: "Total harga penjualan dari semua card yang sudah diterbitkan",
    }),
    quotaTicketIssued: t.Number({
      description: "Total harga penjualan dari quota ticket yang sudah diterbitkan",
    }),
    redeem: t.Number({
      description: "Total harga penjualan dari ticket yang sudah di-redeem/digunakan",
    }),
    expiredTicket: t.Number({
      description: "Total harga penjualan dari ticket yang sudah expired",
    }),
    remainingActiveTickets: t.Number({
      description: "Total harga penjualan dari sisa ticket yang masih aktif",
    }),
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
    revenue: revenueData,
  });

  // Get Metrics Response
  export const getMetricsResponse = t.Object({
    success: t.Boolean(),
    message: t.String(),
    data: metricsData,
  });

  // Metrics Summary Data
  export const metricsSummaryData = t.Object({
    cardIssued: t.Number({
      description: "Total jumlah kartu yang sudah diterbitkan",
    }),
    quotaTicketIssued: t.Number({
      description: "Total kuota ticket yang sudah diterbitkan",
    }),
    redeem: t.Number({
      description: "Jumlah ticket yang sudah di-redeem/digunakan",
    }),
    remainingActiveTickets: t.Number({
      description: "Sisa kuota ticket yang masih aktif dan bisa digunakan",
    }),
    expiredTicket: t.Number({
      description: "Jumlah ticket dari kartu yang sudah expired",
    }),
    redeemPercentage: t.Number({
      description:
        "Persentase ticket yang sudah di-redeem terhadap total quota ticket issued (rounded to 2 decimal places)",
    }),
    remainingActiveTicketsPercentage: t.Number({
      description:
        "Persentase sisa ticket aktif terhadap total quota ticket issued (rounded to 2 decimal places)",
    }),
    expiredTicketPercentage: t.Number({
      description:
        "Persentase ticket expired terhadap total quota ticket issued (rounded to 2 decimal places)",
    }),
  });

  // Get Metrics Summary Response
  export const getMetricsSummaryResponse = t.Object({
    success: t.Boolean(),
    message: t.String(),
    data: metricsSummaryData,
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
