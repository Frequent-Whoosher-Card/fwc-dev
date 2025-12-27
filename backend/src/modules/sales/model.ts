import { t } from "elysia";

export namespace SalesModel {
  // Daily Sales Query Params
  export const getDailySalesQuery = t.Object({
    startDate: t.String({
      description: "Start date in ISO format (YYYY-MM-DD)",
      examples: ["2025-12-01"],
    }),
    endDate: t.String({
      description: "End date in ISO format (YYYY-MM-DD)",
      examples: ["2025-12-31"],
    }),
    stationId: t.Optional(
      t.String({
        description: "Station ID (UUID) - optional filter by station",
      })
    ),
  });

  // Daily Sales Row Data
  export const dailySalesRow = t.Object({
    tanggal: t.String({
      description: "Date or date range (e.g., '1-15 dec 2025' or '16 dec 2025')",
    }),
    gold: t.Object({
      jaBan: t.Number({
        description: "GOLD JaBan count",
      }),
      jaKa: t.Number({
        description: "GOLD JaKa count",
      }),
      kaBan: t.Number({
        description: "GOLD KaBan count",
      }),
    }),
    silver: t.Object({
      jaBan: t.Number({
        description: "SILVER JaBan count",
      }),
      jaKa: t.Number({
        description: "SILVER JaKa count",
      }),
      kaBan: t.Number({
        description: "SILVER KaBan count",
      }),
    }),
    kai: t.Number({
      description: "KAI count",
    }),
    total: t.Number({
      description: "Total count for this row",
    }),
  });

  // Daily Sales Response
  export const getDailySalesResponse = t.Object({
    success: t.Boolean(),
    message: t.String(),
    data: t.Object({
      rows: t.Array(dailySalesRow),
      totals: t.Object({
        tanggal: t.String({
          description: "Label for totals row (e.g., 'TOTAL')",
        }),
        gold: t.Object({
          jaBan: t.Number(),
          jaKa: t.Number(),
          kaBan: t.Number(),
        }),
        silver: t.Object({
          jaBan: t.Number(),
          jaKa: t.Number(),
          kaBan: t.Number(),
        }),
        kai: t.Number(),
        total: t.Number(),
      }),
    }),
  });

  // Daily Totals Query Params (reuse same structure as daily sales)
  export const getDailyTotalsQuery = getDailySalesQuery;

  // Daily Total Item
  export const dailyTotalItem = t.Object({
    date: t.String({
      description: "Date in ISO format (YYYY-MM-DD)",
      examples: ["2025-12-01"],
    }),
    total: t.Number({
      description: "Total number of cards sold on this date",
    }),
  });

  // Daily Totals Response
  export const getDailyTotalsResponse = t.Object({
    success: t.Boolean(),
    message: t.String(),
    data: t.Array(dailyTotalItem),
  });

  // Expired Daily Sales Query Params (reuse same structure as daily sales)
  export const getExpiredDailySalesQuery = getDailySalesQuery;

  // Expired Daily Sales Row Data (same as dailySalesRow but with expired fields)
  export const expiredDailySalesRow = t.Object({
    tanggal: t.String({
      description: "Date or date range (e.g., '1-15 dec 2025' or '16 dec 2025')",
    }),
    gold: t.Object({
      jaBan: t.Number({
        description: "GOLD JaBan count",
      }),
      jaKa: t.Number({
        description: "GOLD JaKa count",
      }),
      kaBan: t.Number({
        description: "GOLD KaBan count",
      }),
    }),
    silver: t.Object({
      jaBan: t.Number({
        description: "SILVER JaBan count",
      }),
      jaKa: t.Number({
        description: "SILVER JaKa count",
      }),
      kaBan: t.Number({
        description: "SILVER KaBan count",
      }),
    }),
    kai: t.Number({
      description: "KAI count",
    }),
    total: t.Number({
      description: "Total count for this row",
    }),
    expired: t.Number({
      description: "Total count of expired cards for this row",
    }),
    expiredPrice: t.Number({
      description: "Total price of expired cards for this row",
    }),
  });

  // Expired Daily Sales Response
  export const getExpiredDailySalesResponse = t.Object({
    success: t.Boolean(),
    message: t.String(),
    data: t.Object({
      rows: t.Array(expiredDailySalesRow),
      totals: t.Object({
        tanggal: t.String({
          description: "Label for totals row (e.g., 'TOTAL')",
        }),
        gold: t.Object({
          jaBan: t.Number(),
          jaKa: t.Number(),
          kaBan: t.Number(),
        }),
        silver: t.Object({
          jaBan: t.Number(),
          jaKa: t.Number(),
          kaBan: t.Number(),
        }),
        kai: t.Number(),
        total: t.Number(),
        expired: t.Number(),
        expiredPrice: t.Number(),
      }),
    }),
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

