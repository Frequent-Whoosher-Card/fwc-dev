import { Elysia, t } from "elysia";
import { authMiddleware } from "../../../middleware/auth";
import { rbacMiddleware } from "../../../middleware/rbac";
import { formatErrorResponse } from "../../../utils/errors";
import { StockInFwcService } from "./fwc-service";
import { StockInFwcModel } from "./fwc-model";
import { StockInVoucherService } from "./voucher-service";
import { StockInVoucherModel } from "./voucher-model";

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
      body: StockInVoucherModel.createStockInVoucherBody,
      response: {
        200: StockInVoucherModel.stockInVoucherResponse,
        400: StockInVoucherModel.errorResponse,
        500: StockInVoucherModel.errorResponse,
      },
      detail: {
        tags: ["Stock In Voucher"],
        summary: "Create Stock In Voucher",
      },
    },
  )
  .get(
    "/available-serials",
    async (context) => {
      const { query, set } = context;
      try {
        const result = await StockInVoucherService.getAvailableSerials(
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
      query: StockInVoucherModel.getAvailableSerialsQuery,
      response: {
        200: t.Object({
          success: t.Boolean(),
          data: t.Object({
            startSerial: t.Union([t.String(), t.Null()]),
            endSerial: t.Union([t.String(), t.Null()]),
            count: t.Number(),
          }),
        }),
        400: StockInVoucherModel.errorResponse,
        500: StockInVoucherModel.errorResponse,
      },
      detail: {
        tags: ["Stock In Voucher"],
        summary: "Get Available Serials (Voucher)",
        description: "Mendapatkan serial ON_REQUEST untuk voucher.",
      },
    },
  )
  .get(
    "/history",
    async (context) => {
      const { query, set } = context as typeof context;
      try {
        const result = await StockInVoucherService.getHistory({
          page: query.page ? parseInt(query.page) : undefined,
          limit: query.limit ? parseInt(query.limit) : undefined,
          startDate: query.startDate ? new Date(query.startDate) : undefined,
          endDate: query.endDate ? new Date(query.endDate) : undefined,
          categoryId: query.categoryId,
          typeId: query.typeId,
          search: query.search,
        });

        // FIX: Return standardized JSON structure
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
      query: StockInVoucherModel.getHistoryQuery,
      response: {
        200: t.Object({
          success: t.Boolean(),
          data: t.Object({
            items: t.Array(t.Any()), // Using Any to avoid strict schema mismatch for now
            pagination: t.Object({
              currentPage: t.Number(),
              totalPages: t.Number(),
              totalItems: t.Number(),
            }),
          }),
        }),
        500: StockInVoucherModel.errorResponse,
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
        200: StockInVoucherModel.stockInVoucherResponse,
        500: StockInVoucherModel.errorResponse,
      },
      detail: { tags: ["Stock In Voucher"], summary: "Get Voucher Detail" },
    },
  )
  .patch(
    "/:id",
    async (context) => {
      const { params, body, set, user } = context as typeof context &
        AuthContextUser;
      try {
        const result = await StockInVoucherService.update(
          params.id,
          body,
          user.id,
        );
        return {
          success: true,
          message: "Stock In Voucher berhasil diupdate.",
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
      body: StockInVoucherModel.updateStockInBody,
      response: {
        200: t.Object({
          success: t.Boolean(),
          message: t.String(),
          data: t.Any(),
        }),
        400: StockInVoucherModel.errorResponse,
        500: StockInVoucherModel.errorResponse,
      },
      detail: {
        tags: ["Stock In Voucher"],
        summary: "Update Stock In Voucher (Metadata)",
      },
    },
  )
  .put(
    "/:id/status-batch",
    async (context) => {
      const { params, body, set, user } = context as typeof context &
        AuthContextUser;
      try {
        const result = await StockInVoucherService.updateBatchCardStatus(
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
      body: StockInVoucherModel.updateBatchStatusBody,
      response: {
        200: t.Object({
          success: t.Boolean(),
          message: t.String(),
        }),
        400: StockInVoucherModel.errorResponse,
        500: StockInVoucherModel.errorResponse,
      },
      detail: {
        tags: ["Stock In Voucher"],
        summary: "Update Voucher Batch Cards Status (QC)",
      },
    },
  )
  .delete(
    "/:id",
    async (context) => {
      const { params, user, set } = context as typeof context & AuthContextUser;
      try {
        const result = await StockInVoucherService.delete(params.id, user.id);
        return result;
      } catch (error) {
        set.status = 500;
        return formatErrorResponse(error);
      }
    },
    {
      response: {
        400: StockInVoucherModel.errorResponse,
        500: StockInVoucherModel.errorResponse,
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
