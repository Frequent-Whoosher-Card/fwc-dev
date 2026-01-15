import { Elysia, t } from "elysia";
import { TransferService } from "./service";
import { TransferModel } from "./model";
import { authMiddleware } from "../../../middleware/auth";
import { formatErrorResponse } from "../../../utils/errors";

export const transfers = new Elysia({ prefix: "/transfers" })
  .use(authMiddleware)

  // Create Transfer
  .post(
    "/",
    async (context) => {
      const { body, user, set } = context;
      try {
        const { stationId, toStationId, categoryId, typeId, quantity, note } =
          body;
        const userId = user.id;

        const movement = await TransferService.createTransfer({
          stationId,
          toStationId,
          categoryId,
          typeId,
          quantity,
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
    }
  )

  // Get Transfers
  .get(
    "/",
    async (context) => {
      const { query, set } = context;
      try {
        const { stationId, status } = query;
        const transfers = await TransferService.getTransfers({
          stationId,
          status: status as any,
        });
        return {
          success: true,
          message: "Transfers retrieved",
          data: transfers,
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
    }
  )

  // Get Transfer By ID
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
            message: "Transfer not found",
            data: null,
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
    }
  )

  // Receive Transfer
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
    }
  );
