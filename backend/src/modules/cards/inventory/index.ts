import { Elysia } from "elysia";
import { formatErrorResponse } from "../../../utils/errors";
import { CardInventoryModel } from "./model";
import { CardInventoryService } from "./service";

export const cardInventory = new Elysia({ prefix: "/cards/inventory" }).group(
  "",
  (app) =>
    app
      .get(
        "/",
        async (context) => {
          const { query, set } = context;
          try {
            const result = await CardInventoryService.getAll({
              page: query.page ? parseInt(query.page) : undefined,
              limit: query.limit ? parseInt(query.limit) : undefined,
              categoryId: query.categoryId,
              typeId: query.typeId,
              stationId: query.stationId,
              search: query.search,
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
          query: CardInventoryModel.getInventoryQuery,
          response: {
            200: CardInventoryModel.getInventoryListResponse,
            500: CardInventoryModel.errorResponse,
          },
          detail: {
            tags: ["Inventory"],
            summary: "Get All Card Inventory",
            description:
              "Get aggregated stock of cards grouped by Category, Type, and Station.",
          },
        }
      )
      .get(
        "/:id",
        async (context) => {
          const { params, set } = context;
          try {
            const result = await CardInventoryService.getById(params.id);
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
            200: CardInventoryModel.getInventoryDetailResponse,
            404: CardInventoryModel.errorResponse,
            500: CardInventoryModel.errorResponse,
          },
          detail: {
            tags: ["Inventory"],
            summary: "Get Inventory Detail",
          },
        }
      )
);
