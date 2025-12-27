import { Elysia } from "elysia";
import { authMiddleware } from "../../../middleware/auth";
import { rbacMiddleware } from "../../../middleware/rbac";
import { formatErrorResponse } from "../../../utils/errors";
import { StockInService } from "./service";
import { StockInModel } from "./model";

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

export const stockIn = new Elysia({ prefix: "/stock/in" })
  .use(authMiddleware)
  .use(rbacMiddleware(["superadmin", "admin"]))
  .post(
    "/",
    async (context) => {
      const { body, set, user } = context as typeof context & AuthContextUser;
      try {
        const stockIn = await StockInService.createStockIn(
          body.movementAt,
          body.categoryId,
          body.typeId,
          body.quantity,
          user.id,
          body.note
        );

        return {
          success: true,
          message: "Stock in created successfully",
          data: stockIn,
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
      body: StockInModel.stockInRequest,
      response: {
        200: StockInModel.stockInResponse,
        400: StockInModel.errorResponse,
        401: StockInModel.errorResponse,
        403: StockInModel.errorResponse,
        500: StockInModel.errorResponse,
      },
      detail: {
        tags: ["Stock In"],
        summary: "Create stock in",
        description: "This endpoint is used to create stock in (superadmin)",
      },
    }
  );
