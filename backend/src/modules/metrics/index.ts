import { Elysia } from "elysia";
import { authMiddleware } from "../../middleware/auth";
import { formatErrorResponse } from "../../utils/errors";
import { MetricsService } from "./service";
import { MetricsModel } from "./model";

const baseRoutes = new Elysia()
  // Get Metrics
  .get(
    "",
    async ({ query, set }) => {
      try {
        const { startDate, endDate } = query;

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

        const metrics = await MetricsService.getMetrics({
          startDate,
          endDate,
        });

        return {
          success: true,
          message: "Metrics retrieved successfully",
          data: metrics,
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
      query: MetricsModel.getMetricsQuery,
      response: {
        200: MetricsModel.getMetricsResponse,
        400: MetricsModel.errorResponse,
        401: MetricsModel.errorResponse,
        500: MetricsModel.errorResponse,
      },
      detail: {
        tags: ["Metrics"],
        summary: "Get all metrics",
        description:
          "Returns all metrics including: card issued, quota ticket issued, redeem, expired ticket, and remaining active tickets. Requires startDate and endDate parameters to filter by purchase date.",
      },
    }
  );

export const metrics = new Elysia({ prefix: "/metrics" })
  .use(authMiddleware)
  .use(baseRoutes);
