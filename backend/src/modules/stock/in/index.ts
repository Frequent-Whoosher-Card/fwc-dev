import { Elysia, t } from "elysia";
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
          body.startSerial,
          body.quantity,
          user.id,
          body.note
        );

        return {
          success: true,
          message: "Stock masuk (produksi batch) berhasil dicatat",
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
      body: StockInModel.stockInBatchBody,
      response: {
        200: StockInModel.stockInBatchResponse,
        400: StockInModel.errorResponse,
        401: StockInModel.errorResponse,
        403: StockInModel.errorResponse,
        500: StockInModel.errorResponse,
      },
      detail: {
        tags: ["Stock In"],
        summary: "Stock In Batch (Produksi Office)",
        description:
          "Menyimpan kartu produksi ke tabel cards dengan serialNumber = serialTemplate + suffix berurutan. Role: superadmin/admin.",
      },
    }
  )
  .get(
    "/",
    async (context) => {
      const { query, set } = context;
      try {
        const result = await StockInService.getHistory({
          page: query.page ? parseInt(query.page) : undefined,
          limit: query.limit ? parseInt(query.limit) : undefined,
          startDate: query.startDate ? new Date(query.startDate) : undefined,
          endDate: query.endDate ? new Date(query.endDate) : undefined,
          categoryId: query.categoryId,
        });

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
      query: StockInModel.getHistoryQuery,
      response: {
        200: StockInModel.getHistoryResponse,
        500: StockInModel.errorResponse,
      },
      detail: {
        tags: ["Stock In"],
        summary: "Get Stock In History",
        description: "Melihat riwayat stock in (produksi).",
      },
    }
  )
  .get(
    "/:id",
    async (context) => {
      const { params, set } = context;
      try {
        const result = await StockInService.getDetail(params.id);
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
        200: StockInModel.getDetailResponse,
        404: StockInModel.errorResponse,
        400: StockInModel.errorResponse,
        500: StockInModel.errorResponse,
      },
      detail: {
        tags: ["Stock In"],
        summary: "Get Stock In Detail",
        description: "Melihat detail transaksi stock in.",
      },
    }
  )
  .patch(
    "/:id",
    async (context) => {
      const { params, body, set, user } = context as typeof context &
        AuthContextUser;
      try {
        const result = await StockInService.update(params.id, body, user.id);
        return {
          success: true,
          message:
            "Stock In berhasil diupdate (hanya metadata: note, movementAt).",
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
      body: StockInModel.updateStockInBody,
      response: {
        200: StockInModel.updateStockInResponse,
        400: StockInModel.errorResponse,
        404: StockInModel.errorResponse,
        500: StockInModel.errorResponse,
      },
      detail: {
        tags: ["Stock In"],
        summary: "Update Stock In (Metadata Only)",
        description:
          "Mengupdate data stock in. HANYA DIPERBOLEHKAN mengedit 'note' dan 'movementAt'.",
      },
    }
  )
  .delete(
    "/:id",
    async (context) => {
      const { params, set, user } = context as typeof context & AuthContextUser;
      try {
        const result = await StockInService.delete(params.id);
        return result;
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
        200: t.Object({
          success: t.Boolean(),
          message: t.String(),
        }),
        400: StockInModel.errorResponse,
        404: StockInModel.errorResponse,
        500: StockInModel.errorResponse,
      },
      detail: {
        tags: ["Stock In"],
        summary: "Delete Stock In (Undo/Cancel)",
        description:
          "Membatalkan stock in. SYARAT MUTLAK: Semua kartu dari batch ini harus masih berstatus 'IN_OFFICE'. Jika ada 1 saja yang tidak di office, batal.",
      },
    }
  );
