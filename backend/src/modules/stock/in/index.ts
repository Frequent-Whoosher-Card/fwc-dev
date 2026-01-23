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

export const stockIn = new Elysia({ prefix: "/in" })
  .group("", (app) =>
    app
      .use(rbacMiddleware(["admin", "superadmin"]))
      .post(
        "/",
        async (context) => {
          const { body, set, user } = context as typeof context &
            AuthContextUser;
          try {
            const stockIn = await StockInService.createStockIn(
              body.movementAt,
              body.cardProductId,
              body.startSerial,
              body.endSerial,
              user.id,
              body.note,
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
            404: StockInModel.errorResponse,
            409: StockInModel.errorResponse,
            422: StockInModel.errorResponse,
            500: StockInModel.errorResponse,
          },
          detail: {
            tags: ["Stock In"],
            summary: "Stock In Batch (Produksi Office)",
            description:
              "Menyimpan kartu produksi ke tabel cards dengan serialNumber = serialTemplate + suffix berurutan. Role: superadmin/admin.",
          },
        },
      )
      .get(
        "/available-serials",
        async (context) => {
          const { query, set } = context;
          try {
            const result = await StockInService.getAvailableSerials(
              query.cardProductId,
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
          query: StockInModel.getAvailableSerialsQuery,
          response: {
            200: StockInModel.getAvailableSerialsResponse,
            400: StockInModel.errorResponse,
            500: StockInModel.errorResponse,
          },
          detail: {
            tags: ["Stock In"],
            summary: "Get Available Serials",
            description:
              "Mendapatkan daftar nomor serial yang statusnya ON_REQUEST (siap untuk di-stock in).",
          },
        },
      )
      .get(
        "/",
        async (context) => {
          const { query, set } = context;
          try {
            const result = await StockInService.getHistory({
              page: query.page ? parseInt(query.page) : undefined,
              limit: query.limit ? parseInt(query.limit) : undefined,
              startDate: query.startDate
                ? new Date(query.startDate)
                : undefined,
              endDate: query.endDate ? new Date(query.endDate) : undefined,
              categoryId: query.categoryId,
              typeId: query.typeId,
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
          query: StockInModel.getHistoryQuery,
          response: {
            200: StockInModel.getHistoryResponse,
            400: StockInModel.errorResponse,
            401: StockInModel.errorResponse,
            403: StockInModel.errorResponse,
            404: StockInModel.errorResponse,
            409: StockInModel.errorResponse,
            422: StockInModel.errorResponse,
            500: StockInModel.errorResponse,
          },
          detail: {
            tags: ["Stock In"],
            summary: "Get Stock In History",
            description: "Melihat riwayat stock in (produksi).",
          },
        },
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
            400: StockInModel.errorResponse,
            401: StockInModel.errorResponse,
            403: StockInModel.errorResponse,
            404: StockInModel.errorResponse,
            409: StockInModel.errorResponse,
            422: StockInModel.errorResponse,
            500: StockInModel.errorResponse,
          },
          detail: {
            tags: ["Stock In"],
            summary: "Get Stock In Detail",
            description: "Melihat detail transaksi stock in.",
          },
        },
      )
      .post(
        "/damaged",
        async (context) => {
          const { body, set, user } = context as typeof context &
            AuthContextUser;
          try {
            const result = await StockInService.reportDamaged(
              body.serialNumbers,
              user.id,
              body.note,
            );

            return {
              success: true,
              message: result.message,
              data: result.movements,
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
          body: StockInModel.reportDamagedBody,
          response: {
            200: t.Object({
              success: t.Boolean(),
              message: t.String(),
              data: t.Array(t.Any()), // Dynamic array of movements
            }),
            400: StockInModel.errorResponse,
            401: StockInModel.errorResponse,
            403: StockInModel.errorResponse,
            404: StockInModel.errorResponse,
            422: StockInModel.errorResponse,
            500: StockInModel.errorResponse,
          },
          detail: {
            tags: ["Stock In"],
            summary: "Report Damaged Cards (QC)",
            description:
              "Melaporkan kartu IN_OFFICE sebagai DAMAGED. Mencatat movement OUT (Adjustment) dan mengurangi stok office.",
            deprecated: true,
          },
        },
      ),
  )
  .group("", (app) =>
    app
      .use(rbacMiddleware(["superadmin", "admin"]))
      .patch(
        "/:id",
        async (context) => {
          const { params, body, set, user } = context as typeof context &
            AuthContextUser;
          try {
            const result = await StockInService.update(
              params.id,
              body,
              user.id,
            );
            return {
              success: true,
              message: "Stock In berhasil diupdate.",
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
            401: StockInModel.errorResponse,
            403: StockInModel.errorResponse,
            404: StockInModel.errorResponse,
            409: StockInModel.errorResponse,
            422: StockInModel.errorResponse,
            500: StockInModel.errorResponse,
          },
          detail: {
            tags: ["Stock In"],
            summary: "Update Stock In (Metadata Only)",
            description:
              "Mengupdate data stock in. Bisa mengedit serial number (dengan logic strict), note, dan movementAt.",
          },
        },
      )
      .put(
        "/:id/status-batch",
        async (context) => {
          const { params, body, set, user } = context as typeof context &
            AuthContextUser;
          try {
            const result = await StockInService.updateBatchCardStatus(
              params.id,
              body.updates,
              user.id,
            );
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
          body: StockInModel.updateBatchStatusBody,
          response: {
            200: StockInModel.updateStockInResponse, // Reusing generic response
            400: StockInModel.errorResponse,
            401: StockInModel.errorResponse,
            403: StockInModel.errorResponse,
            404: StockInModel.errorResponse,
            422: StockInModel.errorResponse,
            500: StockInModel.errorResponse,
          },
          detail: {
            tags: ["Stock In"],
            summary: "Update Batch Cards Status (QC)",
            description:
              "Mengubah status kartu (DAMAGED/LOST) dalam batch produksi ini. Mengupdate inventory office secara otomatis.",
          },
        },
      )
      .delete(
        "/:id",
        async (context) => {
          const { params, set, user } = context as typeof context &
            AuthContextUser;
          try {
            const result = await StockInService.delete(params.id, user.id);
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
            401: StockInModel.errorResponse,
            403: StockInModel.errorResponse,
            404: StockInModel.errorResponse,
            409: StockInModel.errorResponse,
            422: StockInModel.errorResponse,
            500: StockInModel.errorResponse,
          },
          detail: {
            tags: ["Stock In"],
            summary: "Delete Stock In (Undo/Cancel)",
            description:
              "Membatalkan stock in. SYARAT MUTLAK: Semua kartu dari batch ini harus masih berstatus 'IN_OFFICE'. Jika ada 1 saja yang tidak di office, batal.",
          },
        },
      ),
  );
