import { Elysia } from "elysia";
import { formatErrorResponse } from "../../utils/errors";
import { StockModel } from "./model";
import { StockService } from "./service";
import { stockIn } from "./in";
import { stockOut } from "./out";
import { authMiddleware } from "src/middleware/auth";

// Combine everything into a single "stock" group
export const stock = new Elysia({ prefix: "/stock" })
  .use(authMiddleware)

  // Important: Mount sub-modules first so specific routes match before generic ones
  .use(stockIn)
  .use(stockOut)

  // General Stock Analysis Routes
  .get(
    "/alerts",
    async (context) => {
      const { user, set } = context;
      try {
        const result = await StockService.getLowStockAlerts(user.id);
        return {
          success: true,
          data: result,
        };
      } catch (error) {
        set.status = 500;
        return formatErrorResponse(error);
      }
    },
    {
      detail: {
        tags: ["Stock Analysis"],
        summary: "Get Low Stock Alerts",
        description: "Mendapatkan notifikasi stok menipis.",
      },
    },
  )
  .get(
    "/",
    async (context) => {
      const { query, set } = context;
      try {
        const result = await StockService.getAllMovements({
          page: query.page ? parseInt(query.page) : undefined,
          limit: query.limit ? parseInt(query.limit) : undefined,
          startDate: query.startDate ? new Date(query.startDate) : undefined,
          endDate: query.endDate ? new Date(query.endDate) : undefined,
          type: query.type as any,
          status: query.status as any,
          cardCategory: query.cardCategory,
          cardCategoryId: query.cardCategoryId,
          cardType: query.cardType,
          cardTypeId: query.cardTypeId,
          station: query.station,
          search: query.search,
        });

        // Map basic response shape match schema expecting counts
        const data = {
          movements: result.movements.map((m) => ({
            ...m,
            sentSerialNumbersCount: m.sentSerialNumbers.length,
            receivedSerialNumbersCount: m.receivedSerialNumbers.length,
            lostSerialNumbersCount: m.lostSerialNumbers.length,
          })),
          pagination: result.pagination,
        };

        return {
          success: true,
          data: data,
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
      query: StockModel.getHistoryQuery,
      response: {
        200: StockModel.getHistoryResponse,
        400: StockModel.errorResponse,
        401: StockModel.errorResponse,
        403: StockModel.errorResponse,
        404: StockModel.errorResponse,
        409: StockModel.errorResponse,
        422: StockModel.errorResponse,
        500: StockModel.errorResponse,
      },
      detail: {
        tags: ["Stock Analysis"],
        summary: "Get All Stock Movements",
        description: "Unified history of all Stock IN and Stock OUT movements.",
      },
    },
  )
  .get(
    "/:id",
    async (context) => {
      const { params, set } = context;
      try {
        const result = await StockService.getMovementById(params.id);
        return {
          success: true,
          data: result,
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
      response: {
        200: StockModel.getDetailResponse, // Schema defined as Any for flexibility
        400: StockModel.errorResponse,
        401: StockModel.errorResponse,
        403: StockModel.errorResponse,
        404: StockModel.errorResponse,
        409: StockModel.errorResponse,
        422: StockModel.errorResponse,
        500: StockModel.errorResponse,
      },
      detail: {
        tags: ["Stock Analysis"],
        summary: "Get Stock Movement Detail",
      },
    },
  );
