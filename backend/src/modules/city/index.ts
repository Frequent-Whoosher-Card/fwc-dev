import { Elysia, t } from "elysia";
import { authMiddleware } from "../../middleware/auth";
import { permissionMiddleware } from "../../middleware/permission";
import { formatErrorResponse } from "../../utils/errors";
import db from "../../config/db";

export const city = new Elysia({ prefix: "/city" })
  .use(authMiddleware)
  .use(permissionMiddleware("member.view"))
  .get(
    "/",
    async (context) => {
      const { set } = context;
      try {
        const list = await db.city.findMany({
          orderBy: { name: "asc" },
          select: { id: true, name: true },
        });
        return {
          success: true,
          data: list,
        };
      } catch (error) {
        set.status = 500;
        return formatErrorResponse(error);
      }
    },
    {
      response: {
        200: t.Object({
          success: t.Boolean(),
          data: t.Array(
            t.Object({
              id: t.String({ format: "uuid" }),
              name: t.String(),
            })
          ),
        }),
        500: t.Object({
          success: t.Boolean(),
          error: t.Object({
            message: t.String(),
            code: t.String(),
            statusCode: t.Number(),
          }),
        }),
      },
      detail: {
        tags: ["City"],
        summary: "Get all cities",
        description: "List all kota/kabupaten for dropdowns (e.g. create member)",
      },
    }
  );
