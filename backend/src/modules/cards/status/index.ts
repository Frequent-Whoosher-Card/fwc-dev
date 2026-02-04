import { Elysia } from "elysia";
import { authMiddleware } from "../../../middleware/auth";
import { formatErrorResponse } from "../../../utils/errors";
import { CardStatusModel } from "./model";
import { CardStatusService } from "./service";

export const cardStatusRoutes = new Elysia({ prefix: "/card/statuses" })
  .use(authMiddleware)
  .get(
    "/",
    async ({ set }) => {
      try {
        const statuses = CardStatusService.getAllStatuses();
        return {
          success: true,
          data: statuses,
        };
      } catch (error) {
        set.status = 500;
        return formatErrorResponse(error);
      }
    },
    {
      response: {
        200: CardStatusModel.getCardStatusesResponse,
        500: CardStatusModel.errorResponse,
      },
      detail: {
        tags: ["Card Status"],
        summary: "Get all card statuses",
      },
    },
  )
  .get(
    "/editable",
    async ({ set }) => {
      try {
        const statuses = CardStatusService.getEditableStatuses();
        return {
          success: true,
          data: statuses,
        };
      } catch (error) {
        set.status = 500;
        return formatErrorResponse(error);
      }
    },
    {
      response: {
        200: CardStatusModel.getCardStatusesResponse,
        500: CardStatusModel.errorResponse,
      },
      detail: {
        tags: ["Card Status"],
        summary: "Get editable card statuses (excluding transit/request)",
      },
    },
  );
