import { Elysia } from "elysia";
import { authMiddleware } from "../../../middleware/auth";
import { rbacMiddleware } from "../../../middleware/rbac";
import { ValidationError, formatErrorResponse } from "../../../utils/errors";
import { StockOutService } from "./service";
import { StockOutModel } from "./model";

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
    stationId: string;
  };
};

const baseRoutes = new Elysia()
  .use(authMiddleware)
  .post("/:movementId/validate", async (context) => {
    const { params, body, set, user } = context as typeof context &
      AuthContextUser;
    if (!user.stationId) {
      set.status = 400;
      return formatErrorResponse(
        new ValidationError("Petugas tidak memiliki ID stasiun pada context")
      );
    }
    try {
    } catch (error) {
      set.status =
        error instanceof Error && "statusCode" in error
          ? (error as any).statusCode
          : 500;
      return formatErrorResponse(error);
    }
  });

const adminRoutes = new Elysia()
  .use(authMiddleware)
  .use(rbacMiddleware(["superadmin", "admin"]))
  .post(
    "/",
    async (context) => {
      const { body, set, user } = context as typeof context & AuthContextUser;
      try {
        const result = await StockOutService.stockOutDistribution(
          new Date(body.movementAt),
          body.categoryId,
          body.typeId,
          body.serialNumbers,
          body.stationId,
          user.id,
          body.note
        );

        return {
          success: true,
          message:
            "Distribusi stok berhasil dibuat (PENDING, menunggu validasi petugas)",
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
      body: StockOutModel.stockOutRequest,
      response: {
        200: StockOutModel.stockOutResponse,
        400: StockOutModel.errorResponse,
        401: StockOutModel.errorResponse,
        403: StockOutModel.errorResponse,
        500: StockOutModel.errorResponse,
      },
      detail: {
        tags: ["Stock Out"],
        summary: "Stock Out Distribution",
        description:
          "Menyimpan distribusi stok ke tabel stock_out dengan status PENDING. Role: superadmin/admin.",
      },
    }
  );

export const stockOut = new Elysia({ prefix: "/stock/out" }).use(adminRoutes);
