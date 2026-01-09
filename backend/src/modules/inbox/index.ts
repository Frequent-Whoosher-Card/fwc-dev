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
  .group("", (app) =>
    app
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
            query: {
              page?: string;
              limit?: string;
              isRead?: string;
              startDate?: string;
              endDate?: string;
              type?: string;
            };
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
              startDate: query.startDate,
              endDate: query.endDate,
              type: query.type,
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
          query: InboxModel.getInboxQuery, // Ensure this model is updated or use t.Optional for new fields if not strict
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
            summary: "Get Admin Inbox",
            description:
              "Mendapatkan daftar pesan/notifikasi. Mendukung filter tanggal dan tipe.",
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
      )
      .post(
        "/:id/approve-issue",
        async (context) => {
          const { user, params, body, set } = context as typeof context & {
            user: { id: string };
            params: { id: string };
            body: { action: "APPROVE" | "REJECT" };
          };
          try {
            const result = await InboxService.processStockIssueApproval(
              params.id,
              body.action,
              user.id
            );
            return {
              success: true,
              message: `Permintaan telah diproses: ${body.action}`,
              data: result,
            };
          } catch (error) {
            set.status = 400; // Or 422
            return formatErrorResponse(error);
          }
        },
        {
          body: t.Object({
            action: t.Union([t.Literal("APPROVE"), t.Literal("REJECT")]),
          }),
          response: {
            // 200: InboxModel.processApprovalResponse (Create this if strict typing needed, or use generic success)
            // For now using generic error response mapping
            400: InboxModel.errorResponse,
            401: InboxModel.errorResponse,
            403: InboxModel.errorResponse,
            404: InboxModel.errorResponse,
            500: InboxModel.errorResponse,
          },
          detail: {
            tags: ["Inbox"],
            summary: "Approve/Reject Stock Issue",
            description:
              "Memproses laporan kartu hilang/rusak yang masuk ke inbox approval.",
          },
        }
      )
  )
  .group("", (app) =>
    app.use(rbacMiddleware(["supervisor"])).get(
      "/sent-by-supervisor",
      async (context) => {
        const { query, set } = context;
        try {
          const result = await InboxService.getMessagesSentBySupervisors({
            page: query.page ? parseInt(query.page) : undefined,
            limit: query.limit ? parseInt(query.limit) : undefined,
            startDate: query.startDate,
            endDate: query.endDate,
            status: query.status,
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
        // Reuse query schema as it fits basic pagination
        query: InboxModel.getSupervisorInboxQuery, // Create new query model
        response: {
          200: InboxModel.getSupervisorInboxResponse,
          500: InboxModel.errorResponse,
        },
        detail: {
          tags: ["Inbox"],
          summary: "Get Messages Sent By Supervisors",
          description: "Melihat pesan yang dikirim oleh peran Supervisor.",
        },
      }
    )
  );
