import { Elysia, t } from "elysia";
import db from "../../../config/db";
import { authMiddleware } from "../../../middleware/auth";
import { permissionMiddleware } from "../../../middleware/permission";
import { ValidationError, formatErrorResponse } from "../../../utils/errors";
import { StockOutFwcService } from "./fwc-service";
import { StockOutFwcModel } from "./fwc-model";
import { StockOutVoucherService } from "./voucher-service";
import { StockOutVoucherModel } from "./voucher-model";
import { StockIssueService } from "./issue-service";

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

const stockOutFwc = new Elysia({ prefix: "/fwc" })
  .use(authMiddleware)
  .group("", (app) =>
    app
      .use(permissionMiddleware("stock.out.view"))
      .get(
        "/",
        async (context) => {
          const { query, set } = context;
          try {
            const result = await StockOutFwcService.getHistory({
              page: query.page ? parseInt(query.page) : undefined,
              limit: query.limit ? parseInt(query.limit) : undefined,
              startDate: query.startDate
                ? new Date(query.startDate)
                : undefined,
              endDate: query.endDate ? new Date(query.endDate) : undefined,
              stationId: query.stationId,
              status: query.status as any,
              search: query.search,
              stationName: query.stationName,
              categoryName: query.categoryName,
              typeName: query.typeName,
            });
            return { success: true, data: result };
          } catch (error) {
            set.status = 500;
            return formatErrorResponse(error);
          }
        },
        {
          query: StockOutFwcModel.getHistoryQuery,
          response: {
            200: StockOutFwcModel.getHistoryResponse,
            500: StockOutFwcModel.errorResponse,
          },
          detail: { tags: ["Stock Out FWC"], summary: "Get History" },
        },
      )
      .get(
        "/:id",
        async (context) => {
          const { params, set } = context;
          try {
            const result = await StockOutFwcService.getDetail(params.id);
            return { success: true, data: result };
          } catch (error) {
            set.status = 500;
            return formatErrorResponse(error);
          }
        },
        {
          response: {
            200: StockOutFwcModel.getDetailResponse,
            404: StockOutFwcModel.errorResponse,
            500: StockOutFwcModel.errorResponse,
          },
          detail: { tags: ["Stock Out FWC"], summary: "Get Detail" },
        },
      )
      .get(
        "/available-serials",
        async (context) => {
          const { query, set } = context;
          try {
            const result = await StockOutFwcService.getAvailableSerials(
              query.cardProductId,
            );
            return { success: true, data: result };
          } catch (error) {
            set.status = 500;
            return formatErrorResponse(error);
          }
        },
        {
          query: StockOutFwcModel.getAvailableSerialsQuery,
          response: {
            200: StockOutFwcModel.getAvailableSerialsResponse,
            400: StockOutFwcModel.errorResponse,
            500: StockOutFwcModel.errorResponse,
          },
          detail: { tags: ["Stock Out FWC"], summary: "Get Available Serials" },
        },
      ),
  )
  .group("", (app) =>
    app.use(permissionMiddleware("stock.out.create")).post(
      "/",
      async (context) => {
        const { body, set, user } = context as typeof context & AuthContextUser;
        try {
          const result = await StockOutFwcService.stockOutDistribution(
            new Date(body.movementAt),
            body.cardProductId,
            body.stationId,
            body.startSerial,
            body.endSerial,
            user.id,
            body.note,
            body.notaDinas,
            body.bast,
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
        body: StockOutFwcModel.stockOutRequest,
        response: {
          200: StockOutFwcModel.stockOutResponse,
          400: StockOutFwcModel.errorResponse,
          500: StockOutFwcModel.errorResponse,
        },
        detail: { tags: ["Stock Out FWC"], summary: "Create Stock Out" },
      },
    ),
  )
  .group("", (app) =>
    app.use(permissionMiddleware("stock.out.update")).patch(
      "/:id",
      async (context) => {
        const { params, body, set, user } = context as typeof context &
          AuthContextUser;
        try {
          const result = await StockOutFwcService.update(
            params.id,
            body,
            user.id,
          );
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
        body: StockOutFwcModel.updateStockOutBody,
        response: {
          200: StockOutFwcModel.updateStockOutResponse,
          400: StockOutFwcModel.errorResponse,
          500: StockOutFwcModel.errorResponse,
        },
        detail: { tags: ["Stock Out FWC"], summary: "Update Stock Out" },
      },
    ),
  )
  .group("", (app) =>
    app.use(permissionMiddleware("stock.out.validate")).post(
      "/:movementId/validate",
      async (context) => {
        const { params, body, set, user } = context as typeof context &
          AuthContextUser;
        if (!user.stationId) {
          set.status = 400;
          return formatErrorResponse(
            new ValidationError("Petugas tidak memiliki ID stasiun"),
          );
        }
        try {
          const result = await StockOutFwcService.validateStockOutReceipe(
            params.movementId,
            body.receivedSerialNumbers || [],
            body.lostSerialNumbers,
            body.damagedSerialNumbers,
            user.id,
            user.stationId,
            body.note,
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
        body: StockOutFwcModel.stockOutValidateRequest,
        response: {
          200: StockOutFwcModel.stockOutValidateResponse,
          400: StockOutFwcModel.errorResponse,
          500: StockOutFwcModel.errorResponse,
        },
        detail: { tags: ["Stock Out FWC"], summary: "Validate Stock Out" },
      },
    ),
  )
  .group("", (app) =>
    app.use(permissionMiddleware("stock.out.delete")).delete(
      "/:id",
      async (context) => {
        const { params, set, user } = context as typeof context &
          AuthContextUser;
        try {
          const result = await StockOutFwcService.delete(params.id, user.id);
          return { success: true, message: result.message };
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
          200: StockOutFwcModel.deleteStockOutResponse,
          400: StockOutFwcModel.errorResponse,
          500: StockOutFwcModel.errorResponse,
        },
        detail: { tags: ["Stock Out FWC"], summary: "Delete Stock Out" },
      },
    ),
  );

const stockOutVoucher = new Elysia({ prefix: "/voucher" })
  .use(authMiddleware)
  .group("", (app) =>
    app
      .use(permissionMiddleware("stock.out.validate"))
      .get(
        "/",
        async (context) => {
          const { query, set } = context;
          try {
            const result = await StockOutVoucherService.getHistory({
              page: query.page ? parseInt(query.page) : undefined,
              limit: query.limit ? parseInt(query.limit) : undefined,
              startDate: query.startDate
                ? new Date(query.startDate)
                : undefined,
              endDate: query.endDate ? new Date(query.endDate) : undefined,
              stationId: query.stationId,
              status: query.status as any,
              search: query.search,
              stationName: query.stationName,
              categoryName: query.categoryName,
              typeName: query.typeName,
            });
            return { success: true, data: result };
          } catch (error) {
            set.status = 500;
            return formatErrorResponse(error);
          }
        },
        {
          query: StockOutVoucherModel.getHistoryQuery,
          response: {
            200: StockOutVoucherModel.getHistoryResponse,
            500: StockOutVoucherModel.errorResponse,
          },
          detail: { tags: ["Stock Out Voucher"], summary: "Get History" },
        },
      )
      .get(
        "/:id",
        async (context) => {
          const { params, set } = context;
          try {
            const result = await StockOutVoucherService.getDetail(params.id);
            return { success: true, data: result };
          } catch (error) {
            set.status = 500;
            return formatErrorResponse(error);
          }
        },
        {
          response: {
            200: StockOutVoucherModel.getDetailResponse,
            404: StockOutVoucherModel.errorResponse,
            500: StockOutVoucherModel.errorResponse,
          },
          detail: { tags: ["Stock Out Voucher"], summary: "Get Detail" },
        },
      )
      .post(
        "/:movementId/validate",
        async (context) => {
          const { params, body, set, user } = context as typeof context &
            AuthContextUser;
          if (!user.stationId) {
            set.status = 400;
            return formatErrorResponse(
              new ValidationError("Petugas tidak memiliki ID stasiun"),
            );
          }
          try {
            const result = await StockOutVoucherService.validateStockOutReceipe(
              params.movementId,
              body.receivedSerialNumbers || [],
              body.lostSerialNumbers,
              body.damagedSerialNumbers,
              user.id,
              user.stationId,
              body.note,
            );
            return {
              success: true,
              message: "Validasi stok voucher berhasil",
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
          body: StockOutVoucherModel.stockOutValidateRequest,
          response: {
            200: StockOutVoucherModel.stockOutValidateResponse,
            400: StockOutVoucherModel.errorResponse,
            500: StockOutVoucherModel.errorResponse,
          },
          detail: {
            tags: ["Stock Out Voucher"],
            summary: "Validate Stock Out",
          },
        },
      ),
  )
  .group("", (app) =>
    app
      .use(permissionMiddleware("stock.out.update"))
      .get(
        "/available-serials",
        async (context) => {
          const { query, set } = context;
          try {
            const result = await StockOutVoucherService.getAvailableSerials(
              query.cardProductId,
            );
            return { success: true, data: result };
          } catch (error) {
            set.status = 500;
            return formatErrorResponse(error);
          }
        },
        {
          query: StockOutVoucherModel.getAvailableSerialsQuery,
          response: {
            200: StockOutVoucherModel.getAvailableSerialsResponse,
            400: StockOutVoucherModel.errorResponse,
            500: StockOutVoucherModel.errorResponse,
          },
          detail: {
            tags: ["Stock Out Voucher"],
            summary: "Get Available Serials",
          },
        },
      )
      .post(
        "/",
        async (context) => {
          const { body, set, user } = context as typeof context &
            AuthContextUser;
          try {
            const result = await StockOutVoucherService.stockOutDistribution(
              new Date(body.movementAt),
              body.cardProductId,
              body.stationId,
              body.startSerial,
              body.endSerial,
              user.id,
              new Date(body.serialDate),
              body.note,
              body.notaDinas,
              body.bast,
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
          body: StockOutVoucherModel.stockOutRequest,
          response: {
            200: StockOutVoucherModel.stockOutResponse,
            400: StockOutVoucherModel.errorResponse,
            500: StockOutVoucherModel.errorResponse,
          },
          detail: { tags: ["Stock Out Voucher"], summary: "Create Stock Out" },
        },
      )
      .patch(
        "/:id",
        async (context) => {
          const { params, body, set, user } = context as typeof context &
            AuthContextUser;
          try {
            const result = await StockOutVoucherService.update(
              params.id,
              body,
              user.id,
            );
            return {
              success: true,
              message: "Data stock out voucher berhasil diperbarui",
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
          body: StockOutVoucherModel.updateStockOutBody,
          response: {
            200: StockOutVoucherModel.updateStockOutResponse,
            400: StockOutVoucherModel.errorResponse,
            500: StockOutVoucherModel.errorResponse,
          },
          detail: { tags: ["Stock Out Voucher"], summary: "Update Stock Out" },
        },
      )
      .delete(
        "/:id",
        async (context) => {
          const { params, set, user } = context as typeof context &
            AuthContextUser;
          try {
            const result = await StockOutVoucherService.delete(
              params.id,
              user.id,
            );
            return { success: true, message: result.message };
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
            200: StockOutVoucherModel.deleteStockOutResponse,
            400: StockOutVoucherModel.errorResponse,
            500: StockOutVoucherModel.errorResponse,
          },
          detail: { tags: ["Stock Out Voucher"], summary: "Delete Stock Out" },
        },
      ),
  );

export const stockOut = new Elysia({ prefix: "/out" })
  .use(stockOutFwc)
  .use(stockOutVoucher)
  .group("", (app) =>
    app.use(permissionMiddleware("stock.out.validate")).post(
      "/validate/:movementId",
      async (context) => {
        const { params, body, set, user } = context as typeof context &
          AuthContextUser;
        if (!user.stationId) {
          set.status = 400;
          return formatErrorResponse(
            new ValidationError("Petugas tidak memiliki ID stasiun"),
          );
        }

        try {
          // 1. Get Movement to determine Type
          const movement = await db.cardStockMovement.findUnique({
            where: { id: params.movementId },
            include: { category: true },
          });

          if (!movement) {
            throw new ValidationError("Data movement tidak ditemukan");
          }

          const programType = movement.category.programType;
          let result;

          // 2. Delegate based on Program Type
          if (programType === "FWC") {
            result = await StockOutFwcService.validateStockOutReceipe(
              params.movementId,
              body.receivedSerialNumbers || [],
              body.lostSerialNumbers,
              body.damagedSerialNumbers,
              user.id,
              user.stationId,
              body.note,
            );
          } else if (programType === "VOUCHER") {
            result = await StockOutVoucherService.validateStockOutReceipe(
              params.movementId,
              body.receivedSerialNumbers || [],
              body.lostSerialNumbers,
              body.damagedSerialNumbers,
              user.id,
              user.stationId,
              body.note,
            );
          } else {
            throw new ValidationError("Tipe program tidak dikenali");
          }

          return {
            success: true,
            message: `Validasi stok ${programType} berhasil`,
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
        body: StockOutFwcModel.stockOutValidateRequest, // Reuse same schema
        response: {
          200: StockOutFwcModel.stockOutValidateResponse, // Reuse same schema structure
          400: StockOutFwcModel.errorResponse,
          500: StockOutFwcModel.errorResponse,
        },
        detail: {
          tags: ["Stock Out Unified"],
          summary: "Validate Stock Out (Unified)",
        },
      },
    ),
  )
  .group("", (app) =>
    app.use(permissionMiddleware("stock.issue.view")).get(
      "/issue/:movementId",
      async (context) => {
        const { params, set } = context;
        try {
          const result = await StockIssueService.getIssueDetail(
            params.movementId,
          );
          return { success: true, data: result };
        } catch (error) {
          set.status = 500;
          return formatErrorResponse(error);
        }
      },
      {
        detail: {
          tags: ["Stock Out Unified"],
          summary: "Get Stock Issue Detail",
        },
      },
    ),
  )
  .group("", (app) =>
    app.use(permissionMiddleware("stock.issue.resolve")).post(
      "/issue/:movementId/resolve",
      async (context) => {
        const { params, body, set, user } = context as any;
        const { movementId } = params;
        const { action, note } = body;

        try {
          // Note: Service expects (movementId, adminId, decision, note)
          const result = await StockIssueService.resolveIssue(
            movementId,
            user.id,
            action,
            note,
          );
          return { success: true, data: result };
        } catch (error) {
          set.status = 500;
          return formatErrorResponse(error);
        }
      },
      {
        body: t.Object({
          action: t.Union([t.Literal("APPROVE"), t.Literal("REJECT")]),
          note: t.Optional(t.String()),
        }),
        detail: {
          tags: ["Stock Out Unified"],
          summary: "Resolve Stock Issue (Admin Approval)",
          description:
            "Approve or Reject 'Lost/Damaged' reports from Supervisors.",
        },
      },
    ),
  );
