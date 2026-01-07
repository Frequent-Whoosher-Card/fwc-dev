import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { SupersetService } from "./service";

export const superset = new Elysia({ prefix: "/superset" })
  .use(
    jwt({
      name: "jwt",
      secret: process.env.GUEST_TOKEN_JWT_SECRET!,
    })
  )
  .get("/guest-token", async ({ query }) => {
    const dashboardId = query.dashboardId as string;

    if (!dashboardId) {
      return {
        success: false,
        message: "dashboardId is required",
      };
    }

    const token = await SupersetService.createGuestToken(
      null, // jwtSigner tidak dipakai karena Superset generate token
      dashboardId,
      process.env.SUPERSET_ADMIN_ACCESS_TOKEN!
    );

    return {
      success: true,
      token,
    };
  });
