import { Elysia } from "elysia";
import { SupersetService } from "./service";

export const superset = new Elysia({ prefix: "/superset" })
  .get("/admin-token", async () => {
    try {
      const token = await SupersetService.getAdminToken();
      return {
        success: true,
        token: token,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || "Failed to get admin token",
      };
    }
  })
  .get("/guest-token", async ({ query, set }) => {
    try {
      const dashboardId = query.dashboardId as string;

      if (!dashboardId) {
        set.status = 400;
        return {
          success: false,
          message: "dashboardId required",
        };
      }

      const token = await SupersetService.createGuestToken(dashboardId);

      return {
        success: true,
        token,
      };
    } catch (err: any) {
      set.status = 500;
      return {
        success: false,
        message: err?.message ?? "Failed to generate guest token",
      };
    }
  });