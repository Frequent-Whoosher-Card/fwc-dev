import { Elysia, t } from "elysia";
import { authMiddleware } from "../../middleware/auth";
import { formatErrorResponse } from "../../utils/errors";
import { SalesService } from "./service";
import { SalesModel } from "./model";

const baseRoutes = new Elysia()
  // Get Daily Sales Grouped (for dashboard table)
  .get(
    "/daily-grouped",
    async (context) => {
      const { query, set } = context;

      try {
        const { startDate, endDate, stationId } = query;

        // Validate dates
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          set.status = 400;
          return formatErrorResponse(
            new Error("Invalid date format. Please use YYYY-MM-DD format")
          );
        }

        if (start > end) {
          set.status = 400;
          return formatErrorResponse(
            new Error("Start date must be before or equal to end date")
          );
        }

        const dailySales = await SalesService.getDailySalesAggregated({
          startDate,
          endDate,
          stationId,
        });

        return {
          success: true,
          message: "Daily sales data fetched successfully",
          data: dailySales,
        };
      } catch (error) {
        set.status =
          error instanceof Error && "statusCode" in error
            ? (error as any).statusCode
            : 500;
        return formatErrorResponse(error);
      }
    },
    {
      query: SalesModel.getDailySalesQuery,
      response: {
        200: SalesModel.getDailySalesResponse,
        400: SalesModel.errorResponse,
        401: SalesModel.errorResponse,
        403: SalesModel.errorResponse,
        500: SalesModel.errorResponse,
      },
      detail: {
        tags: ["Sales"],
        summary: "Get daily sales data grouped",
        description:
          "This endpoint returns daily card sales data (based on purchaseDate) grouped into 4 rows: range (1 to dayBeforeYesterday), yesterday, today, and totals. Data is aggregated by category (GOLD, SILVER, KAI) and type (JaBan, JaKa, KaBan). Counts cards sold, not transactions/redeem.",
      },
    }
  )
  // Get Daily Expired Sales Grouped (for dashboard table)
  .get(
    "/daily-grouped-expired",
    async (context) => {
      const { query, set } = context;

      try {
        const { startDate, endDate, stationId } = query;

        // Validate dates
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          set.status = 400;
          return formatErrorResponse(
            new Error("Invalid date format. Please use YYYY-MM-DD format")
          );
        }

        if (start > end) {
          set.status = 400;
          return formatErrorResponse(
            new Error("Start date must be before or equal to end date")
          );
        }

        const expiredDailySales = await SalesService.getExpiredDailySalesAggregated({
          startDate,
          endDate,
          stationId,
        });

        return {
          success: true,
          message: "Daily expired sales data fetched successfully",
          data: expiredDailySales,
        };
      } catch (error) {
        set.status =
          error instanceof Error && "statusCode" in error
            ? (error as any).statusCode
            : 500;
        return formatErrorResponse(error);
      }
    },
    {
      query: SalesModel.getExpiredDailySalesQuery,
      response: {
        200: SalesModel.getExpiredDailySalesResponse,
        400: SalesModel.errorResponse,
        401: SalesModel.errorResponse,
        403: SalesModel.errorResponse,
        500: SalesModel.errorResponse,
      },
      detail: {
        tags: ["Sales"],
        summary: "Get daily expired sales data grouped",
        description:
          "This endpoint returns daily expired card sales data (based on purchaseDate) grouped into 4 rows: range (1 to dayBeforeYesterday), yesterday, today, and totals. Data is aggregated by category (GOLD, SILVER, KAI) and type (JaBan, JaKa, KaBan). Includes expired count and expired price. Only includes cards that are already expired (expiredDate < now).",
      },
    }
  )
  // Get Daily Totals (simple format)
  .get(
    "/daily-totals",
    async (context) => {
      const { query, set } = context;

      try {
        const { startDate, endDate, stationId } = query;

        // Validate dates
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          set.status = 400;
          return formatErrorResponse(
            new Error("Invalid date format. Please use YYYY-MM-DD format")
          );
        }

        if (start > end) {
          set.status = 400;
          return formatErrorResponse(
            new Error("Start date must be before or equal to end date")
          );
        }

        const dailyTotals = await SalesService.getDailyTotals({
          startDate,
          endDate,
          stationId,
        });

        return {
          success: true,
          message: "Daily totals fetched successfully",
          data: dailyTotals,
        };
      } catch (error) {
        set.status =
          error instanceof Error && "statusCode" in error
            ? (error as any).statusCode
            : 500;
        return formatErrorResponse(error);
      }
    },
    {
      query: SalesModel.getDailyTotalsQuery,
      response: {
        200: SalesModel.getDailyTotalsResponse,
        400: SalesModel.errorResponse,
        401: SalesModel.errorResponse,
        403: SalesModel.errorResponse,
        500: SalesModel.errorResponse,
      },
      detail: {
        tags: ["Sales"],
        summary: "Get daily card sales totals per day",
        description:
          "This endpoint returns daily card sales totals in simple format: array of { date, total }. Data is based on purchaseDate. Optional stationId filter available.",
      },
    }
  )
  // Get Cards Summary
  .get(
    "/cards-summary",
    async (context) => {
      const { query, set } = context;

      try {
        const { startDate, endDate, stationId } = query;

        // Validate dates if provided
        if (startDate || endDate) {
          if (startDate) {
            const start = new Date(startDate);
            if (isNaN(start.getTime())) {
              set.status = 400;
              return formatErrorResponse(
                new Error("Invalid startDate format. Please use YYYY-MM-DD format")
              );
            }
          }

          if (endDate) {
            const end = new Date(endDate);
            if (isNaN(end.getTime())) {
              set.status = 400;
              return formatErrorResponse(
                new Error("Invalid endDate format. Please use YYYY-MM-DD format")
              );
            }
          }

          // Validate startDate <= endDate if both provided
          if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            if (start > end) {
              set.status = 400;
              return formatErrorResponse(
                new Error("Start date must be before or equal to end date")
              );
            }
          }
        }

        const cardsSummary = await SalesService.getCardsSummary({
          startDate,
          endDate,
          stationId,
        });

        return {
          success: true,
          message: "Cards summary data fetched successfully",
          data: cardsSummary,
        };
      } catch (error) {
        set.status =
          error instanceof Error && "statusCode" in error
            ? (error as any).statusCode
            : 500;
        return formatErrorResponse(error);
      }
    },
    {
      query: SalesModel.getCardsSummaryQuery,
      response: {
        200: SalesModel.getCardsSummaryResponse,
        400: SalesModel.errorResponse,
        401: SalesModel.errorResponse,
        403: SalesModel.errorResponse,
        500: SalesModel.errorResponse,
      },
      detail: {
        tags: ["Sales"],
        summary: "Get cards summary (count, quota issued, redeemed and unredeemed tickets)",
        description:
          "This endpoint returns summary of active cards including: total number of active cards, total quota ticket issued, redeemed tickets, and unredeemed tickets. Active cards are defined as: status SOLD_ACTIVE, not expired (expiredDate > now or null), and quotaTicket > 0. Optional filters: startDate, endDate (filter by purchaseDate), and stationId (filter by station).",
      },
    }
  )
  // Get Sales Per Station
  .get(
    "/per-station",
    async ({ query, set }) => {
      try {
        const { startDate, endDate } = query;

        // Validate dates if provided
        if (startDate && isNaN(new Date(startDate).getTime())) {
          set.status = 400;
          return formatErrorResponse(
            new Error("Invalid startDate format. Please use YYYY-MM-DD format")
          );
        }
        if (endDate && isNaN(new Date(endDate).getTime())) {
          set.status = 400;
          return formatErrorResponse(
            new Error("Invalid endDate format. Please use YYYY-MM-DD format")
          );
        }
        if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
          set.status = 400;
          return formatErrorResponse(
            new Error("Start date must be before or equal to end date")
          );
        }

        const salesPerStation = await SalesService.getSalesPerStation(
          startDate,
          endDate
        );

        return {
          success: true,
          message: "Sales per station data fetched successfully",
          data: salesPerStation,
        };
      } catch (error) {
        set.status =
          error instanceof Error && "statusCode" in error
            ? (error as any).statusCode
            : 500;
        return formatErrorResponse(error);
      }
    },
    {
      query: SalesModel.getSalesPerStationQuery,
      response: {
        200: SalesModel.getSalesPerStationResponse,
        400: SalesModel.errorResponse,
        401: SalesModel.errorResponse,
        500: SalesModel.errorResponse,
      },
      detail: {
        tags: ["Sales"],
        summary: "Get sales data per station",
        description:
          "Returns sales metrics grouped by station including: card issued, quota ticket issued, redeem, remaining active tickets, and expired tickets. Optional startDate and endDate parameters can be used to filter by purchase date.",
      },
    }
  );

export const sales = new Elysia({ prefix: "/sales" })
  .use(authMiddleware)
  .use(baseRoutes);

