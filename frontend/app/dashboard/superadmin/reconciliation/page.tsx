'use client';

import type { ReactNode } from 'react';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  Upload,
  FileSpreadsheet,
  RefreshCw,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import {
  uploadReconciliationFile,
  getBatches,
  triggerMatching,
  deleteBatch,
  type ReconciliationBatch,
  type PaginationMeta,
} from '@/lib/services/reconciliation.service';

/* =====================
   HELPER: Status Badge
===================== */
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; text: string; icon: ReactNode }> = {
    PENDING: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      icon: <Clock size={14} />,
    },
    MATCHING: {
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      icon: <Loader2 size={14} className="animate-spin" />,
    },
    COMPLETED: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      icon: <CheckCircle2 size={14} />,
    },
    FAILED: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      icon: <XCircle size={14} />,
    },
  };

  const style = styles[status] || styles.PENDING;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${style.bg} ${style.text}`}
    >
      {style.icon}
      {status}
    </span>
  );
}

/* =====================
   DELETE CONFIRMATION MODAL
===================== */
function DeleteModal({
  open,
  onClose,
  onConfirm,
  batchName,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  batchName: string;
  loading: boolean;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900">Hapus Batch</h3>
        <p className="mt-2 text-sm text-gray-600">
          Apakah Anda yakin ingin menghapus batch{' '}
          <strong className="text-gray-900">{batchName}</strong>?
          <br />
          Semua data rekonsiliasi dalam batch ini akan dihapus permanen.
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
}

/* =====================
   MAIN COMPONENT
===================== */
export default function ReconciliationPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* =====================
     STATE
  ===================== */
  const [batches, setBatches] = useState<ReconciliationBatch[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [matchingBatchId, setMatchingBatchId] = useState<string | null>(null);

  // Delete modal
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    batchId: string;
    batchName: string;
    loading: boolean;
  }>({ open: false, batchId: '', batchName: '', loading: false });

  // Filter by status
  const [statusFilter, setStatusFilter] = useState<string>('all');

  /* =====================
     FETCH BATCHES
  ===================== */
  const fetchBatches = useCallback(async () => {
    setLoading(true);
    try {
      const params: { page: number; limit: number; status?: string } = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const res = await getBatches(params);
      setBatches(res.batches);
      setPagination(res.pagination);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal mengambil data batch');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, statusFilter]);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  /* =====================
     UPLOAD FILE
  ===================== */
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    if (!validTypes.includes(file.type)) {
      toast.error('File harus berformat Excel (.xlsx atau .xls)');
      return;
    }

    setUploading(true);
    try {
      const res = await uploadReconciliationFile(file);
      toast.success(
        `Batch berhasil dibuat: ${res.data.totalRows} data FWC ditemukan`
      );
      fetchBatches();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal upload file');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  /* =====================
     TRIGGER MATCHING
  ===================== */
  const handleTriggerMatching = async (batchId: string) => {
    setMatchingBatchId(batchId);
    try {
      const res = await triggerMatching(batchId);
      toast.success(
        `Matching selesai: ${res.data.matched} matched, ${res.data.unmatched} unmatched`
      );
      fetchBatches();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal melakukan matching');
    } finally {
      setMatchingBatchId(null);
    }
  };

  /* =====================
     DELETE BATCH
  ===================== */
  const handleDeleteBatch = async () => {
    setDeleteModal((prev) => ({ ...prev, loading: true }));
    try {
      await deleteBatch(deleteModal.batchId);
      toast.success('Batch berhasil dihapus');
      fetchBatches();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menghapus batch');
    } finally {
      setDeleteModal({ open: false, batchId: '', batchName: '', loading: false });
    }
  };

  /* =====================
     PAGINATION HELPERS
  ===================== */
  const pageNumbers = Array.from({ length: pagination.totalPages }, (_, i) => i + 1);

  /* =====================
     RENDER
  ===================== */
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Reconciliation FWC
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Upload data dari sistem Whoosh untuk rekonsiliasi dengan database internal
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Filter by Status */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#8D1231] focus:outline-none focus:ring-1 focus:ring-[#8D1231]"
          >
            <option value="all">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="COMPLETED">Completed</option>
            <option value="FAILED">Failed</option>
          </select>

          {/* Upload Button */}
          <label
            className={`flex cursor-pointer items-center gap-2 rounded-md bg-[#8D1231] px-4 py-2 text-sm font-medium text-white hover:bg-[#6d0e26] ${
              uploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {uploading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Upload size={16} />
            )}
            {uploading ? 'Uploading...' : 'Upload Excel'}
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* INFO CARD */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <FileSpreadsheet className="mt-0.5 text-blue-600" size={20} />
          <div className="text-sm">
            <p className="font-medium text-blue-900">Cara Penggunaan:</p>
            <ol className="mt-1 list-decimal pl-4 text-blue-800">
              <li>Upload file Excel dari sistem Whoosh (format: Ticket sales report)</li>
              <li>Sistem akan filter data FWC secara otomatis (NIK mengandung &quot;FW&quot;)</li>
              <li>Klik tombol &quot;Match&quot; untuk memulai proses rekonsiliasi</li>
              <li>Lihat detail hasil matching dengan klik tombol &quot;Detail&quot;</li>
            </ol>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full min-w-[800px] text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-700">No</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">File Name</th>
              <th className="px-4 py-3 text-center font-medium text-gray-700">Total</th>
              <th className="px-4 py-3 text-center font-medium text-gray-700">Matched</th>
              <th className="px-4 py-3 text-center font-medium text-gray-700">Unmatched</th>
              <th className="px-4 py-3 text-center font-medium text-gray-700">Status</th>
              <th className="px-4 py-3 text-center font-medium text-gray-700">Created At</th>
              <th className="px-4 py-3 text-center font-medium text-gray-700">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                  <Loader2 className="mx-auto animate-spin" size={24} />
                  <p className="mt-2">Memuat data...</p>
                </td>
              </tr>
            ) : batches.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                  <FileSpreadsheet className="mx-auto text-gray-400" size={32} />
                  <p className="mt-2">Belum ada data batch</p>
                  <p className="text-xs text-gray-400">
                    Upload file Excel untuk memulai rekonsiliasi
                  </p>
                </td>
              </tr>
            ) : (
              batches.map((batch, index) => (
                <tr key={batch.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {(pagination.page - 1) * pagination.limit + index + 1}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet size={16} className="text-green-600" />
                      <span className="truncate max-w-[200px]" title={batch.fileName}>
                        {batch.fileName}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center font-medium">
                    {batch.totalRows.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-medium text-green-600">
                      {batch.matchedRows.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-medium text-red-600">
                      {batch.unmatchedRows.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={batch.status} />
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">
                    {new Date(batch.createdAt).toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      {/* Match Button - only show for PENDING */}
                      {batch.status === 'PENDING' && (
                        <button
                          onClick={() => handleTriggerMatching(batch.id)}
                          disabled={matchingBatchId === batch.id}
                          className="flex items-center gap-1 rounded-md border border-blue-500 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-50"
                          title="Jalankan matching"
                        >
                          {matchingBatchId === batch.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <RefreshCw size={12} />
                          )}
                          Match
                        </button>
                      )}

                      {/* Detail Button */}
                      <button
                        onClick={() =>
                          router.push(
                            `/dashboard/superadmin/reconciliation/${batch.id}`
                          )
                        }
                        className="flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
                        title="Lihat detail"
                      >
                        <Eye size={12} />
                        Detail
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() =>
                          setDeleteModal({
                            open: true,
                            batchId: batch.id,
                            batchName: batch.fileName,
                            loading: false,
                          })
                        }
                        className="flex items-center gap-1 rounded-md border border-red-500 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                        title="Hapus batch"
                      >
                        <Trash2 size={12} />
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 text-sm">
          <button
            disabled={pagination.page === 1}
            onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
            className="rounded p-1 hover:bg-gray-100 disabled:opacity-50"
          >
            <ChevronLeft size={18} />
          </button>

          {pageNumbers.map((p) => (
            <button
              key={p}
              onClick={() => setPagination((pg) => ({ ...pg, page: p }))}
              className={`rounded px-3 py-1 ${
                p === pagination.page
                  ? 'bg-[#8D1231] font-semibold text-white'
                  : 'hover:bg-gray-100'
              }`}
            >
              {p}
            </button>
          ))}

          <button
            disabled={pagination.page === pagination.totalPages}
            onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
            className="rounded p-1 hover:bg-gray-100 disabled:opacity-50"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* DELETE MODAL */}
      <DeleteModal
        open={deleteModal.open}
        onClose={() =>
          setDeleteModal({ open: false, batchId: '', batchName: '', loading: false })
        }
        onConfirm={handleDeleteBatch}
        batchName={deleteModal.batchName}
        loading={deleteModal.loading}
      />
    </div>
  );
}
