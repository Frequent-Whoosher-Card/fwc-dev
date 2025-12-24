import { Elysia } from "elysia";
import { StockModel } from "./model";
import { formatErrorResponse } from "../../utils/errors";
import { StockService } from "./service";
import { authMiddleware } from "../../middleware/auth";
import { rbacMiddleware } from "../../middleware/rbac";

type AuthContextUser = {
  user: {
    id: string;
    username: string;
    fullName: string;
    email: string | null;
    role: {
      id: string;
      roleCode: string;
      roleName: string;
    };
  };
};

export const stock = new Elysia({ prefix: "/stock" })
  // Use Middleware
  .use(authMiddleware)
  .use(rbacMiddleware(["superadmin", "admin"]))
  //   Inventory Endpoints
  .get("/", () => "Hello world!", {
    detail: {
      tags: ["Stock"],
      summary: "Get stock inventory",
      description: "This endpoint is used to get stock inventory",
    },
  })
  .post(
    "/batch",
    async ({ body, set }) => {
      try {
        const {
          categoryId,
          typeId,
          stationId,
          startSerialNumber,
          endSerialNumber,
        } = body;

        const { totalCardsAdded } = await StockService.addStocks(
          categoryId,
          typeId,
          stationId,
          startSerialNumber,
          endSerialNumber
        );

        return {
          success: true,
          message: "Stocks added successfully",
          data: totalCardsAdded,
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
      body: StockModel.addStocksBody,
      response: {
        200: StockModel.addStocksResponse,
        400: StockModel.errorResponse,
        401: StockModel.errorResponse,
        500: StockModel.errorResponse,
      },
      detail: {
        tags: ["Stock"],
        summary: "Add stock cards batch",
        description: "This endpoint is used to add stock cards batch",
        deprecated: true,
      },
    }
  )
  .post(
    "/add",
    async (context) => {
      const { body, set, user } = context as typeof context & AuthContextUser;

      try {
        const { categoryId, typeId, stationId, quantity } = body;

        const { totalCardsAdded } = await StockService.addStock(
          categoryId,
          typeId,
          stationId,
          quantity,
          user.id
        );

        return {
          success: true,
          message: "Stock added successfully",
          data: totalCardsAdded,
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
      body: StockModel.addStockQuantityBody,
      response: {
        200: StockModel.addStockQuantityResponse,
        400: StockModel.errorResponse,
        401: StockModel.errorResponse,
        500: StockModel.errorResponse,
      },
      detail: {
        tags: ["Stock"],
        summary: "Add stock quantity",
        description: "This endpoint is used to add stock quantity",
      },
    }
  );
