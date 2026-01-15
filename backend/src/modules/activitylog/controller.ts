
import { Elysia, t } from "elysia";
import { logActivity, getActivityLogs } from "./service";
import { authMiddleware } from "../../middleware/auth";
import { formatErrorResponse } from "../../utils/errors";

export const activityLogModule = new Elysia({ prefix: "/activity-log" })
  .use(authMiddleware)
  .get(
    "/",
    async ({ query, set }) => {
      try {
        const page = query.page ? parseInt(query.page as string) : 1;
        const limit = query.limit ? parseInt(query.limit as string) : 50;
        const userId = query.userId as string | undefined;
        const logs = await getActivityLogs({ userId, page, limit });
        return { success: true, data: logs };
      } catch (error) {
        set.status = 500;
        return formatErrorResponse(error);
      }
    },
    {
      query: t.Object({
        userId: t.Optional(t.String({ format: "uuid" })),
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
    }
  )
  .post(
    "/",
    async ({ body, user, set }) => {
      try {
        const { action, description } = body;
        const userId = user.id;
        const log = await logActivity({ userId, action, description, createdBy: userId });
        return { success: true, data: log };
      } catch (error) {
        set.status = 500;
        return formatErrorResponse(error);
      }
    },
    {
      body: t.Object({
        action: t.String(),
        description: t.Optional(t.String()),
      }),
    }
  );
