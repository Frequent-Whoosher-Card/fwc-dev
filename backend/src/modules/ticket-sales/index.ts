import { Elysia } from "elysia";
import { TicketSalesModel } from "./model";
import { TicketSalesService } from "./service";
import { rbacMiddleware } from "../../middleware/rbac";
import { formatErrorResponse } from "../../utils/errors";

// Admin routes - Only admin and superadmin can import
const adminRoutes = new Elysia()
  .use(rbacMiddleware(["admin", "superadmin"]))
  .post(
    "/import",
    async ({ body, set }) => {
      try {
        const result = await TicketSalesService.importFromExcel(body.file);

        return {
          success: true,
          message: "Ticket sales data imported successfully",
          data: result,
        };
      } catch (error: any) {
        set.status = 500;
        return formatErrorResponse(error);
      }
    },
    {
      body: TicketSalesModel.importExcelBody,
      response: {
        200: TicketSalesModel.importResponse,
        500: TicketSalesModel.errorResponse,
      },
      detail: {
        tags: ["Ticket Sales"],
        summary: "Import ticket sales from Excel",
        description:
          "Upload Excel file containing ticket sales report and import to database using PostgreSQL COPY command",
      },
    },
  );

// Base routes - All authenticated users can view stats
const baseRoutes = new Elysia()
  .use(rbacMiddleware(["petugas", "supervisor", "admin", "superadmin"]))
  .get(
    "/stats",
    async ({ set }) => {
      try {
        const stats = await TicketSalesService.getStats();

        return {
          success: true,
          data: stats,
        };
      } catch (error: any) {
        set.status = 500;
        return formatErrorResponse(error);
      }
    },
    {
      response: {
        200: TicketSalesModel.statsResponse,
        500: TicketSalesModel.errorResponse,
      },
      detail: {
        tags: ["Ticket Sales"],
        summary: "Get ticket sales statistics",
        description: "Retrieve aggregated statistics from ticket sales data",
      },
    },
  );

// Combine all routes
export const ticketSalesImport = new Elysia({ prefix: "/api/ticket-sales" })
  .use(baseRoutes)
  .use(adminRoutes);
