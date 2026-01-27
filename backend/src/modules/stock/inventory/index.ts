import { Elysia } from "elysia";
import { formatErrorResponse } from "../../../utils/errors";
import { CardInventoryModel } from "./model";
import { CardInventoryService } from "./service";
import { authMiddleware } from "src/middleware/auth";

const createInventoryRoutes =
  (programType?: "FWC" | "VOUCHER") => (app: Elysia) =>
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
          } = query as any;

          const data = await CardInventoryService.getStationInventoryMonitor({
            stationId,
            categoryId,
            typeId,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            categoryName,
            typeName,
            stationName,
            programType,
          });
          return {
            success: true,
            data,
          };
        },
        {
          query: CardInventoryModel.getInventoryListQuery,
          response: {
            200: CardInventoryModel.getStationInventoryMonitorResponse,
            400: CardInventoryModel.errorResponse,
            500: CardInventoryModel.errorResponse,
          },
          detail: {
            tags: ["Stock All & Inventory"],
            summary: `Get Station Inventory Monitor ${programType ? `(${programType})` : ""}`,
            description:
              "Mendapatkan data inventory per stasiun untuk monitoring (Card Beredar, Aktif, Non Aktif, Total, Belum Terjual).",
          },
        },
      )
      // Get Low Stock Alerts (Global? Or Filtered? Service doesn't filter yet. Assuming Global for now if not updated)
      // If programType is provided, we might want to filter, but service.getLowStockAlerts() wasn't updated.
      // Keeping it only on Root or just exposing it as is (Global).
      .get(
        "/alerts",
        async (context) => {
          const { set } = context;
          try {
            // TODO: Update getLowStockAlerts to support programType if needed
            const result = await CardInventoryService.getLowStockAlerts();
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
          detail: {
            tags: ["Stock All & Inventory"],
            summary: "Get Inventory Alerts",
            description:
              "Mendapatkan notifikasi stok menipis (Mirror of Stock Alerts).",
          },
        },
      )
      // Get Inventory List
      .get(
        "/",
        async (context) => {
          const { query, set } = context;
          try {
            const result = await CardInventoryService.getAll({
              page: query.page ? parseInt(query.page as string) : undefined,
              limit: query.limit ? parseInt(query.limit as string) : undefined,
              categoryId: query.categoryId as string,
              typeId: query.typeId as string,
              stationId: query.stationId as string,
              search: query.search as string,
              categoryName: query.categoryName as string,
              typeName: query.typeName as string,
              stationName: query.stationName as string,
              programType,
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
            summary: `Get All Card Inventory ${programType ? `(${programType})` : ""}`,
            description:
              "Mendapatkan agregat seluruh stok per kategori, tipe, dan stasiun.",
          },
        },
      )
      // Get Office Stock
      .get(
        "/office",
        async (context) => {
          const { query, set } = context;
          try {
            const result = await CardInventoryService.getOfficeStock({
              page: query.page ? parseInt(query.page as string) : undefined,
              limit: query.limit ? parseInt(query.limit as string) : undefined,
              categoryId: query.categoryId as string,
              typeId: query.typeId as string,
              search: query.search as string,
              categoryName: query.categoryName as string,
              typeName: query.typeName as string,
              programType,
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
            summary: `Get Office Stock ${programType ? `(${programType})` : ""}`,
            description:
              "Mendapatkan stok kartu yang ada di Office (Stasiun yang tidak terassign).",
          },
        },
      )
      // Get Total Summary (All Card)
      .get(
        "/total-summary",
        async (context) => {
          const { set } = context;
          try {
            const result =
              await CardInventoryService.getTotalSummary(programType);
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
            summary: `Get Total Card Summary ${programType ? `(${programType})` : ""}`,
            description:
              "Mendapatkan total kartu yang beredar & kartu yang hilang atau rusak",
          },
        },
      )
      // Get Station Summary
      .get(
        "/stock-summary",
        async (context) => {
          const { set } = context;
          try {
            const result =
              await CardInventoryService.getStationSummary(programType);
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
            summary: `Get Stock Summary ${programType ? `(${programType})` : ""}`,
            description: "Mendapatkan perhitungan stok di office dan stasiun.",
          },
        },
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
          } = query as any;

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
              programType,
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
            summary: `Get Summary by Category & Type ${programType ? `(${programType})` : ""}`,
            description:
              "Mendapatkan rekapitulasi stok (Office, Station, Active, etc.) per Kategori dan Tipe.",
          },
        },
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
        },
      );

export const cardInventory = new Elysia({ prefix: "/inventory" })
  // Root routes (All)
  .use(createInventoryRoutes())
  // FWC routes
  .group("/fwc", (app) => app.use(createInventoryRoutes("FWC")))
  // Voucher routes
  .group("/voucher", (app) => app.use(createInventoryRoutes("VOUCHER")));
