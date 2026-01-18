import { Elysia, t } from "elysia";
import { ReconciliationModel } from "./model";
import { ReconciliationService } from "./service";
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
  };
};

export const reconciliation = new Elysia({ prefix: "/reconciliation" })
  .use(rbacMiddleware(["admin", "superadmin"]))

  // Upload Excel file
  .post(
    "/upload",
    async (context) => {
      const { body, set, user } = context as typeof context & AuthContextUser;
      try {
        const file = body.file;

        if (!file) {
          set.status = 400;
          return formatErrorResponse(new Error("File tidak ditemukan"));
        }

        const result = await ReconciliationService.uploadAndProcess(
          file,
          user.id
        );

        return {
          success: true,
          message: `Berhasil mengimpor ${result.totalRows} data FWC`,
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
      body: t.Object({
        file: t.File(),
      }),
      response: {
        200: ReconciliationModel.uploadResponse,
        400: ReconciliationModel.errorResponse,
        401: ReconciliationModel.errorResponse,
        403: ReconciliationModel.errorResponse,
        500: ReconciliationModel.errorResponse,
      },
      detail: {
        tags: ["Reconciliation"],
        summary: "Upload Excel File",
        description: `Upload file Excel Ticket Sales Report dari sistem Whoosh.
        
**Proses:**
1. Parse file Excel
2. Filter hanya data FWC (NIK dengan prefix FW)
3. Extract kolom: serial_number (PlatTrade No), nik_clean, ticketing_date
4. Simpan ke CSV di storage/reconciliation/
5. Import ke temporary table menggunakan PostgreSQL COPY

**Format file:** .xlsx atau .xls`,
      },
    }
  )

  // Trigger matching
  .post(
    "/match",
    async (context) => {
      const { body, set, user } = context as typeof context & AuthContextUser;
      try {
        const result = await ReconciliationService.triggerMatching(
          body.batchId,
          user.id
        );

        return {
          success: true,
          message: `Matching selesai: ${result.matchedRows} matched, ${result.unmatchedRows} unmatched`,
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
      body: ReconciliationModel.triggerMatchBody,
      response: {
        200: ReconciliationModel.triggerMatchResponse,
        400: ReconciliationModel.errorResponse,
        401: ReconciliationModel.errorResponse,
        403: ReconciliationModel.errorResponse,
        404: ReconciliationModel.errorResponse,
        500: ReconciliationModel.errorResponse,
      },
      detail: {
        tags: ["Reconciliation"],
        summary: "Trigger Matching",
        description: `Memulai proses matching untuk batch tertentu.
        
**Strategi Matching:**
1. Match by serial_number (PlatTrade No) → cards.serial_number
2. Match by NIK + ticketing_date → members.identity_number + card_redeem.shift_date

**Status batch akan diupdate:**
- PENDING → MATCHING → COMPLETED/FAILED`,
      },
    }
  )

  // Get batch list
  .get(
    "/batches",
    async (context) => {
      const { query, set } = context;
      try {
        const result = await ReconciliationService.getBatches({
          page: query.page ? parseInt(query.page) : undefined,
          limit: query.limit ? parseInt(query.limit) : undefined,
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
      query: ReconciliationModel.getBatchesQuery,
      response: {
        200: ReconciliationModel.getBatchesResponse,
        401: ReconciliationModel.errorResponse,
        403: ReconciliationModel.errorResponse,
        500: ReconciliationModel.errorResponse,
      },
      detail: {
        tags: ["Reconciliation"],
        summary: "Get Batch List",
        description:
          "Mendapatkan daftar batch rekonsiliasi. Filter by status: PENDING, MATCHING, COMPLETED, FAILED",
      },
    }
  )

  // Get batch records
  .get(
    "/batches/:batchId",
    async (context) => {
      const { params, query, set } = context;
      try {
        let isMatched: boolean | undefined;
        if (query.isMatched === "true") isMatched = true;
        else if (query.isMatched === "false") isMatched = false;

        const result = await ReconciliationService.getBatchRecords(
          params.batchId,
          {
            page: query.page ? parseInt(query.page) : undefined,
            limit: query.limit ? parseInt(query.limit) : undefined,
            isMatched,
          }
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
      params: t.Object({
        batchId: t.String(),
      }),
      query: ReconciliationModel.getBatchRecordsQuery,
      response: {
        200: ReconciliationModel.getBatchRecordsResponse,
        401: ReconciliationModel.errorResponse,
        403: ReconciliationModel.errorResponse,
        404: ReconciliationModel.errorResponse,
        500: ReconciliationModel.errorResponse,
      },
      detail: {
        tags: ["Reconciliation"],
        summary: "Get Batch Records",
        description: `Mendapatkan detail batch dan daftar record.
        
**Filter isMatched:**
- true = hanya yang matched
- false = hanya yang tidak matched  
- tidak diisi = semua`,
      },
    }
  )

  // Delete batch
  .delete(
    "/batches/:batchId",
    async (context) => {
      const { params, set } = context;
      try {
        await ReconciliationService.deleteBatch(params.batchId);

        return {
          success: true,
          message: "Batch berhasil dihapus",
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
        batchId: t.String(),
      }),
      detail: {
        tags: ["Reconciliation"],
        summary: "Delete Batch",
        description: "Menghapus batch beserta semua record dan file CSV",
      },
    }
  );
