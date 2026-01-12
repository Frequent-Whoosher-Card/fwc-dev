'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import axiosInstance from '@/lib/axios';
import { ChevronLeft, ChevronRight, Eye, Calendar, FileDown, Plus } from 'lucide-react';

/* ======================
    TYPES
====================== */

type AllCardStatus = 'IN' | 'OUT' | 'TRANSFER' | 'USED' | 'DAMAGED' | 'UNKNOWN';

interface AllCardItem {
  id: string;
  date: string;
  serialNumbers: string[];

  cardCategory: {
    id: string;
    name: string;
    code: string;
  };

  cardType: {
    id: string;
    name: string;
    code: string;
  };

  senderStation?: string | null;
  receiverStation?: string | null;

  status: AllCardStatus;
  note?: string | null;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/* ======================
    HELPERS
====================== */

const formatSerialNumbers = (serials: string[]) => {
  if (!serials || serials.length === 0) return '-';
  if (serials.length <= 5) return serials.join(', ');
  return `${serials[0]} - ${serials[serials.length - 1]} (${serials.length})`;
};

/* ======================
    PAGE
====================== */

export default function AllCardPage() {
  const router = useRouter();

  const [data, setData] = useState<AllCardItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });

  // FILTER STATE
  const [status, setStatus] = useState('all');
  const [category, setCategory] = useState('all');
  const [type, setType] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);

  /* ======================
      FETCH DATA
  ====================== */

  const fetchAllCard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/allcard', {
        params: {
          page: pagination.page,
          limit: pagination.limit,
        },
      });

      const { items, pagination: paging } = res.data.data;
      setData(items);
      setPagination(paging);
    } catch (error) {
      toast.error('Gagal mengambil data All Card');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit]);

  useEffect(() => {
    fetchAllCard();
  }, [fetchAllCard]);

  /* ======================
      FILTER LOGIC
  ====================== */

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const statusMatch = status === 'all' || item.status === status;
      const categoryMatch = category === 'all' || item.cardCategory.name === category;
      const typeMatch = type === 'all' || item.cardType.name === type;

      const date = new Date(item.date);
      const startMatch = startDate ? date >= new Date(startDate) : true;
      const endMatch = endDate ? date <= new Date(`${endDate}T23:59:59`) : true;

      return statusMatch && categoryMatch && typeMatch && startMatch && endMatch;
    });
  }, [data, status, category, type, startDate, endDate]);

  const pageNumbers = Array.from({ length: pagination.totalPages }, (_, i) => i + 1);

  /* ======================
      EXPORT PDF (STUB)
  ====================== */
  const handleExportPDF = () => {
    toast('Export PDF (coming soon)');
  };

  /* ======================
      RENDER
  ====================== */

  return (
    <div className="space-y-6">
      {/* =====================
          HEADER
      ===================== */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="text-lg font-semibold">All Card</h2>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          {/* STATUS */}
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-md border px-3 py-2 text-sm">
            <option value="all">All Status</option>
            <option value="IN">IN</option>
            <option value="OUT">OUT</option>
            <option value="TRANSFER">TRANSFER</option>
            <option value="USED">USED</option>
            <option value="DAMAGED">DAMAGED</option>
          </select>

          {/* CATEGORY */}
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-md border px-3 py-2 text-sm">
            <option value="all">All Category</option>
            {[...new Set(data.map((d) => d.cardCategory.name))].filter(Boolean).map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

          {/* TYPE */}
          <select value={type} onChange={(e) => setType(e.target.value)} className="rounded-md border px-3 py-2 text-sm">
            <option value="all">All Type</option>
            {[...new Set(data.map((d) => d.cardType.name))].filter(Boolean).map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

          {/* START DATE */}
          <div className="relative">
            <input ref={startDateRef} type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rounded-md border px-3 py-2 pr-9 text-sm" />
            <button type="button" onClick={() => startDateRef.current?.showPicker?.()} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8D1231]">
              <Calendar size={16} />
            </button>
          </div>

          {/* END DATE */}
          <div className="relative">
            <input ref={endDateRef} type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="rounded-md border px-3 py-2 pr-9 text-sm" />
            <button type="button" onClick={() => endDateRef.current?.showPicker?.()} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8D1231]">
              <Calendar size={16} />
            </button>
          </div>

          {/* PDF */}
          <button onClick={handleExportPDF} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-gray-100">
            <FileDown size={16} /> PDF
          </button>

          {/* TAMBAH */}
          <button onClick={() => router.push('/dashboard/superadmin/stock/allcard/add')} className="flex items-center gap-2 rounded-md bg-[#8D1231] px-4 py-2 text-sm text-white">
            <Plus size={16} /> Tambah
          </button>
        </div>
      </div>

      {/* =====================
          DESKTOP / TABLET
      ===================== */}
      <div className="hidden sm:block rounded-lg border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] text-sm">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-3 py-2 text-center">No</th>
                <th className="px-3 py-2 text-center">Tanggal</th>
                <th className="px-3 py-2 text-center">Serial Number</th>
                <th className="px-3 py-2 text-center">Category</th>
                <th className="px-3 py-2 text-center">Type</th>
                <th className="px-3 py-2 text-center">Pengirim</th>
                <th className="px-3 py-2 text-center">Penerima</th>
                <th className="px-3 py-2 text-center">Status</th>
                <th className="px-3 py-2 text-center">Note</th>
                <th className="px-3 py-2 text-center">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-gray-500">
                    Tidak ada data
                  </td>
                </tr>
              ) : (
                filteredData.map((row, index) => (
                  <tr key={row.id} className="border-b hover:bg-gray-50">
                    <td className="px-3 py-2 text-center">{(pagination.page - 1) * pagination.limit + index + 1}</td>
                    <td className="px-3 py-2 text-center">{new Date(row.date).toLocaleDateString('id-ID')}</td>
                    <td className="px-3 py-2 text-center max-w-[220px] truncate">{formatSerialNumbers(row.serialNumbers)}</td>
                    <td className="px-3 py-2 text-center">{row.cardCategory.name}</td>
                    <td className="px-3 py-2 text-center">{row.cardType.name}</td>
                    <td className="px-3 py-2 text-center">{row.senderStation || '-'}</td>
                    <td className="px-3 py-2 text-center">{row.receiverStation || '-'}</td>
                    <td className="px-3 py-2 text-center">
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs">{row.status}</span>
                    </td>
                    <td className="px-3 py-2 text-center max-w-[200px] truncate">{row.note || '-'}</td>
                    <td className="px-3 py-2 text-center">
                      <button onClick={() => router.push(`/dashboard/superadmin/all-card/${row.id}`)} className="mx-auto flex h-8 w-8 items-center justify-center rounded-md border hover:bg-gray-100">
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =====================
          MOBILE / CARD VIEW
      ===================== */}
      <div className="block sm:hidden space-y-4">
        {filteredData.map((row, index) => (
          <div key={row.id} className="rounded-lg border bg-white p-4 space-y-2">
            <div className="flex justify-between">
              <span className="font-semibold">#{(pagination.page - 1) * pagination.limit + index + 1}</span>
              <span className="text-xs text-gray-500">{new Date(row.date).toLocaleDateString('id-ID')}</span>
            </div>

            <div>
              <p className="text-xs text-gray-500">Serial</p>
              <p className="text-sm font-medium truncate">{formatSerialNumbers(row.serialNumbers)}</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs text-gray-500">Category</p>
                <p className="text-sm">{row.cardCategory.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Type</p>
                <p className="text-sm">{row.cardType.name}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs text-gray-500">Pengirim</p>
                <p className="text-sm">{row.senderStation || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Penerima</p>
                <p className="text-sm">{row.receiverStation || '-'}</p>
              </div>
            </div>

            <span className="inline-block rounded-full bg-gray-100 px-3 py-1 text-xs">{row.status}</span>

            {row.note && <p className="text-sm text-gray-600 truncate">{row.note}</p>}

            <button onClick={() => router.push(`/dashboard/superadmin/all-card/${row.id}`)} className="w-full rounded-md border px-3 py-2 text-sm hover:bg-gray-100">
              Detail
            </button>
          </div>
        ))}
      </div>

      {/* PAGINATION */}
      <div className="flex flex-wrap justify-center gap-2 text-sm">
        <button disabled={pagination.page === 1} onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))} className="px-2 disabled:opacity-40">
          <ChevronLeft size={18} />
        </button>

        {pageNumbers.map((p) => (
          <button key={p} onClick={() => setPagination((pg) => ({ ...pg, page: p }))} className={`px-3 py-1 ${p === pagination.page ? 'font-semibold underline' : ''}`}>
            {p}
          </button>
        ))}

        <button disabled={pagination.page === pagination.totalPages} onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))} className="px-2 disabled:opacity-40">
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
