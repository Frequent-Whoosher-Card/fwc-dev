import { Elysia } from "elysia";
import { RedeemService } from "./service";
import { RedeemModel } from "./model";
import { formatErrorResponse } from "../../utils/errors";
import { authMiddleware } from "src/middleware/auth";
import { rbacMiddleware } from "src/middleware/rbac";

const redeemRoutes = new Elysia()
  .use(authMiddleware)
  .use(rbacMiddleware(["superadmin", "supervisor", "petugas"]))
  .get(
    "/check/:serialNumber",
    async ({ params: { serialNumber }, set }) => {
      try {
        const data = await RedeemService.checkSerial(serialNumber);
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
    }
  )
  .post(
    "/",
    async ({ body: { serialNumber, quotaUsed, notes }, user, set }) => {
      try {
        if (!user?.stationId) {
          set.status = 400;
          throw new Error("User does not have a station assigned");
        }

        const result = await RedeemService.redeemCard(
          serialNumber,
          quotaUsed,
          user.id,
          user.stationId,
          notes
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
        description: "Redeem a ticket from the card, reducing quota",
      },
    }
  );

const listRedeemRoutes = new Elysia()
  .use(authMiddleware)
  .use(rbacMiddleware(["superadmin", "admin", "supervisor"]))
  // List Redeems
  .get(
    "/",
    async ({ query, set }) => {
      try {
        const page = query.page ? parseInt(query.page as string) : 1;
        const limit = query.limit ? parseInt(query.limit as string) : 10;

        const result = await RedeemService.getRedeems({
          page,
          limit,
          startDate: query.startDate,
          endDate: query.endDate,
          stationId: query.stationId,
          search: query.search,
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
      response: {
        200: RedeemModel.getRedeemsResponse,
        500: RedeemModel.errorResponse,
      },
      detail: {
        summary: "List Redeem Transactions",
        tags: ["Redeem"],
        description: "Get list of redeem transactions with filters",
      },
    }
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
    }
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
    }
  );

export const redeem = new Elysia({ prefix: "/redeem" })
  .use(redeemRoutes)
  .use(listRedeemRoutes);
