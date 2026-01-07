import { Elysia } from "elysia";
import { formatErrorResponse } from "../../../utils/errors";
import { CardInventoryModel } from "./model";
import { CardInventoryService } from "./service";
import { authMiddleware } from "src/middleware/auth";

export const cardInventory = new Elysia({ prefix: "/inventory" }).group(
  "",
  (app) =>
    app
      .use(authMiddleware)
      // Get Station Inventory Monitor
      .get(
        "/station-monitor",
        async ({ query }) => {
          const {
            stationId,
            categoryId,
            typeId,
            startDate,
            endDate,
            categoryName,
            typeName,
            stationName,
          } = query as {
            stationId?: string;
            categoryId?: string;
            typeId?: string;
            startDate?: string;
            endDate?: string;
            categoryName?: string;
            typeName?: string;
            stationName?: string;
          };

          const data = await CardInventoryService.getStationInventoryMonitor({
            stationId,
            categoryId,
            typeId,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            categoryName,
            typeName,
            stationName,
          });
          return {
            success: true,
            data,
          };
        },
        {
          query: CardInventoryModel.getInventoryListQuery, // Reuse query param if needed (supports stationId)
          response: {
            200: CardInventoryModel.getStationInventoryMonitorResponse,
            400: CardInventoryModel.errorResponse,
            500: CardInventoryModel.errorResponse,
          },
          detail: {
            tags: ["Stock All & Inventory"],
            summary: "Get Station Inventory Monitor",
            description:
              "Mendapatkan data inventory per stasiun untuk monitoring (Card Beredar, Aktif, Non Aktif, Total, Belum Terjual).",
          },
        }
      )
      // Get Inventory List
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
              categoryName: query.categoryName,
              typeName: query.typeName,
              stationName: query.stationName,
            });
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
          query: CardInventoryModel.getInventoryListQuery,
          response: {
            200: CardInventoryModel.getInventoryListResponse,
            400: CardInventoryModel.errorResponse,
            401: CardInventoryModel.errorResponse,
            403: CardInventoryModel.errorResponse,
            404: CardInventoryModel.errorResponse,
            409: CardInventoryModel.errorResponse,
            422: CardInventoryModel.errorResponse,
            500: CardInventoryModel.errorResponse,
          },
          detail: {
            tags: ["Stock All & Inventory"],
            summary: "Get All Card Inventory",
            description:
              "Mendapatkan agregat seluruh stok per kategori, tipe, dan stasiun.",
          },
        }
      )
      // Get Office Stock
      .get(
        "/office",
        async (context) => {
          const { query, set } = context;
          try {
            const result = await CardInventoryService.getOfficeStock({
              page: query.page ? parseInt(query.page) : undefined,
              limit: query.limit ? parseInt(query.limit) : undefined,
              categoryId: query.categoryId,
              typeId: query.typeId,
              search: query.search,
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
          query: CardInventoryModel.getOfficeStockQuery,
          response: {
            200: CardInventoryModel.getInventoryListResponse,
            400: CardInventoryModel.errorResponse,
            401: CardInventoryModel.errorResponse,
            403: CardInventoryModel.errorResponse,
            404: CardInventoryModel.errorResponse,
            409: CardInventoryModel.errorResponse,
            422: CardInventoryModel.errorResponse,
            500: CardInventoryModel.errorResponse,
          },
          detail: {
            tags: ["Stock All & Inventory"],
            summary: "Get Office Stock",
            description:
              "Mendapatkan stok kartu yang ada di Office (Stasiun yang tidak terassign).",
          },
        }
      )
      // Get Total Summary (All Card)
      .get(
        "/total-summary",
        async (context) => {
          const { set } = context;
          try {
            const result = await CardInventoryService.getTotalSummary();
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
          response: {
            200: CardInventoryModel.getTotalSummaryResponse,
            500: CardInventoryModel.errorResponse,
          },
          detail: {
            tags: ["Stock All & Inventory"],
            summary: "Get Total Card Summary",
            description:
              "Mendapatkan total kartu yang beredar & kartu yang hilang atau rusak",
          },
        }
      )
      // Get Station Summary
      .get(
        "/stock-summary",
        async (context) => {
          const { set } = context;
          try {
            const result = await CardInventoryService.getStationSummary();
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
            200: CardInventoryModel.getStationSummaryResponse,
            400: CardInventoryModel.errorResponse,
            401: CardInventoryModel.errorResponse,
            403: CardInventoryModel.errorResponse,
            404: CardInventoryModel.errorResponse,
            409: CardInventoryModel.errorResponse,
            422: CardInventoryModel.errorResponse,
            500: CardInventoryModel.errorResponse,
          },
          detail: {
            tags: ["Stock All & Inventory"],
            summary: "Get Stock Summary",
            description: "Mendapatkan perhitungan stok di office dan stasiun.",
          },
        }
      )
      // Get Summary by Category & Type
      .get(
        "/category-type-summary",
        async (context) => {
          const { set, query } = context;
          const {
            stationId,
            categoryId,
            typeId,
            startDate,
            endDate,
            categoryName,
            typeName,
            stationName,
          } = query as {
            stationId?: string;
            categoryId?: string;
            typeId?: string;
            startDate?: string;
            endDate?: string;
            categoryName?: string;
            typeName?: string;
            stationName?: string;
          };

          try {
            const result = await CardInventoryService.getCategoryTypeSummary({
              stationId,
              categoryId,
              typeId,
              startDate: startDate ? new Date(startDate) : undefined,
              endDate: endDate ? new Date(endDate) : undefined,
              categoryName,
              typeName,
              stationName,
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
          query: CardInventoryModel.getCategoryTypeSummaryQuery,
          response: {
            200: CardInventoryModel.getCategoryTypeSummaryResponse,
            400: CardInventoryModel.errorResponse,
            401: CardInventoryModel.errorResponse,
            403: CardInventoryModel.errorResponse,
            404: CardInventoryModel.errorResponse,
            409: CardInventoryModel.errorResponse,
            422: CardInventoryModel.errorResponse,
            500: CardInventoryModel.errorResponse,
          },
          detail: {
            tags: ["Stock All & Inventory"],
            summary: "Get Summary by Category & Type",
            description:
              "Mendapatkan rekapitulasi stok (Office, Station, Active, etc.) per Kategori dan Tipe.",
          },
        }
      )
      // Get Inventory Detail
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
            400: CardInventoryModel.errorResponse,
            401: CardInventoryModel.errorResponse,
            403: CardInventoryModel.errorResponse,
            404: CardInventoryModel.errorResponse,
            409: CardInventoryModel.errorResponse,
            422: CardInventoryModel.errorResponse,
            500: CardInventoryModel.errorResponse,
          },
          detail: {
            tags: ["Stock All & Inventory"],
            summary: "Get Inventory Detail",
          },
        }
      )
);
