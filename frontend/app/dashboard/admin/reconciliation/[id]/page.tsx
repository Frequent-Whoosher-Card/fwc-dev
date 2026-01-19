'use client';

import type { ReactNode } from 'react';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Search,
  RefreshCw,
  Clock,
  AlertCircle,
} from 'lucide-react';
import {
  getBatchRecords,
  triggerMatching,
  type ReconciliationBatch,
  type ReconciliationRecord,
  type PaginationMeta,
} from '@/lib/services/reconciliation.service';

/* =====================
   STATUS BADGE
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
   MATCH BADGE
===================== */
function MatchBadge({ isMatched, matchDetails }: { isMatched: boolean; matchDetails?: { serialMatch?: boolean; nikMatch?: boolean; dateMatch?: boolean; reason?: string } }) {
  if (isMatched) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800">
        <CheckCircle2 size={12} />
        Matched
      </span>
    );
  }
  
  // Show partial match indicator if there's some match
  if (matchDetails && (matchDetails.serialMatch || matchDetails.nikMatch || matchDetails.dateMatch)) {
    const matchCount = [matchDetails.serialMatch, matchDetails.nikMatch, matchDetails.dateMatch].filter(Boolean).length;
    return (
      <div className="flex flex-col items-center gap-1">
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
          <AlertCircle size={12} /> Partial ({matchCount}/3)
        </span>
        <div className="flex gap-1 text-[10px]">
          <span className={matchDetails.serialMatch ? 'text-green-600 font-bold' : 'text-red-500'} title="Serial Number">
            S{matchDetails.serialMatch ? '✓' : '✗'}
          </span>
          <span className={matchDetails.nikMatch ? 'text-green-600 font-bold' : 'text-red-500'} title="NIK">
            N{matchDetails.nikMatch ? '✓' : '✗'}
          </span>
          <span className={matchDetails.dateMatch ? 'text-green-600 font-bold' : 'text-red-500'} title="Tanggal">
            D{matchDetails.dateMatch ? '✓' : '✗'}
          </span>
        </div>
      </div>
    );
  }
  
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-800">
      <XCircle size={12} />
      Not Matched
    </span>
  );
}

/* =====================
   MAIN COMPONENT
===================== */
export default function ReconciliationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const batchId = params.id as string;

  /* =====================
     STATE
  ===================== */
  const [batch, setBatch] = useState<ReconciliationBatch | null>(null);
  const [records, setRecords] = useState<ReconciliationRecord[]>([]);
  const [fwcOnlyRecords, setFwcOnlyRecords] = useState<any[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [matching, setMatching] = useState(false);

  // Filters
  const [matchFilter, setMatchFilter] = useState<'all' | 'matched' | 'unmatched'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  /* =====================
     FETCH DATA
  ===================== */
  const fetchBatchDetail = useCallback(async () => {
    setLoading(true);
    try {
      const params: { page: number; limit: number; isMatched?: boolean } = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (matchFilter === 'matched') {
        params.isMatched = true;
      } else if (matchFilter === 'unmatched') {
        params.isMatched = false;
      }

      const res = await getBatchRecords(batchId, params);
      setBatch(res.batch);
      setRecords(res.records);
      setFwcOnlyRecords(res.fwcOnlyRecords || []);
      setPagination(res.pagination);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal mengambil data batch');
      router.push('/dashboard/admin/reconciliation');
    } finally {
      setLoading(false);
    }
  }, [batchId, pagination.page, pagination.limit, matchFilter, router]);

  useEffect(() => {
    if (batchId) {
      fetchBatchDetail();
    }
  }, [batchId, fetchBatchDetail]);

  /* =====================
     TRIGGER MATCHING
  ===================== */
  const handleTriggerMatching = async () => {
    setMatching(true);
    try {
      const res = await triggerMatching(batchId);
      toast.success(
        `Matching selesai: ${res.data.matched} matched, ${res.data.unmatched} unmatched`
      );
      fetchBatchDetail();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal melakukan matching');
    } finally {
      setMatching(false);
    }
  };

  /* =====================
     LOCAL SEARCH FILTER
  ===================== */
  const filteredRecords = records.filter((rec) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      rec.whoosh.nik.toLowerCase().includes(query) ||
      (rec.whoosh.serialNumber && rec.whoosh.serialNumber.toLowerCase().includes(query)) ||
      (rec.fwc?.memberName && rec.fwc.memberName.toLowerCase().includes(query)) ||
      (rec.fwc?.serialNumber && rec.fwc.serialNumber.toLowerCase().includes(query))
    );
  });

  /* =====================
     PAGINATION HELPERS
  ===================== */
  const pageNumbers = Array.from({ length: pagination.totalPages }, (_, i) => i + 1);

  // Show limited page numbers
  const getVisiblePages = () => {
    const maxVisible = 5;
    if (pagination.totalPages <= maxVisible) return pageNumbers;

    const current = pagination.page;
    const half = Math.floor(maxVisible / 2);

    let start = Math.max(1, current - half);
    let end = Math.min(pagination.totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    return pageNumbers.slice(start - 1, end);
  };

  /* =====================
     RENDER
  ===================== */
  if (!batch && loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="animate-spin text-gray-500" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* BACK BUTTON + HEADER */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <button
            onClick={() => router.push('/dashboard/admin/reconciliation')}
            className="mt-1 rounded-md border p-2 hover:bg-gray-50"
            title="Kembali"
          >
            <ArrowLeft size={18} />
          </button>

          <div>
            <h2 className="text-xl font-semibold text-gray-900">Detail Batch</h2>
            {batch && (
              <div className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                <FileSpreadsheet size={14} className="text-green-600" />
                <span>{batch.fileName}</span>
                <StatusBadge status={batch.status} />
              </div>
            )}
          </div>
        </div>

        {/* Match Button */}
        {batch?.status === 'PENDING' && (
          <button
            onClick={handleTriggerMatching}
            disabled={matching}
            className="flex items-center gap-2 rounded-md bg-[#8D1231] px-4 py-2 text-sm font-medium text-white hover:bg-[#6d0e26] disabled:opacity-50"
          >
            {matching ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}
            {matching ? 'Matching...' : 'Start Matching'}
          </button>
        )}
      </div>

      {/* STATS CARDS */}
      {batch && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-lg border bg-white p-4">
            <p className="text-sm text-gray-600">Total Records</p>
            <p className="text-2xl font-bold text-gray-900">
              {batch.totalRows.toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg border bg-white p-4">
            <p className="text-sm text-gray-600">Matched</p>
            <p className="text-2xl font-bold text-green-600">
              {batch.matchedRows.toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg border bg-white p-4">
            <p className="text-sm text-gray-600">Unmatched</p>
            <p className="text-2xl font-bold text-red-600">
              {batch.unmatchedRows.toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg border bg-white p-4">
            <p className="text-sm text-gray-600">FWC Only</p>
            <p className="text-2xl font-bold text-blue-600">
              {fwcOnlyRecords.length.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* FILTERS */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          {/* Match Filter */}
          <select
            value={matchFilter}
            onChange={(e) => {
              setMatchFilter(e.target.value as 'all' | 'matched' | 'unmatched');
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#8D1231] focus:outline-none focus:ring-1 focus:ring-[#8D1231]"
          >
            <option value="all">All Records</option>
            <option value="matched">Matched Only</option>
            <option value="unmatched">Unmatched Only</option>
          </select>

          {/* Search Input */}
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search NIK atau Serial..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-[250px] rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-[#8D1231] focus:outline-none focus:ring-1 focus:ring-[#8D1231]"
            />
          </div>
        </div>

        <p className="text-sm text-gray-600">
          Showing {filteredRecords.length}{matchFilter === 'all' && fwcOnlyRecords.length > 0 && ` + ${fwcOnlyRecords.length} FWC-only`} of {pagination.total.toLocaleString()} records
        </p>
      </div>

      {/* TABLE - COMPARISON VIEW */}
      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full min-w-[1400px] text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-3 py-3 text-left font-medium text-gray-700">No</th>
              <th className="px-3 py-3 text-center font-medium text-gray-700">Status</th>
              {/* Whoosh Data */}
              <th className="border-l-2 border-blue-200 bg-blue-50 px-3 py-3 text-left font-medium text-blue-800" colSpan={3}>
                📊 Data Whoosh (Excel)
              </th>
              {/* FWC Data */}
              <th className="border-l-2 border-green-200 bg-green-50 px-3 py-3 text-left font-medium text-green-800" colSpan={4}>
                🗃️ Data FWC (Database)
              </th>
              <th className="border-l-2 border-gray-200 bg-gray-50 px-3 py-3 text-left font-medium text-gray-700">
                Keterangan
              </th>
            </tr>
            <tr className="border-b bg-gray-50">
              <th className="px-3 py-2"></th>
              <th className="px-3 py-2"></th>
              {/* Whoosh columns */}
              <th className="border-l-2 border-blue-200 bg-blue-50/50 px-3 py-2 text-left text-xs font-medium text-blue-700">Serial</th>
              <th className="bg-blue-50/50 px-3 py-2 text-left text-xs font-medium text-blue-700">NIK</th>
              <th className="bg-blue-50/50 px-3 py-2 text-center text-xs font-medium text-blue-700">Tanggal</th>
              {/* FWC columns */}
              <th className="border-l-2 border-green-200 bg-green-50/50 px-3 py-2 text-left text-xs font-medium text-green-700">Serial</th>
              <th className="bg-green-50/50 px-3 py-2 text-left text-xs font-medium text-green-700">Member</th>
              <th className="bg-green-50/50 px-3 py-2 text-left text-xs font-medium text-green-700">Station</th>
              <th className="bg-green-50/50 px-3 py-2 text-center text-xs font-medium text-green-700">Redeem Date</th>
              <th className="border-l-2 border-gray-200 px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} className="px-4 py-12 text-center text-gray-500">
                  <Loader2 className="mx-auto animate-spin" size={24} />
                  <p className="mt-2">Memuat data...</p>
                </td>
              </tr>
            ) : filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-12 text-center text-gray-500">
                  <FileSpreadsheet className="mx-auto text-gray-400" size={32} />
                  <p className="mt-2">
                    {searchQuery
                      ? 'Tidak ada data yang cocok dengan pencarian'
                      : 'Tidak ada data'}
                  </p>
                </td>
              </tr>
            ) : (
              filteredRecords.map((record, index) => {
                // Get FWC data - either from matched record or partial match
                const fwcData = record.fwc || record.matchDetails?.partialFwc;
                const hasPartialMatch = !record.isMatched && record.matchDetails && 
                  (record.matchDetails.serialMatch || record.matchDetails.nikMatch || record.matchDetails.dateMatch);
                
                return (
                <tr key={record.id} className={`border-b hover:bg-gray-50 ${!record.isMatched ? (hasPartialMatch ? 'bg-amber-50/30' : 'bg-red-50/30') : ''}`}>
                  {/* No */}
                  <td className="px-3 py-3 text-gray-600">
                    {(pagination.page - 1) * pagination.limit + index + 1}
                  </td>
                  {/* Status */}
                  <td className="px-3 py-3 text-center">
                    <MatchBadge isMatched={record.isMatched} matchDetails={record.matchDetails} />
                  </td>
                  {/* Whoosh: Serial */}
                  <td className="border-l-2 border-blue-200 bg-blue-50/20 px-3 py-3 font-mono text-xs">
                    {record.whoosh.serialNumber || <span className="text-gray-400">-</span>}
                  </td>
                  {/* Whoosh: NIK */}
                  <td className="bg-blue-50/20 px-3 py-3 font-mono text-xs">
                    {record.whoosh.nik}
                  </td>
                  {/* Whoosh: Date */}
                  <td className="bg-blue-50/20 px-3 py-3 text-center text-gray-600">
                    {new Date(record.whoosh.ticketingDate).toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  {/* FWC: Serial */}
                  <td className="border-l-2 border-green-200 bg-green-50/20 px-3 py-3 font-mono text-xs">
                    {fwcData?.serialNumber ? (
                      <span className={record.matchDetails?.serialMatch ? 'text-green-600 font-semibold' : (hasPartialMatch ? 'text-amber-600' : '')}>
                        {fwcData.serialNumber}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  {/* FWC: Member */}
                  <td className="bg-green-50/20 px-3 py-3">
                    {fwcData ? (
                      <div>
                        <p className={`font-medium ${record.matchDetails?.nikMatch ? 'text-green-600' : (hasPartialMatch ? 'text-amber-600' : 'text-gray-900')}`}>
                          {fwcData.memberName || '-'}
                        </p>
                        <p className={`text-xs font-mono ${record.matchDetails?.nikMatch ? 'text-green-600' : (hasPartialMatch ? 'text-amber-600' : 'text-gray-500')}`}>
                          {fwcData.memberNik || '-'}
                        </p>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  {/* FWC: Station */}
                  <td className="bg-green-50/20 px-3 py-3 text-sm">
                    {fwcData?.redeemStation || <span className="text-gray-400">-</span>}
                  </td>
                  {/* FWC: Redeem Date */}
                  <td className="bg-green-50/20 px-3 py-3 text-center text-gray-600">
                    {fwcData?.redeemDate ? (
                      <span className={record.matchDetails?.dateMatch ? 'text-green-600 font-semibold' : (hasPartialMatch ? 'text-amber-600' : '')}>
                        {new Date(fwcData.redeemDate).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  {/* Reason/Keterangan */}
                  <td className="border-l-2 border-gray-200 px-3 py-3 text-xs text-gray-600">
                    {record.isMatched ? (
                      <span className="text-green-600">✓ Semua data cocok</span>
                    ) : record.matchDetails?.reason ? (
                      <span className="text-amber-700">{record.matchDetails.reason}</span>
                    ) : (
                      <span className="text-red-600">Tidak ditemukan di FWC</span>
                    )}
                  </td>
                </tr>
                );
              })
            )}
            {/* FWC-ONLY RECORDS */}
            {!loading && matchFilter === 'all' && fwcOnlyRecords.length > 0 && (
              <>
                {/* Separator row */}
                <tr className="bg-blue-100">
                  <td
                    colSpan={10}
                    className="px-4 py-2 text-center text-sm font-semibold text-blue-900"
                  >
                    📦 Data FWC yang tidak ada di Whoosh ({fwcOnlyRecords.length} records)
                  </td>
                </tr>
                {/* FWC-only rows */}
                {fwcOnlyRecords.map((record, index) => (
                  <tr
                    key={`fwc-only-${index}`}
                    className="border-b bg-blue-50 hover:bg-blue-100"
                  >
                    {/* No */}
                    <td className="px-3 py-3 text-gray-600">
                      {filteredRecords.length + index + 1}
                    </td>
                    {/* Status */}
                    <td className="px-3 py-3 text-center">
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-800">
                        FWC Only
                      </span>
                    </td>
                    {/* Whoosh columns - empty */}
                    <td className="border-l-2 border-blue-200 bg-blue-100 px-3 py-3 text-center text-xs italic text-blue-600" colSpan={3}>
                      Tidak ada di Whoosh
                    </td>
                    {/* FWC: Serial */}
                    <td className="border-l-2 border-green-200 bg-green-50/40 px-3 py-3 font-mono text-xs">
                      {record.fwc.serialNumber || (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    {/* FWC: Member */}
                    <td className="bg-green-50/40 px-3 py-3">
                      <div>
                        <p className="font-medium text-gray-900">
                          {record.fwc.memberName || '-'}
                        </p>
                        <p className="text-xs font-mono text-gray-500">
                          {record.fwc.memberNik || '-'}
                        </p>
                      </div>
                    </td>
                    {/* FWC: Station */}
                    <td className="bg-green-50/40 px-3 py-3 text-sm">
                      {record.fwc.redeemStation || (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    {/* FWC: Redeem Date */}
                    <td className="bg-green-50/40 px-3 py-3 text-center text-gray-600">
                      {record.fwc.redeemDate ? (
                        new Date(record.fwc.redeemDate).toLocaleDateString(
                          'id-ID',
                          {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          }
                        )
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    {/* Reason/Keterangan */}
                    <td className="border-l-2 border-gray-200 px-3 py-3 text-xs text-blue-700">
                      Data di FWC tapi tidak ada di Excel Whoosh
                    </td>
                  </tr>
                ))}
              </>
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

          {pagination.page > 3 && pagination.totalPages > 5 && (
            <>
              <button
                onClick={() => setPagination((pg) => ({ ...pg, page: 1 }))}
                className="rounded px-3 py-1 hover:bg-gray-100"
              >
                1
              </button>
              <span className="px-1 text-gray-400">...</span>
            </>
          )}

          {getVisiblePages().map((p) => (
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

          {pagination.page < pagination.totalPages - 2 && pagination.totalPages > 5 && (
            <>
              <span className="px-1 text-gray-400">...</span>
              <button
                onClick={() =>
                  setPagination((pg) => ({ ...pg, page: pagination.totalPages }))
                }
                className="rounded px-3 py-1 hover:bg-gray-100"
              >
                {pagination.totalPages}
              </button>
            </>
          )}

          <button
            disabled={pagination.page === pagination.totalPages}
            onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
            className="rounded p-1 hover:bg-gray-100 disabled:opacity-50"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
