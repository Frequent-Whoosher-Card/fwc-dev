import { Elysia } from "elysia";
import { formatErrorResponse } from "../../../utils/errors";
import { CardInventoryModel } from "./model";
import { CardInventoryService } from "./service";
import { authMiddleware } from "../../../middleware/auth";
import { permissionMiddleware } from "../../../middleware/permission";

const createInventoryRoutes = (app: Elysia) =>
  app
    .use(authMiddleware)
    .use(permissionMiddleware("inventory.view"))
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
          programType,
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
          summary: "Get Station Inventory Monitor",
          description:
            "Mendapatkan data inventory per stasiun untuk monitoring (Card Beredar, Aktif, Non Aktif, Total, Belum Terjual).",
        },
      },
    )
    // Get Stock Configuration (Thresholds)
    .get(
      "/config",
      () => {
        return {
          success: true,
          data: {
            minStockThreshold: 50, // Default Hardlimit
            lowStockWarning: 100, // Default Warning
          },
        };
      },
      {
        response: {
          200: CardInventoryModel.stockConfigResponse,
          500: CardInventoryModel.errorResponse,
        },
        detail: {
          tags: ["Stock All & Inventory"],
          summary: "Get Stock Configuration",
          description:
            "Mendapatkan konfigurasi batas aman stok (Threshold) untuk keperluan UI/Warning.",
        },
      },
    )
    // Get Low Stock Alerts (Global)
    .get(
      "/alerts",
      async (context) => {
        const { set } = context;
        try {
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
        const { programType } = query as any;
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
          summary: "Get All Card Inventory",
          description:
            "Mendapatkan agregat seluruh stok per kategori, tipe, dan stasiun. Gunakan ?programType=FWC atau VOUCHER untuk filter.",
        },
      },
    )
    // Get Office Stock
    .get(
      "/office",
      async (context) => {
        const { query, set } = context;
        const { programType } = query as any;
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
          171: CardInventoryModel.errorResponse,
        },
        detail: {
          tags: ["Stock All & Inventory"],
          summary: "Get Office Stock",
          description:
            "Mendapatkan stok kartu yang ada di Office. Gunakan ?programType=FWC atau VOUCHER untuk filter.",
        },
      },
    )
    // Get Total Summary (All Card)
    .get(
      "/total-summary",
      async (context) => {
        const { set, query } = context;
        const { programType } = query as any;

        try {
          const result = await CardInventoryService.getTotalSummary(
            programType as "FWC" | "VOUCHER" | undefined,
          );
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
        query: CardInventoryModel.getCategoryTypeSummaryQuery, // Use generic query to allow programType (although summary schema is simpler)
        // Ideally we should have a specific query model for summary if it only takes programType,
        // reusing getCategoryTypeSummaryQuery is okay as it has programType.
        response: {
          200: CardInventoryModel.getTotalSummaryResponse,
          500: CardInventoryModel.errorResponse,
        },
        detail: {
          tags: ["Stock All & Inventory"],
          summary: "Get Total Card Summary",
          description:
            "Mendapatkan total kartu yang beredar & kartu yang hilang atau rusak. Gunakan ?programType=FWC atau VOUCHER untuk filter.",
        },
      },
    )
    // Get Station Summary
    .get(
      "/stock-summary",
      async (context) => {
        const { set, query } = context;
        const { programType } = query as any;
        try {
          const result = await CardInventoryService.getStationSummary(
            programType as "FWC" | "VOUCHER" | undefined,
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
        query: CardInventoryModel.getCategoryTypeSummaryQuery, // Reusing to get programType
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
          description:
            "Mendapatkan perhitungan stok di office dan stasiun. Gunakan ?programType=FWC atau VOUCHER untuk filter.",
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
          search,
          programType,
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
            search,
            programType: programType as "FWC" | "VOUCHER" | undefined,
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
            "Mendapatkan rekapitulasi stok (Office, Station, Active, etc.) per Kategori dan Tipe. Gunakan ?programType=FWC atau VOUCHER untuk filter.",
        },
      },
    )
    // Get Combined Summary (Total + Category/Type)
    .get(
      "/combined-summary",
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
          search,
          programType,
        } = query as any;

        try {
          const result = await CardInventoryService.getCombinedSummary({
            stationId,
            categoryId,
            typeId,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            categoryName,
            typeName,
            stationName,
            search,
            programType: programType as "FWC" | "VOUCHER" | undefined,
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
          200: CardInventoryModel.getCombinedSummaryResponse,
          400: CardInventoryModel.errorResponse,
          500: CardInventoryModel.errorResponse,
        },
        detail: {
          tags: ["Stock All & Inventory"],
          summary: "Get Combined Summary",
          description:
            "Mendapatkan rekapitulasi total dan per kategori/tipe dengan pemisahan In Transfer. Gunakan ?programType=FWC atau VOUCHER untuk filter.",
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

export const cardInventory = new Elysia({ prefix: "/inventory" }).use(
  createInventoryRoutes,
);
