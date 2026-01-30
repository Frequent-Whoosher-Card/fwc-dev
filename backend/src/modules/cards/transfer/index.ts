import { Elysia, t } from "elysia";
import { TransferService } from "./service";
import { TransferModel } from "./model";
import { authMiddleware } from "../../../middleware/auth";
import { formatErrorResponse } from "../../../utils/errors";
import { permissionMiddleware } from "../../../middleware/permission";

export const transfers = new Elysia({ prefix: "/transfers" })
  .use(authMiddleware)
  // Create Transfer
  .group("", (app) =>
    app
      .use(permissionMiddleware("transfer.create"))
      .post(
        "/",
        async (context) => {
          const { body, user, set } = context as any; // Allow permission middleware to enhance context if needed
          try {
            const { stationId, toStationId, categoryId, typeId, cardIds, note } =
              body;
            const userId = user.id;

            const movement = await TransferService.createTransfer({
              stationId,
              toStationId,
              categoryId,
              typeId,
              cardIds,
              note,
              userId,
            });

            return {
              success: true,
              message: "Transfer created successfully",
              data: movement,
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
          body: TransferModel.createTransferBody,
          response: {
            200: TransferModel.createTransferResponse,
            400: TransferModel.errorResponse,
            401: TransferModel.errorResponse,
            403: TransferModel.errorResponse,
            422: TransferModel.errorResponse,
            500: TransferModel.errorResponse,
          },
          detail: {
            tags: ["Transfer"],
            summary: "Create Card Transfer",
            description:
              "Initiate a transfer of cards from one station to another.",
          },
        },
      )
  )

  // Get Transfers (View)
  .group("", (app) =>
    app
      .use(permissionMiddleware("transfer.view"))
      .get(
        "/",
        async (context) => {
          const { query, set } = context;
          try {
            const { stationId, status, search, page = "1", limit = "10" } = query;
            const result = await TransferService.getTransfers({
              stationId,
              status: status as any,
              search,
              page: parseInt(page),
              limit: parseInt(limit),
            });
            return {
              success: true,
              message: "Transfers retrieved",
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
          query: TransferModel.getTransfersQuery,
          response: {
            200: TransferModel.getTransfersResponse,
            400: TransferModel.errorResponse,
            401: TransferModel.errorResponse,
            500: TransferModel.errorResponse,
          },
          detail: {
            tags: ["Transfer"],
            summary: "Get Transfers",
            description:
              "Retrieve a list of card transfers with optional filtering by station and status.",
          },
        },
      )
      .get(
        "/:id",
        async (context) => {
          const { params, set } = context;
          try {
            const { id } = params;
            const transfer = await TransferService.getTransferById(id);
            if (!transfer) {
              set.status = 404;
              return {
                success: false,
                error: {
                  message: "Transfer not found",
                  code: "NOT_FOUND",
                  statusCode: 404,
                },
              };
            }
            return {
              success: true,
              message: "Transfer details",
              data: transfer,
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
          params: TransferModel.transferParams,
          response: {
            200: TransferModel.getTransferByIdResponse,
            404: TransferModel.errorResponse,
            400: TransferModel.errorResponse,
            401: TransferModel.errorResponse,
            500: TransferModel.errorResponse,
          },
          detail: {
            tags: ["Transfer"],
            summary: "Get Transfer By ID",
            description: "Get detailed information about a specific transfer.",
          },
        },
      )
  )

  // Receive Transfer (Manage)
  .group("", (app) =>
    app
      .use(permissionMiddleware("transfer.manage"))
      .post(
        "/:id/receive",
        async (context) => {
          const { params, user, set } = context;
          try {
            const { id } = params;
            const userId = user.id;
            const result = await TransferService.receiveTransfer(id, userId);
            return {
              success: true,
              message: "Transfer received successfully",
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
          params: TransferModel.transferParams,
          response: {
            200: TransferModel.receiveTransferResponse,
            400: TransferModel.errorResponse,
            401: TransferModel.errorResponse,
            404: TransferModel.errorResponse,
            500: TransferModel.errorResponse,
          },
          detail: {
            tags: ["Transfer"],
            summary: "Receive Transfer",
            description:
              "Accept and finalize an incoming card transfer at the destination station.",
          },
        },
      )
  );
