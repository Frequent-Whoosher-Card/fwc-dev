import axios from '@/lib/axios';

/* =========================
   TYPES
========================= */

export interface ReconciliationBatch {
  id: string;
  fileName: string;
  totalRows: number;
  matchedRows: number;
  unmatchedRows: number;
  status: 'PENDING' | 'MATCHING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  matchedAt: string | null;
}

export interface WhooshData {
  serialNumber: string | null;
  nik: string;
  ticketingDate: string;
}

export interface FwcData {
  cardId: string;
  serialNumber: string | null;
  memberName: string | null;
  memberNik: string | null;
  redeemId: string | null;
  redeemDate: string | null;
  redeemStation: string | null;
  redeemType: string | null;
}

export interface PartialFwcData {
  serialNumber: string | null;
  memberName: string | null;
  memberNik: string | null;
  redeemDate: string | null;
  redeemStation: string | null;
}

export interface MatchDetails {
  serialMatch: boolean;
  nikMatch: boolean;
  dateMatch: boolean;
  partialFwc: PartialFwcData | null;
  reason: string;
}

export interface ReconciliationRecord {
  id: string;
  whoosh: WhooshData;
  fwc: FwcData | null;
  matchDetails: MatchDetails | null;
  isMatched: boolean;
  matchedCardId: string | null;
  matchedRedeemId: string | null;
}

export interface FwcOnlyRecord {
  fwc: FwcData;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/* =========================
   API FUNCTIONS
========================= */

/**
 * Upload Excel file for reconciliation
 */
export async function uploadReconciliationFile(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await axios.post('/reconciliation/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return res.data;
}

/**
 * Trigger matching for a batch
 */
export async function triggerMatching(batchId: string) {
  const res = await axios.post('/reconciliation/match', { batchId });
  return res.data;
}

/**
 * Get list of batches
 */
export async function getBatches(params?: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<{
  batches: ReconciliationBatch[];
  pagination: PaginationMeta;
}> {
  const query = new URLSearchParams();

  if (params?.page) query.append('page', String(params.page));
  if (params?.limit) query.append('limit', String(params.limit));
  if (params?.status) query.append('status', params.status);

  const res = await axios.get(`/reconciliation/batches?${query.toString()}`);
  return res.data.data;
}

/**
 * Get batch detail with records
 */
export async function getBatchRecords(
  batchId: string,
  params?: {
    page?: number;
    limit?: number;
    isMatched?: boolean;
  }
): Promise<{
  batch: ReconciliationBatch;
  records: ReconciliationRecord[];
  fwcOnlyRecords: FwcOnlyRecord[];
  pagination: PaginationMeta;
}> {
  const query = new URLSearchParams();

  if (params?.page) query.append('page', String(params.page));
  if (params?.limit) query.append('limit', String(params.limit));
  if (params?.isMatched !== undefined) {
    query.append('isMatched', String(params.isMatched));
  }

  const res = await axios.get(`/reconciliation/batches/${batchId}?${query.toString()}`);
  return res.data.data;
}

/**
 * Delete a batch
 */
export async function deleteBatch(batchId: string) {
  const res = await axios.delete(`/reconciliation/batches/${batchId}`);
  return res.data;
}
