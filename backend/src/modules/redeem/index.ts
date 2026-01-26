import { Elysia } from "elysia";
import { RedeemService } from "./service";
import { RedeemModel } from "./model";
import { formatErrorResponse } from "../../utils/errors";
import { authMiddleware } from "src/middleware/auth";
import { rbacMiddleware } from "src/middleware/rbac";

const redeemRoutes = new Elysia()
  .use(authMiddleware)
  .use(rbacMiddleware(["superadmin", "admin", "supervisor", "petugas"]))
  .get(
    "/check/:serialNumber",
    async ({ params, query, set }) => {
      try {
        // Accept product from query or params
        const serialNumber = params.serialNumber;
        const product = query.product;
        const data = await RedeemService.checkSerial(serialNumber, product);
        return {
          success: true,
          message: "Card data retrieved successfully",
          data,
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
      params: RedeemModel.checkSerialParams,
      response: {
        200: RedeemModel.checkSerialResponse,
        404: RedeemModel.errorResponse,
        500: RedeemModel.errorResponse,
      },
      detail: {
        summary: "Check Card by Serial Number",
        tags: ["Redeem"],
        description:
          "Get card details, member info, and status by serial number",
      },
    },
  )
  .post(
    "/",
    async ({
      body: { serialNumber, redeemType, product, notes },
      user,
      set,
    }) => {
      try {
        if (!user?.stationId) {
          set.status = 400;
          throw new Error("User does not have a station assigned");
        }

        const result = await RedeemService.redeemCard(
          serialNumber,
          redeemType,
          user.id,
          user.stationId,
          product,
          notes,
        );

        return {
          success: true,
          message: "Card redeemed successfully",
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
      body: RedeemModel.redeemRequest,
      detail: {
        summary: "Redeem Card Ticket",
        tags: ["Redeem"],
        description:
          "Redeem a ticket from the card. Type: SINGLE (1) or ROUNDTRIP (2)",
      },
    },
  );

const listRedeemRoutes = new Elysia()
  .use(authMiddleware)
  .use(rbacMiddleware(["superadmin", "admin", "supervisor", "petugas"]))
  // List Redeems
  .get(
    "/",
    async ({ query, set }) => {
      try {
        const page = query.page ? parseInt(query.page) : 1;
        const limit = query.limit ? parseInt(query.limit) : 10;

        const result = await RedeemService.getRedeems({
          page,
          limit,
          startDate: query.startDate,
          endDate: query.endDate,
          stationId: query.stationId,
          search: query.search,
          category: query.category,
          cardType: query.cardType,
          redeemType: query.redeemType,
          product: query.product as any,
        });

        return {
          success: true,
          message: "Redeem transactions fetched successfully",
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
      query: RedeemModel.getRedeemsQuery,
      detail: {
        summary: "List Redeem Transactions",
        tags: ["Redeem"],
        description: "Get list of redeem transactions with filters",
      },
    },
  )
  // Get Redeem Detail
  .get(
    "/:id",
    async ({ params: { id }, set }) => {
      try {
        const result = await RedeemService.getRedeemById(id);
        return {
          success: true,
          message: "Redeem transaction detail fetched successfully",
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
        200: RedeemModel.getRedeemByIdResponse,
        404: RedeemModel.errorResponse,
        500: RedeemModel.errorResponse,
      },
      detail: {
        summary: "Get Redeem Detail",
        tags: ["Redeem"],
        description: "Get detail of a redeem transaction",
      },
    },
  )
  // Update Redeem (Notes)
  .patch(
    "/:id",
    async ({ params: { id }, body, set }) => {
      try {
        const result = await RedeemService.updateRedeem(id, body);
        return {
          success: true,
          message: "Redeem transaction updated successfully",
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
      body: RedeemModel.updateRedeemBody,
      response: {
        200: RedeemModel.updateRedeemResponse,
        404: RedeemModel.errorResponse,
        500: RedeemModel.errorResponse,
      },
      detail: {
        summary: "Update Redeem Transaction",
        tags: ["Redeem"],
        description: "Update redeem transaction (notes only)",
      },
    },
  );

// Delete route (soft delete + restore quota). Not allowed for role 'petugas'.
const deleteRedeemRoutes = new Elysia()
  .use(authMiddleware)
  .use(rbacMiddleware(["superadmin", "admin", "supervisor"]))
  .delete(
    "/:id",
    async ({ params: { id }, user, set }) => {
      try {
        const result = await RedeemService.deleteRedeem(id, user?.id);
        return {
          success: true,
          message: "Redeem transaction deleted and quota restored",
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
      detail: {
        summary: "Delete Redeem (restore quota)",
        tags: ["Redeem"],
        description: "Soft delete redeem and restore consumed quota to card",
      },
    },
  );

// Export route (all roles). Export daily report in CSV/XLSX
const exportRedeemRoutes = new Elysia()
  .use(authMiddleware)
  .use(rbacMiddleware(["superadmin", "admin", "supervisor", "petugas"]))
  .get(
    "/export",
    async ({ query, user, set }) => {
      try {
        const date = (query as any)?.date as string | undefined; // YYYY-MM-DD
        const format = (((query as any)?.format as string | undefined) ||
          "csv") as "csv" | "xlsx" | "pdf" | "jpg"; // csv|xlsx|pdf|jpg
        const { buffer, contentType, filename } =
          await RedeemService.exportDailyReport({
            date,
            userId: user!.id,
            stationId: user!.stationId!,
            format,
          });
        set.headers["Content-Type"] = contentType;
        set.headers["Content-Disposition"] = `attachment; filename=${filename}`;
        const body =
          buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
        return new Response(body as any);
      } catch (error) {
        set.status = 500;
        return formatErrorResponse(error);
      }
    },
    {
      detail: {
        summary: "Export daily redeem report",
        tags: ["Redeem"],
        description:
          "Export today's redeem transactions for operator (CSV/XLSX/PDF/JPG)",
      },
    },
  );

// Upload last redeem documentation (role: petugas)
const lastDocRoutes = new Elysia()
  .use(authMiddleware)
  .use(rbacMiddleware(["petugas", "superadmin"]))
  .post(
    "/:id/last-doc",
    async ({ params: { id }, body, user, set }) => {
      try {
        const { imageBase64, mimeType } = body as any;
        const result = await RedeemService.uploadLastRedeemDoc(
          id,
          imageBase64,
          mimeType,
          user!.id,
        );
        return {
          success: true,
          message: "Last redeem documentation uploaded",
          data: result,
        };
      } catch (error) {
        set.status = 500;
        return formatErrorResponse(error);
      }
    },
    {
      body: RedeemModel.lastDocBody,
      detail: {
        summary: "Upload last redeem documentation",
        tags: ["Redeem"],
        description:
          "Upload a photo when performing the last redeem (prev quota 1 or 2)",
      },
    },
  );

export const redeem = new Elysia({ prefix: "/redeem" })
  .use(redeemRoutes)
  .use(listRedeemRoutes)
  .use(deleteRedeemRoutes)
  .use(exportRedeemRoutes)
  .use(lastDocRoutes);
