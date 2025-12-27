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
        summary: "Get daily sales data grouped for dashboard table",
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
        summary: "Get daily expired sales data grouped for dashboard table",
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
  );

export const sales = new Elysia({ prefix: "/sales" })
  .use(authMiddleware)
  .use(baseRoutes);

