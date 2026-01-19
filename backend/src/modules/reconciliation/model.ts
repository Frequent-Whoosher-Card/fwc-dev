import { t } from "elysia";

export const ReconciliationModel = {
  // Upload request
  uploadBody: t.Object({
    file: t.File({
      type: [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
      ],
    }),
  }),

  // Upload response
  uploadResponse: t.Object({
    success: t.Boolean(),
    message: t.String(),
    data: t.Object({
      batchId: t.String(),
      fileName: t.String(),
      totalRows: t.Number(),
      csvPath: t.String(),
    }),
  }),

  // Trigger matching request
  triggerMatchBody: t.Object({
    batchId: t.String(),
  }),

  // Trigger matching response
  triggerMatchResponse: t.Object({
    success: t.Boolean(),
    message: t.String(),
    data: t.Object({
      batchId: t.String(),
      totalRows: t.Number(),
      matchedRows: t.Number(),
      unmatchedRows: t.Number(),
      status: t.String(),
    }),
  }),

  // Get batch list query
  getBatchesQuery: t.Object({
    page: t.Optional(t.String()),
    limit: t.Optional(t.String()),
    status: t.Optional(t.String()),
  }),

  // Get batch list response
  getBatchesResponse: t.Object({
    success: t.Boolean(),
    data: t.Object({
      batches: t.Array(
        t.Object({
          id: t.String(),
          fileName: t.String(),
          totalRows: t.Number(),
          matchedRows: t.Number(),
          unmatchedRows: t.Number(),
          status: t.String(),
          createdAt: t.String(),
          matchedAt: t.Nullable(t.String()),
        })
      ),
      pagination: t.Object({
        total: t.Number(),
        page: t.Number(),
        limit: t.Number(),
        totalPages: t.Number(),
      }),
    }),
  }),

  // Get batch detail query
  getBatchRecordsQuery: t.Object({
    page: t.Optional(t.String()),
    limit: t.Optional(t.String()),
    isMatched: t.Optional(t.String()), // "true" | "false" | undefined (all)
  }),

  // Get batch detail response
  getBatchRecordsResponse: t.Object({
    success: t.Boolean(),
    data: t.Object({
      batch: t.Object({
        id: t.String(),
        fileName: t.String(),
        totalRows: t.Number(),
        matchedRows: t.Number(),
        unmatchedRows: t.Number(),
        status: t.String(),
        createdAt: t.String(),
        matchedAt: t.Nullable(t.String()),
      }),
      records: t.Array(
        t.Object({
          id: t.String(),
          whoosh: t.Object({
            serialNumber: t.Nullable(t.String()),
            nik: t.String(),
            ticketingDate: t.String(),
          }),
          fwc: t.Nullable(
            t.Object({
              cardId: t.String(),
              serialNumber: t.Nullable(t.String()),
              memberName: t.Nullable(t.String()),
              memberNik: t.Nullable(t.String()),
              redeemId: t.Nullable(t.String()),
              redeemDate: t.Nullable(t.String()),
              redeemStation: t.Nullable(t.String()),
              redeemType: t.Nullable(t.String()),
            })
          ),
          matchDetails: t.Nullable(
            t.Object({
              serialMatch: t.Boolean(),
              nikMatch: t.Boolean(),
              dateMatch: t.Boolean(),
              partialFwc: t.Nullable(
                t.Object({
                  serialNumber: t.Nullable(t.String()),
                  memberName: t.Nullable(t.String()),
                  memberNik: t.Nullable(t.String()),
                  redeemDate: t.Nullable(t.String()),
                  redeemStation: t.Nullable(t.String()),
                })
              ),
              reason: t.String(),
            })
          ),
          isMatched: t.Boolean(),
          matchedCardId: t.Nullable(t.String()),
          matchedRedeemId: t.Nullable(t.String()),
        })
      ),
      fwcOnlyRecords: t.Array(
        t.Object({
          fwc: t.Object({
            cardId: t.String(),
            serialNumber: t.Nullable(t.String()),
            memberName: t.Nullable(t.String()),
            memberNik: t.Nullable(t.String()),
            redeemId: t.Nullable(t.String()),
            redeemDate: t.Nullable(t.String()),
            redeemStation: t.Nullable(t.String()),
            redeemType: t.Nullable(t.String()),
          }),
        })
      ),
      pagination: t.Object({
        total: t.Number(),
        page: t.Number(),
        limit: t.Number(),
        totalPages: t.Number(),
      }),
    }),
  }),

  // Error response
  errorResponse: t.Object({
    success: t.Boolean(),
    error: t.Object({
      message: t.String(),
      code: t.Optional(t.String()),
      statusCode: t.Optional(t.Number()),
    }),
  }),
};
