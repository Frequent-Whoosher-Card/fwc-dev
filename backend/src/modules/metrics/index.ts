import { Elysia } from "elysia";
import { rbacMiddleware } from "../../middleware/rbac";
import { formatErrorResponse } from "../../utils/errors";
import { MetricsService } from "./service";
import { MetricsModel } from "./model";

// Metrics routes - admin and superadmin only (analytics data)
const baseRoutes = new Elysia()
  .use(rbacMiddleware(["admin", "superadmin"]))
  // Get Metrics
  .get(
    "",
    async ({ query, set }) => {
      try {
        const { startDate, endDate } = query;

        // Validate dates if provided
        if (startDate && isNaN(new Date(startDate).getTime())) {
          set.status = 400;
          return formatErrorResponse(
            new Error("Invalid startDate format. Please use YYYY-MM-DD.")
          );
        }
        if (endDate && isNaN(new Date(endDate).getTime())) {
          set.status = 400;
          return formatErrorResponse(
            new Error("Invalid endDate format. Please use YYYY-MM-DD.")
          );
        }
        if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
          set.status = 400;
          return formatErrorResponse(
            new Error("Start date cannot be after end date.")
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
  )
  // Get Metrics Summary
  .get(
    "/summary",
    async ({ query, set }) => {
      try {
        const { startDate, endDate } = query;

        // Validate dates if provided
        if (startDate && isNaN(new Date(startDate).getTime())) {
          set.status = 400;
          return formatErrorResponse(
            new Error("Invalid startDate format. Please use YYYY-MM-DD.")
          );
        }
        if (endDate && isNaN(new Date(endDate).getTime())) {
          set.status = 400;
          return formatErrorResponse(
            new Error("Invalid endDate format. Please use YYYY-MM-DD.")
          );
        }
        if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
          set.status = 400;
          return formatErrorResponse(
            new Error("Start date cannot be after end date.")
          );
        }

        const summary = await MetricsService.getMetricsSummary(
          startDate,
          endDate
        );

        return {
          success: true,
          message: "Metrics summary retrieved successfully",
          data: summary,
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
        200: MetricsModel.getMetricsSummaryResponse,
        400: MetricsModel.errorResponse,
        401: MetricsModel.errorResponse,
        500: MetricsModel.errorResponse,
      },
      detail: {
        tags: ["Metrics"],
        summary: "Get metrics summary",
        description:
          "Returns metrics summary including: total card issued and total quota ticket issued. Optional startDate and endDate parameters can be used to filter by purchase date.",
      },
    }
  );

export const metrics = new Elysia({ prefix: "/metrics" })
  .use(baseRoutes);
