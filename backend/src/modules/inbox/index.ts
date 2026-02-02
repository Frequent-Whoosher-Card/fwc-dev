import { Elysia, t } from "elysia";
import db from "../../config/db";
import { authMiddleware } from "../../middleware/auth";
import { formatErrorResponse } from "../../utils/errors";
import { InboxService } from "./service";
import { InboxModel } from "./model";
import { permissionMiddleware } from "../../middleware/permission";

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
      .use(permissionMiddleware("inbox.view"))
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
              programType?: string; // Added programType
              search?: string; // Added search
              status?: string; // Added status
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
              programType: query.programType, // Pass programType
              search: query.search, // Pass search
              status: query.status, // Pass status
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
            description: `Mendapatkan daftar pesan/notifikasi untuk admin properti (Admin & Superadmin).

**Tipe Pesan yang Tersedia:**

1. **STOCK_ISSUE_APPROVAL**
   - **Deskripsi**: Laporan validasi stock out yang **bermasalah** (ada kartu Hilang atau Rusak).
   - **Pemicu**: Supervisor memvalidasi stock out dan ada kartu hilang/rusak.
   - **Payload**: Berisi \`lostSerialNumbers\` dan \`damagedSerialNumbers\`.
   - **Action**: Perlu Approval via endpoint \`POST /inbox/:id/approve-issue\`.

2. **STOCK_OUT_REPORT**
   - **Deskripsi**: Laporan validasi stock out sukses (semua kartu diterima).
   - **Pemicu**: Supervisor memvalidasi stock out semua barang diterima.
   - **Action**: Hanya notifikasi (Read Only).

3. **LOW_STOCK** (Hidden)
   - **Deskripsi**: Peringatan stok menipis (< Threshold).
   - **Catatan**: Secara default difilter keluar dari endpoint ini agar tidak spamming.`,
          },
        },
      )
      .get(
        "/:id",
        async (context) => {
          const { user, params, set } = context as typeof context & {
            user: { id: string };
            params: { id: string };
          };
          try {
            const result = await InboxService.getInboxDetail(
              params.id,
              user.id,
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
          response: {
            200: InboxModel.getInboxDetailResponse,
            400: InboxModel.errorResponse,
            404: InboxModel.errorResponse,
            500: InboxModel.errorResponse,
          },
          detail: {
            tags: ["Inbox"],
            summary: "Get Inbox Detail",
            description:
              "Mendapatkan detail pesan inbox secara lengkap termasuk informasi pengirim (role) dan payload.",
          },
        },
      )
      .get(
        "/supervisor-noted-history",
        async (context) => {
          const { query, set } = context;
          try {
            const result = await InboxService.getSupervisorNotedHistory({
              page: query.page ? parseInt(query.page) : undefined,
              limit: query.limit ? parseInt(query.limit) : undefined,
              startDate: query.startDate,
              endDate: query.endDate,
              status: query.status,
              programType: query.programType,
              search: query.search,
              stationId: query.stationId,
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
          query: InboxModel.getSupervisorNotedHistoryQuery,
          response: {
            200: InboxModel.getSupervisorInboxResponse, // Reusing response schema as it's identical
            500: InboxModel.errorResponse,
          },
          detail: {
            tags: ["Inbox"],
            summary: "Get Supervisor Noted History (Global)",
            description:
              "Melihat history Noted Supervisor secara global (untuk Superadmin).",
          },
        },
      )
      .get(
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
              programType: query.programType, // Pass programType
              search: query.search, // Pass search
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
        },
      ),
  )
  .group("", (app) =>
    app.use(permissionMiddleware("inbox.approve")).post(
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
            user.id,
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
          description: `Memproses laporan kartu hilang/rusak (Tipe: STOCK_ISSUE_APPROVAL).

**Prasyarat:**
- User harus Admin/Superadmin.
- Inbox ID harus valid dan bertipe \`STOCK_ISSUE_APPROVAL\`.
- Belum pernah diproses sebelumnya.

**Body Parameter:**
- \`action\`:
  - \`"APPROVE"\`: Menyetujui laporan. Kartu akan diupdate statusnya menjadi **LOST** atau **DAMAGED**.
  - \`"REJECT"\`: Menolak laporan. Status kartu tidak berubah (akan tetap seperti status terakhir, misal \`IN_TRANSIT\` atau \`IN_STATION\`).

**Hasil:**
Setelah sukses, pesan inbox akan otomatis ditandai sebagai **Sudah Dibaca** dan tidak bisa diproses ulang.`,
        },
      },
    ),
  )
  .group("", (app) =>
    app.use(permissionMiddleware("inbox.notif")).post(
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
      },
    ),
  )
  .group("", (app) =>
    app.use(permissionMiddleware("inbox.edit")).patch(
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
      },
    ),
  );
