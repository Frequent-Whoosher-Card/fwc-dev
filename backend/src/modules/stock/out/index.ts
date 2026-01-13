import { Elysia, t } from "elysia";
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
  .use(rbacMiddleware(["supervisor", "admin", "superadmin"]))
  .post(
    "/:movementId/validate",
    async (context) => {
      const { params, body, set, user } = context as typeof context &
        AuthContextUser;
      if (!user.stationId) {
        set.status = 400;
        return formatErrorResponse(
          new ValidationError("Petugas tidak memiliki ID stasiun pada context")
        );
      }
      try {
        const result = await StockOutService.validateStockOutReceipe(
          params.movementId,
          body.receivedSerialNumbers,
          body.lostSerialNumbers,
          body.damagedSerialNumbers,
          user.id,
          user.stationId,
          body.note
        );

        return {
          success: true,
          message: "Validasi stok berhasil",
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
      body: StockOutModel.stockOutValidateRequest,
      response: {
        200: StockOutModel.stockOutValidateResponse,
        400: StockOutModel.errorResponse,
        401: StockOutModel.errorResponse,
        403: StockOutModel.errorResponse,
        500: StockOutModel.errorResponse,
      },
      detail: {
        tags: ["Stock Out"],
        summary: "Stock Out Validate",
        description: "Validasi stok keluar oleh petugas station.",
      },
    }
  )
  .get(
    "/",
    async (context) => {
      const { query, set } = context;
      try {
        const result = await StockOutService.getHistory({
          page: query.page ? parseInt(query.page) : undefined,
          limit: query.limit ? parseInt(query.limit) : undefined,
          startDate: query.startDate ? new Date(query.startDate) : undefined,
          endDate: query.endDate ? new Date(query.endDate) : undefined,
          stationId: query.stationId,
          status: query.status as any,
          search: query.search,
          stationName: query.stationName,
          categoryName: query.categoryName,
          typeName: query.typeName,
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
      query: StockOutModel.getHistoryQuery,
      response: {
        200: StockOutModel.getHistoryResponse,
        500: StockOutModel.errorResponse,
      },
      detail: {
        tags: ["Stock Out"],
        summary: "Get Stock Out History",
        description:
          "Melihat riwayat distribusi stok keluar. Bisa filter by station, status, date.",
      },
    }
  )
  .get(
    "/:id",
    async (context) => {
      const { params, set } = context;
      try {
        const result = await StockOutService.getDetail(params.id);
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
        200: StockOutModel.getDetailResponse,
        404: StockOutModel.errorResponse,
        500: StockOutModel.errorResponse,
      },
      detail: {
        tags: ["Stock Out"],
        summary: "Get Stock Out Detail",
        description:
          "Melihat detail distribusi, termasuk log serial number yang dikirim, diterima, dan hilang.",
      },
    }
  );

const adminRoutes = new Elysia()
  .use(authMiddleware)
  .use(rbacMiddleware(["superadmin", "admin"]))
  .get(
    "/available-serials",
    async (context) => {
      const { query, set } = context;
      try {
        const result = await StockOutService.getAvailableSerials(
          query.cardProductId
        );
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
      query: StockOutModel.getAvailableSerialsQuery,
      response: {
        200: StockOutModel.getAvailableSerialsResponse,
        400: StockOutModel.errorResponse,
        500: StockOutModel.errorResponse,
      },
      detail: {
        tags: ["Stock Out"],
        summary: "Get Available Serials",
        description:
          "Mendapatkan daftar nomor serial yang statusnya IN_OFFICE (siap untuk dikirim).",
      },
    }
  )
  .post(
    "/",
    async (context) => {
      const { body, set, user } = context as typeof context & AuthContextUser;
      try {
        const result = await StockOutService.stockOutDistribution(
          new Date(body.movementAt),
          body.cardProductId,
          body.stationId,
          body.startSerial,
          body.endSerial,
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
        422: StockOutModel.errorResponse,
        500: StockOutModel.errorResponse,
      },
      detail: {
        tags: ["Stock Out"],
        summary: "Stock Out Distribution",
        description:
          "Menyimpan distribusi stok ke tabel stock_out dengan status PENDING. Role: superadmin/admin.",
      },
    }
  )
  .patch(
    "/:id",
    async (context) => {
      const { params, body, set, user } = context as typeof context &
        AuthContextUser;
      try {
        const result = await StockOutService.update(params.id, body, user.id);
        return {
          success: true,
          message: "Data stock out berhasil diperbarui",
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
      body: StockOutModel.updateStockOutBody,
      response: {
        200: StockOutModel.updateStockOutResponse,
        400: StockOutModel.errorResponse,
        404: StockOutModel.errorResponse,
        500: StockOutModel.errorResponse,
      },
      detail: {
        tags: ["Stock Out"],
        summary: "Update Stock Out Metadata",
        description:
          "Mengubah data distribusi. Hanya bisa diubah jika status masih PENDING.",
      },
    }
  )
  .delete(
    "/:id",
    async (context) => {
      const { params, set, user } = context as typeof context & AuthContextUser;
      try {
        const result = await StockOutService.delete(params.id, user.id);
        return {
          success: true,
          message: result.message,
        };
      } catch (error) {
        set.status =
          error instanceof Error && "statusCode" in error
            ? (error as any).statusCode
            : 500;
        if (
          error instanceof ValidationError &&
          error.message === "Bukan transaksi Stock Out"
        ) {
          set.status = 400;
        }
        return formatErrorResponse(error);
      }
    },
    {
      response: {
        200: StockOutModel.deleteStockOutResponse,
        400: StockOutModel.errorResponse,
        500: StockOutModel.errorResponse,
      },
      detail: {
        tags: ["Stock Out"],
        summary: "Delete / Cancel Stock Out",
        description:
          "Hapus transaksi pengiriman. HANYA JIKA kartu belum terjual/terpakai. Mengembalikan kartu ke Office.",
      },
    }
  );

export const stockOut = new Elysia({ prefix: "/out" })
  .use(baseRoutes)
  .use(adminRoutes);
