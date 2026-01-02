import { Elysia, t } from "elysia";
import { authMiddleware } from "../../middleware/auth";
import { formatErrorResponse } from "../../utils/errors";
import { InboxService } from "./service";
import { InboxModel } from "./model";
import { rbacMiddleware } from "src/middleware/rbac";

type AuthContextUser = {
  user: {
    id: string;
    username: string;
    fullName: string;
    email: string | null;
    role: {
      id: string;
      roleCode: string;
      roleName: string;
    };
  };
};

export const inbox = new Elysia({ prefix: "/inbox" })
  .use(authMiddleware)
  .use(rbacMiddleware(["admin", "superadmin"]))
  .post(
    "/check-low-stock",
    async (context) => {
      const { user, set } = context as typeof context & AuthContextUser;
      try {
        const result = await InboxService.checkLowStockAndAlert(user.id);
        return {
          success: true,
          message: "Pengecekan stok selesai",
          data: result,
        };
      } catch (error) {
        set.status = 500;
        return formatErrorResponse(error);
      }
    },
    {
      detail: {
        tags: ["Inbox"],
        summary: "Trigger Low Stock Check",
        description:
          "Memicu pengecekan stok menipis dan mengirim notifikasi jika ada.",
      },
      response: {
        200: InboxModel.lowStockResponse,
        400: InboxModel.errorResponse,
        401: InboxModel.errorResponse,
        403: InboxModel.errorResponse,
        404: InboxModel.errorResponse,
        409: InboxModel.errorResponse,
        422: InboxModel.errorResponse,
        500: InboxModel.errorResponse,
      },
    }
  )
  .get(
    "/",
    async (context) => {
      const { user, query, set } = context as typeof context & {
        user: { id: string };
        query: { page?: string; limit?: string; isRead?: string };
      };
      try {
        const result = await InboxService.getUserInbox(user.id, {
          page: query.page ? parseInt(query.page) : undefined,
          limit: query.limit ? parseInt(query.limit) : undefined,
          isRead:
            query.isRead === "true"
              ? true
              : query.isRead === "false"
                ? false
                : undefined,
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
      query: InboxModel.getInboxQuery,
      response: {
        200: InboxModel.getInboxResponse,
        400: InboxModel.errorResponse,
        401: InboxModel.errorResponse,
        403: InboxModel.errorResponse,
        404: InboxModel.errorResponse,
        409: InboxModel.errorResponse,
        422: InboxModel.errorResponse,
        500: InboxModel.errorResponse,
      },
      detail: {
        tags: ["Inbox"],
        summary: "Get User Inbox",
        description:
          "Mendapatkan daftar pesan/notifikasi user yang sedang login.",
      },
    }
  )
  .patch(
    "/:id/read",
    async (context) => {
      const { user, params, set } = context as typeof context & {
        user: { id: string };
        params: { id: string };
      };
      try {
        await InboxService.markAsRead(params.id, user.id);
        return {
          success: true,
          message: "Pesan ditandai sudah dibaca",
        };
      } catch (error) {
        set.status = 400;
        return formatErrorResponse(error);
      }
    },
    {
      response: {
        200: InboxModel.markReadResponse,
        400: InboxModel.errorResponse,
        401: InboxModel.errorResponse,
        403: InboxModel.errorResponse,
        404: InboxModel.errorResponse,
        409: InboxModel.errorResponse,
        422: InboxModel.errorResponse,
        500: InboxModel.errorResponse,
      },
      detail: {
        tags: ["Inbox"],
        summary: "Mark Inbox as Read",
      },
    }
  );
