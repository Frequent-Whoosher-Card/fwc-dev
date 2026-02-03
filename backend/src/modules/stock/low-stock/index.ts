import { Elysia } from "elysia";
import { authMiddleware } from "../../../middleware/auth";
import { formatErrorResponse } from "../../../utils/errors";
import { LowStockModel } from "./model";
import { LowStockEndpointService } from "./service";

export const lowStock = new Elysia({ prefix: "/low-stock" })
  .use(authMiddleware)
  .get(
    "/",
    async (context) => {
      const { query, set } = context;
      try {
        const { scope, programType, stationId } = query;
        const data = await LowStockEndpointService.getLowStockItems({
          scope: scope as any,
          programType: programType as any,
          stationId,
        });

        return {
          success: true,
          message: "Low stock items retrieved successfully",
          data,
        };
      } catch (error) {
        set.status = 500;
        return formatErrorResponse(error);
      }
    },
    {
      query: LowStockModel.getLowStockQuery,
      response: {
        200: LowStockModel.getLowStockResponse,
        500: LowStockModel.errorResponse,
      },
      detail: {
        tags: ["Stock Analysis"],
        summary: "Get Low Stock Overview",
        description:
          "Get a list of items running low in Office or Stations. Supports filtering by Scope (OFFICE/STATION/GLOBAL) and Program Type.",
      },
    },
  );
