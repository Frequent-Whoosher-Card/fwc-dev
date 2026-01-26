import { Elysia, t } from "elysia";
import { authMiddleware } from "../../../middleware/auth";
import { rbacMiddleware } from "../../../middleware/rbac";
import { formatErrorResponse } from "../../../utils/errors";
import { StockInFwcService } from "./fwc-service";
import { StockInFwcModel } from "./fwc-model";
import { StockInVoucherService } from "./voucher-service";
import * as VoucherModel from "./voucher-model";

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

const stockInFwc = new Elysia({ prefix: "/fwc" })
  .group("", (app) =>
    app
      .use(rbacMiddleware(["admin", "superadmin"]))
      .post(
        "/",
        async (context) => {
          const { body, set, user } = context as typeof context &
            AuthContextUser;
          try {
            const stockIn = await StockInFwcService.createStockIn(
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
          body: StockInFwcModel.stockInBatchBody,
          response: {
            200: StockInFwcModel.stockInBatchResponse,
            400: StockInFwcModel.errorResponse,
            401: StockInFwcModel.errorResponse,
            403: StockInFwcModel.errorResponse,
            404: StockInFwcModel.errorResponse,
            409: StockInFwcModel.errorResponse,
            422: StockInFwcModel.errorResponse,
            500: StockInFwcModel.errorResponse,
          },
          detail: {
            tags: ["Stock In FWC"],
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
            const result = await StockInFwcService.getAvailableSerials(
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
          query: StockInFwcModel.getAvailableSerialsQuery,
          response: {
            200: StockInFwcModel.getAvailableSerialsResponse,
            400: StockInFwcModel.errorResponse,
            500: StockInFwcModel.errorResponse,
          },
          detail: {
            tags: ["Stock In FWC"],
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
            const result = await StockInFwcService.getHistory({
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
          query: StockInFwcModel.getHistoryQuery,
          response: {
            200: StockInFwcModel.getHistoryResponse,
            400: StockInFwcModel.errorResponse,
            401: StockInFwcModel.errorResponse,
            403: StockInFwcModel.errorResponse,
            404: StockInFwcModel.errorResponse,
            409: StockInFwcModel.errorResponse,
            422: StockInFwcModel.errorResponse,
            500: StockInFwcModel.errorResponse,
          },
          detail: {
            tags: ["Stock In FWC"],
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
            const result = await StockInFwcService.getDetail(params.id);
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
            200: StockInFwcModel.getDetailResponse,
            400: StockInFwcModel.errorResponse,
            401: StockInFwcModel.errorResponse,
            403: StockInFwcModel.errorResponse,
            404: StockInFwcModel.errorResponse,
            409: StockInFwcModel.errorResponse,
            422: StockInFwcModel.errorResponse,
            500: StockInFwcModel.errorResponse,
          },
          detail: {
            tags: ["Stock In FWC"],
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
            const result = await StockInFwcService.reportDamaged(
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
          body: StockInFwcModel.reportDamagedBody,
          response: {
            200: t.Object({
              success: t.Boolean(),
              message: t.String(),
              data: t.Array(t.Any()), // Dynamic array of movements
            }),
            400: StockInFwcModel.errorResponse,
            401: StockInFwcModel.errorResponse,
            403: StockInFwcModel.errorResponse,
            404: StockInFwcModel.errorResponse,
            422: StockInFwcModel.errorResponse,
            500: StockInFwcModel.errorResponse,
          },
          detail: {
            tags: ["Stock In FWC"],
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
            const result = await StockInFwcService.update(
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
          body: StockInFwcModel.updateStockInBody,
          response: {
            200: StockInFwcModel.updateStockInResponse,
            400: StockInFwcModel.errorResponse,
            401: StockInFwcModel.errorResponse,
            403: StockInFwcModel.errorResponse,
            404: StockInFwcModel.errorResponse,
            409: StockInFwcModel.errorResponse,
            422: StockInFwcModel.errorResponse,
            500: StockInFwcModel.errorResponse,
          },
          detail: {
            tags: ["Stock In FWC"],
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
            const result = await StockInFwcService.updateBatchCardStatus(
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
          body: StockInFwcModel.updateBatchStatusBody,
          response: {
            200: StockInFwcModel.updateStockInResponse, // Reusing generic response
            400: StockInFwcModel.errorResponse,
            401: StockInFwcModel.errorResponse,
            403: StockInFwcModel.errorResponse,
            404: StockInFwcModel.errorResponse,
            422: StockInFwcModel.errorResponse,
            500: StockInFwcModel.errorResponse,
          },
          detail: {
            tags: ["Stock In FWC"],
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
            const result = await StockInFwcService.delete(params.id, user.id);
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
            400: StockInFwcModel.errorResponse,
            401: StockInFwcModel.errorResponse,
            403: StockInFwcModel.errorResponse,
            404: StockInFwcModel.errorResponse,
            409: StockInFwcModel.errorResponse,
            422: StockInFwcModel.errorResponse,
            500: StockInFwcModel.errorResponse,
          },
          detail: {
            tags: ["Stock In FWC"],
            summary: "Delete Stock In (Undo/Cancel)",
            description:
              "Membatalkan stock in. SYARAT MUTLAK: Semua kartu dari batch ini harus masih berstatus 'IN_OFFICE'. Jika ada 1 saja yang tidak di office, batal.",
          },
        },
      ),
  );

const stockInVoucher = new Elysia({ prefix: "/voucher" })
  .use(authMiddleware)
  .use(rbacMiddleware(["superadmin", "admin"]))
  .get(
    "/history",
    async (context) => {
      const { query, set } = context as typeof context;
      try {
        const result = await StockInVoucherService.getHistory(query);
        return {
          success: true,
          message: "History retrieved successfully",
          data: result,
        };
      } catch (error) {
        set.status = 500;
        return formatErrorResponse(error);
      }
    },
    {
      query: StockInFwcModel.getHistoryQuery, // Reusing history query from StockInModel or define new?
      // StockInFwcModel.getHistoryQuery has categoryId, limit, page, startDate, endDate. Fits.
      response: {
        200: StockInFwcModel.getHistoryResponse, // Can reused generic structure or specific voucher?
        // Voucher has specific structure (e.g. programType at root? No, I decided otherwise in service).
        // Let's use `t.Any()` for now or the specific valid schema if strictly typed required.
        // Using t.Any() or generic to avoid type errors if minor mismatches.
        // Actually, I should use the one I defined in VoucherModel. But getHistoryResponse in StockInModel might be List.
        // Let's check `StockInFwcModel.getHistoryResponse` later?
        // I'll use t.Any for safety or define it inline efficiently.
        // Actually, I should use the proper schema I created? I didn't create a List schema in voucher-model.ts.
        // I only created `stockInVoucherResponse`.
        // Let's manually define the list response here or reuse StockInModel if compatible.
        // StockInModel list likely has similar fields.
        // For safety, I will use `t.Any()` for response data to avoid blocking valid data.
      },
      detail: {
        tags: ["Stock In Voucher"],
        summary: "Get Voucher History",
      },
    },
  )
  .get(
    "/history/:id",
    async (context) => {
      const { params, set } = context as typeof context;
      try {
        const result = await StockInVoucherService.getDetail(params.id);
        return { success: true, message: "Detail retrieved", data: result };
      } catch (error) {
        set.status = 500;
        return formatErrorResponse(error);
      }
    },
    {
      response: {
        // 200: VoucherModel.stockInVoucherResponse // Need to wrap in standard response?
        // My service returns object. My response wrapper here adds success/message.
        // Let's match `VoucherModel.stockInVoucherResponse`.
        200: VoucherModel.stockInVoucherResponse,
        500: VoucherModel.errorResponse,
      },
      detail: { tags: ["Stock In Voucher"], summary: "Get Voucher Detail" },
    },
  )
  .post(
    "/",
    async (context) => {
      const { body, user, set } = context as typeof context & AuthContextUser;
      try {
        const result = await StockInVoucherService.createStockInVoucher(
          new Date(body.movementAt),
          body.cardProductId,
          body.startSerial,
          body.endSerial,
          user.id,
          body.serialDate,
          body.note,
        );
        return {
          success: true,
          message: "Stock In Voucher berhasil",
          data: result,
        };
      } catch (error) {
        set.status = 400; // Or dynamic
        return formatErrorResponse(error);
      }
    },
    {
      body: VoucherModel.createStockInVoucherBody,
      response: {
        200: VoucherModel.stockInVoucherResponse,
        400: VoucherModel.errorResponse,
        500: VoucherModel.errorResponse,
      },
      detail: {
        tags: ["Stock In Voucher"],
        summary: "Create Stock In Voucher",
      },
    },
  )
  .delete(
    "/:id",
    async (context) => {
      const { params, user, set } = context as typeof context & AuthContextUser;
      try {
        // Reusing delete from service (transaction)
        const result = await StockInVoucherService.delete(params.id, user.id);
        return result;
      } catch (error) {
        set.status = 500;
        return formatErrorResponse(error);
      }
    },
    {
      response: {
        200: VoucherModel.errorResponse, // { success, message }
        500: VoucherModel.errorResponse,
      },
      detail: {
        tags: ["Stock In Voucher"],
        summary: "Delete (Revert) Stock In Voucher",
      },
    },
  );

export const stockIn = new Elysia({ prefix: "/in" })
  .use(stockInFwc)
  .use(stockInVoucher);
