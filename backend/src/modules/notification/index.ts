import { Elysia, t } from "elysia";
import { authMiddleware } from "../../middleware/auth";
import { NotificationService } from "./service";

export const notificationRoutes = new Elysia({ prefix: "/notification" })
  .use(authMiddleware)
  .post(
    "/token",
    async ({ body, user, set }) => {
      const { token, deviceInfo } = body;

      if (!token) {
        set.status = 400;
        return { message: "Token is required" };
      }

      try {
        await NotificationService.updateToken(user.id, token, deviceInfo);
        
        return {
          success: true,
          message: "FCM Token registered successfully",
        };
      } catch (error) {
        console.error("Error saving FCM token:", error);
        set.status = 500;
        return { message: "Internal server error" };
      }
    },
    {
      body: t.Object({
        token: t.String(),
        deviceInfo: t.Optional(t.String()),
      }),
      detail: {
        summary: "Register FCM Token",
        tags: ["Notification"],
      },
    }
  );
