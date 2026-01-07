import { Elysia } from "elysia";
import { SupersetService } from "./service";

export const superset = new Elysia({ prefix: "/superset" })
  .get("/guest-token", async ({ query }) => {
    const dashboardId = query.dashboardId as string;

    if (!dashboardId) {
      return { success: false, message: "dashboardId required" };
    }

    const token = await SupersetService.createGuestToken(dashboardId);
    return { success: true, token };
  });
