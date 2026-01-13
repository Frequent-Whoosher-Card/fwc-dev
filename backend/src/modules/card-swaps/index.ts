import { Elysia, t } from "elysia";
import { CardSwapModel } from "./model";
import { CardSwapService } from "./service";
import { rbacMiddleware } from "../../middleware/rbac";
import { formatErrorResponse } from "../../utils/errors";

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
    stationId: string | null;
  };
};

// Routes for creating swap requests (petugas, supervisor, admin, superadmin)
const requestRoutes = new Elysia()
  .use(rbacMiddleware(["petugas", "supervisor", "admin", "superadmin"]))
  .post(
    "/",
    async (context) => {
      const { body, set, user } = context as typeof context & AuthContextUser;
      try {
        const result = await CardSwapService.createSwapRequest(
          body,
          user.id
        );
        return {
          success: true,
          message: "Swap request berhasil dibuat",
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
      body: CardSwapModel.createSwapRequestBody,
      response: {
        200: CardSwapModel.swapRequestResponse,
        400: CardSwapModel.errorResponse,
        401: CardSwapModel.errorResponse,
        403: CardSwapModel.errorResponse,
        404: CardSwapModel.errorResponse,
        500: CardSwapModel.errorResponse,
      },
      detail: {
        tags: ["Card Swaps"],
        summary: "Create swap request",
        description: `**Create Card Swap Request**

Endpoint untuk membuat request swap kartu antar stasiun. Digunakan ketika petugas menyadari kartu yang diberikan ke customer salah.

**Use Case:**
- Petugas di Stasiun Halim memberikan kartu yang salah ke customer
- Customer akan mengambil kartu pengganti di stasiun lain (misal: Karawang)
- Petugas membuat swap request yang akan di-approve oleh HO/Supervisor

**Requirements:**
- Purchase harus exist dan card harus berstatus SOLD_ACTIVE
- Target station harus memiliki kartu dengan produk yang sesuai
- Tidak boleh ada swap request yang masih pending untuk purchase ini

**Flow:**
1. Request dibuat → status: PENDING_APPROVAL
2. Notifikasi dikirim ke HO/Supervisor untuk approval

**Access:** petugas, supervisor, admin, superadmin`,
      },
    }
  )
  .get(
    "/",
    async (context) => {
      const { query, set, user } = context as typeof context & AuthContextUser;
      try {
        const result = await CardSwapService.getSwapRequests({
          status: query.status,
          sourceStationId: query.sourceStationId,
          targetStationId: query.targetStationId,
          requestedBy: query.requestedBy,
          page: query.page,
          limit: query.limit,
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
      query: CardSwapModel.getSwapRequestsQuery,
      response: {
        200: CardSwapModel.swapRequestsListResponse,
        401: CardSwapModel.errorResponse,
        403: CardSwapModel.errorResponse,
        500: CardSwapModel.errorResponse,
      },
      detail: {
        tags: ["Card Swaps"],
        summary: "Get swap requests with filters",
        description: `**Get Swap Requests**

Endpoint untuk mengambil daftar swap requests dengan berbagai filter.

**Filter Options:**
- \`status\`: PENDING_APPROVAL, APPROVED, COMPLETED, REJECTED, CANCELLED
- \`sourceStationId\`: Filter by source station
- \`targetStationId\`: Filter by target station (untuk dashboard petugas target)
- \`requestedBy\`: Filter by requester (untuk tracking)
- \`page\`, \`limit\`: Pagination

**Common Use Cases:**
- Dashboard HO/SPV: status=PENDING_APPROVAL (untuk approval)
- Dashboard Petugas Target: status=APPROVED + targetStationId (ready to execute)
- Tracking by Requester: requestedBy + any status

**Access:** petugas, supervisor, admin, superadmin`,
      },
    }
  )
  .get(
    "/:id",
    async (context) => {
      const { params, set } = context;
      try {
        const result = await CardSwapService.getSwapRequestById(params.id);
        return {
          success: true,
          message: "Swap request retrieved successfully",
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
      params: t.Object({
        id: t.String({ format: "uuid", description: "Swap Request ID" }),
      }),
      response: {
        200: CardSwapModel.swapRequestResponse,
        401: CardSwapModel.errorResponse,
        403: CardSwapModel.errorResponse,
        404: CardSwapModel.errorResponse,
        500: CardSwapModel.errorResponse,
      },
      detail: {
        tags: ["Card Swaps"],
        summary: "Get swap request by ID",
        description: `**Get Swap Request Detail**

Endpoint untuk mengambil detail lengkap swap request beserta semua relasi.

**Returns:**
- Purchase detail dengan member dan card info
- Original card yang akan di-restore
- Replacement card (jika sudah di-execute)
- Source dan target stations
- Expected product info
- Requester, approver, executor, rejecter info
- Timeline (requested, approved, executed, rejected)

**Access:** petugas, supervisor, admin, superadmin`,
      },
    }
  )
  .delete(
    "/:id",
    async (context) => {
      const { params, set, user } = context as typeof context & AuthContextUser;
      try {
        const result = await CardSwapService.cancelSwapRequest(
          params.id,
          user.id
        );
        return {
          success: true,
          message: "Swap request berhasil dibatalkan",
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
      params: t.Object({
        id: t.String({ format: "uuid", description: "Swap Request ID" }),
      }),
      response: {
        200: CardSwapModel.swapRequestResponse,
        400: CardSwapModel.errorResponse,
        401: CardSwapModel.errorResponse,
        403: CardSwapModel.errorResponse,
        404: CardSwapModel.errorResponse,
        500: CardSwapModel.errorResponse,
      },
      detail: {
        tags: ["Card Swaps"],
        summary: "Cancel swap request",
        description: `**Cancel Swap Request**

Endpoint untuk membatalkan swap request oleh pembuat request.

**Requirements:**
- Hanya requester yang dapat membatalkan
- Status harus PENDING_APPROVAL
- Request yang sudah APPROVED/COMPLETED/REJECTED tidak bisa dibatalkan

**Use Case:**
- Requester menyadari request salah
- Problem sudah diselesaikan dengan cara lain
- Customer membatalkan rencana pengambilan kartu

**Access:** petugas, supervisor, admin, superadmin (hanya requester)`,
      },
    }
  );

// Routes for approval (supervisor, admin, superadmin only)
const approvalRoutes = new Elysia()
  .use(rbacMiddleware(["supervisor", "admin", "superadmin"]))
  .post(
    "/:id/approve",
    async (context) => {
      const { params, set, user } = context as typeof context & AuthContextUser;
      try {
        const result = await CardSwapService.approveSwapRequest(
          params.id,
          user.id
        );
        return {
          success: true,
          message: "Swap request berhasil di-approve",
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
      params: t.Object({
        id: t.String({ format: "uuid", description: "Swap Request ID" }),
      }),
      body: CardSwapModel.approveSwapRequestBody,
      response: {
        200: CardSwapModel.swapRequestResponse,
        400: CardSwapModel.errorResponse,
        401: CardSwapModel.errorResponse,
        403: CardSwapModel.errorResponse,
        404: CardSwapModel.errorResponse,
        500: CardSwapModel.errorResponse,
      },
      detail: {
        tags: ["Card Swaps - Approval"],
        summary: "Approve swap request (HO/SPV)",
        description: `**Approve Swap Request**

Endpoint untuk approve swap request. Hanya bisa dilakukan oleh HO/Supervisor.

**Validation:**
- Status harus PENDING_APPROVAL
- Card harus masih SOLD_ACTIVE
- Target station harus memiliki kartu dengan produk yang sesuai

**After Approval:**
- Status berubah menjadi APPROVED
- Notifikasi dikirim ke petugas target station
- Petugas target dapat execute swap

**Access:** supervisor, admin, superadmin`,
      },
    }
  )
  .post(
    "/:id/reject",
    async (context) => {
      const { params, body, set, user } = context as typeof context &
        AuthContextUser;
      try {
        const result = await CardSwapService.rejectSwapRequest(
          params.id,
          user.id,
          body.rejectionReason
        );
        return {
          success: true,
          message: "Swap request berhasil di-reject",
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
      params: t.Object({
        id: t.String({ format: "uuid", description: "Swap Request ID" }),
      }),
      body: CardSwapModel.rejectSwapRequestBody,
      response: {
        200: CardSwapModel.swapRequestResponse,
        400: CardSwapModel.errorResponse,
        401: CardSwapModel.errorResponse,
        403: CardSwapModel.errorResponse,
        404: CardSwapModel.errorResponse,
        500: CardSwapModel.errorResponse,
      },
      detail: {
        tags: ["Card Swaps - Approval"],
        summary: "Reject swap request (HO/SPV)",
        description: `**Reject Swap Request**

Endpoint untuk reject swap request dengan alasan penolakan. Hanya bisa dilakukan oleh HO/Supervisor.

**Requirements:**
- Status harus PENDING_APPROVAL
- Rejection reason wajib diisi (min 10 karakter)

**After Rejection:**
- Status berubah menjadi REJECTED
- Notifikasi dikirim ke requester
- Request tidak bisa di-execute

**Common Rejection Reasons:**
- Stok kartu di target station tidak mencukupi
- Data tidak valid
- Duplicate request
- Policy violation

**Access:** supervisor, admin, superadmin`,
      },
    }
  );

// Routes for execution (petugas, supervisor, admin, superadmin)
const executionRoutes = new Elysia()
  .use(rbacMiddleware(["petugas", "supervisor", "admin", "superadmin"]))
  .post(
    "/:id/execute",
    async (context) => {
      const { params, body, set, user } = context as typeof context &
        AuthContextUser;
      try {
        const result = await CardSwapService.executeSwap(
          params.id,
          body.replacementCardId,
          user.id
        );
        return {
          success: true,
          message: "Swap berhasil dieksekusi",
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
      params: t.Object({
        id: t.String({ format: "uuid", description: "Swap Request ID" }),
      }),
      body: CardSwapModel.executeSwapBody,
      response: {
        200: CardSwapModel.swapRequestResponse,
        400: CardSwapModel.errorResponse,
        401: CardSwapModel.errorResponse,
        403: CardSwapModel.errorResponse,
        404: CardSwapModel.errorResponse,
        500: CardSwapModel.errorResponse,
      },
      detail: {
        tags: ["Card Swaps - Execution"],
        summary: "Execute card swap (Target Station)",
        description: `**Execute Card Swap**

Endpoint untuk eksekusi swap kartu. Dilakukan oleh petugas di target station setelah request di-approve.

**Critical Operation - Atomic Transaction:**

1. **Restore original card:**
   - Status: SOLD_ACTIVE → IN_STATION
   - Clear member, purchase date, expired date
   - Reset quota to 0

2. **Update purchase:**
   - Point to new cardId
   - Update stationId to target station
   - Add swap note to purchase notes

3. **Activate replacement card:**
   - Status: IN_STATION → SOLD_ACTIVE
   - Set member, purchase date, expired date
   - Initialize quota from product

4. **Update inventories:**
   - Source station: cardAktif -1, cardBelumTerjual +1
   - Target station: cardBelumTerjual -1, cardAktif +1

5. **Create audit trail:**
   - Record complete history in card_swap_history
   - Store inventory changes snapshot

**Validation:**
- Status harus APPROVED
- Replacement card harus IN_STATION
- Replacement card product harus sesuai dengan expected product

**Access:** petugas, supervisor, admin, superadmin`,
      },
    }
  )
  .get(
    "/purchase/:purchaseId/history",
    async (context) => {
      const { params, set } = context;
      try {
        const result = await CardSwapService.getSwapHistory(params.purchaseId);
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
      params: t.Object({
        purchaseId: t.String({ format: "uuid", description: "Purchase ID" }),
      }),
      response: {
        200: CardSwapModel.swapHistoryResponse,
        401: CardSwapModel.errorResponse,
        403: CardSwapModel.errorResponse,
        500: CardSwapModel.errorResponse,
      },
      detail: {
        tags: ["Card Swaps - Execution"],
        summary: "Get swap history for purchase",
        description: `**Get Swap History**

Endpoint untuk mengambil history swap untuk suatu purchase.

**Returns:**
- Chronological list of all swaps for this purchase
- Before/after snapshots (card, station, status)
- Inventory changes details
- Requester, approver, executor info
- Execution timestamps

**Use Cases:**
- Audit trail
- Forensic analysis
- Customer support
- Compliance reporting

**Access:** petugas, supervisor, admin, superadmin`,
      },
    }
  );

// Combine all routes
export const cardSwaps = new Elysia({ prefix: "/card-swaps" })
  .use(requestRoutes)
  .use(approvalRoutes)
  .use(executionRoutes);
