'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import axiosInstance from '@/lib/axios';
import { ChevronLeft, ChevronRight, Eye, Calendar, FileDown, Plus } from 'lucide-react';

/* ======================
   TYPES (SESUI DOC API)
====================== */

type CardStatus = 'IN_OFFICE' | 'IN_TRANSIT' | 'IN_STATION' | 'LOST' | 'DAMAGED' | 'SOLD_ACTIVE' | 'SOLD_INACTIVE';

interface AllCardItem {
  id: string;
  serialNumber: string;
  status: CardStatus;
  date: string;

  cardCategoryName: string;
  cardTypeName: string;
  stationName: string;

  note: string;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/* ======================
   CONSTANT
====================== */

const STATUS_OPTIONS: CardStatus[] = ['IN_OFFICE', 'IN_TRANSIT', 'IN_STATION', 'LOST', 'DAMAGED', 'SOLD_ACTIVE', 'SOLD_INACTIVE'];

/* ======================
   PAGE
====================== */

export default function AllCardPage() {
  const router = useRouter();

  /* ======================
      STATE
  ====================== */

  const [data, setData] = useState<AllCardItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });

  // FILTER
  const [status, setStatus] = useState<'all' | CardStatus>('all');
  const [category, setCategory] = useState('');
  const [type, setType] = useState('');
  const [search, setSearch] = useState('');
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
      const res = await axiosInstance.get('/cards', {
        params: {
          page: pagination.page,
          limit: pagination.limit,

          // 🔥 FILTER SESUAI DOC
          status: status === 'all' ? undefined : status,
          categoryName: category || undefined,
          typeName: type || undefined,
          search: search || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        },
      });

      const { items, pagination: paging } = res.data.data;

      const mapped: AllCardItem[] = items.map((item: any) => ({
        id: item.id,
        serialNumber: item.serialNumber,
        status: item.status,
        date: item.purchaseDate || item.createdAt,

        cardCategoryName: item.cardProduct?.category?.categoryName ?? '-',

        cardTypeName: item.cardProduct?.type?.typeName ?? '-',

        stationName: item.station?.stationName ?? '-',

        note: item.notes ?? '-',
      }));

      setData(mapped);
      setPagination(paging);
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengambil data All Card');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, status, category, type, search, startDate, endDate]);

  useEffect(() => {
    fetchAllCard();
  }, [fetchAllCard]);

  /* ======================
      PAGINATION HELPER
  ====================== */

  const getPaginationRange = (current: number, total: number, delta = 2): (number | '...')[] => {
    const range: (number | '...')[] = [];

    const left = Math.max(2, current - delta);
    const right = Math.min(total - 1, current + delta);

    range.push(1);

    if (left > 2) range.push('...');

    for (let i = left; i <= right; i++) {
      range.push(i);
    }

    if (right < total - 1) range.push('...');

    if (total > 1) range.push(total);

    return range;
  };

  const handleExportPDF = () => {
    toast('Export PDF (coming soon)');
  };

  /* ======================
      RENDER
  ====================== */

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="text-lg font-semibold">All Card</h2>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          {/* STATUS */}
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as any);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="rounded-md border px-3 py-2 text-sm"
          >
            <option value="all">All Status</option>
            {STATUS_OPTIONS.map((st) => (
              <option key={st} value={st}>
                {st.replace(/_/g, ' ')}
              </option>
            ))}
          </select>

          {/* CATEGORY */}
          <input
            placeholder="Category"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="rounded-md border px-3 py-2 text-sm"
          />

          {/* TYPE */}
          <input
            placeholder="Type"
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="rounded-md border px-3 py-2 text-sm"
          />

          {/* SEARCH */}
          <input
            placeholder="Search serial / station"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="rounded-md border px-3 py-2 text-sm"
          />

          {/* START DATE */}
          <div className="relative">
            <input
              ref={startDateRef}
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="rounded-md border px-3 py-2 pr-9 text-sm"
            />
            <button type="button" onClick={() => startDateRef.current?.showPicker?.()} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8D1231]">
              <Calendar size={16} />
            </button>
          </div>

          {/* END DATE */}
          <div className="relative">
            <input
              ref={endDateRef}
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="rounded-md border px-3 py-2 pr-9 text-sm"
            />
            <button type="button" onClick={() => endDateRef.current?.showPicker?.()} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8D1231]">
              <Calendar size={16} />
            </button>
          </div>

          {/* PDF */}
          <button onClick={handleExportPDF} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-gray-100">
            <FileDown size={16} /> PDF
          </button>

          {/* ADD */}
          <button onClick={() => router.push('/dashboard/superadmin/stock/allcard/add')} className="flex items-center gap-2 rounded-md bg-[#8D1231] px-4 py-2 text-sm text-white">
            <Plus size={16} /> Tambah
          </button>
        </div>
      </div>

      {/* DESKTOP TABLE */}
      <div className="hidden sm:block rounded-lg border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-3 py-2 text-center">No</th>
                <th className="px-3 py-2 text-center">Tanggal</th>
                <th className="px-3 py-2 text-center">Serial</th>
                <th className="px-3 py-2 text-center">Category</th>
                <th className="px-3 py-2 text-center">Type</th>
                <th className="px-3 py-2 text-center">Station</th>
                <th className="px-3 py-2 text-center">Status</th>
                <th className="px-3 py-2 text-center">Note</th>
                <th className="px-3 py-2 text-center">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-gray-500">
                    Tidak ada data
                  </td>
                </tr>
              ) : (
                data.map((row, index) => (
                  <tr key={row.id} className="border-b hover:bg-gray-50">
                    <td className="px-3 py-2 text-center">{(pagination.page - 1) * pagination.limit + index + 1}</td>
                    <td className="px-3 py-2 text-center">{new Date(row.date).toLocaleDateString('id-ID')}</td>
                    <td className="px-3 py-2 text-center">{row.serialNumber}</td>
                    <td className="px-3 py-2 text-center">{row.cardCategoryName}</td>
                    <td className="px-3 py-2 text-center">{row.cardTypeName}</td>
                    <td className="px-3 py-2 text-center">{row.stationName}</td>
                    <td className="px-3 py-2 text-center">
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs">{row.status.replace(/_/g, ' ')}</span>
                    </td>
                    <td className="px-3 py-2 text-center">{row.note}</td>
                    <td className="px-3 py-2 text-center">
                      <button onClick={() => router.push(`/dashboard/superadmin/stock/allcard/${row.id}`)} className="mx-auto flex h-8 w-8 items-center justify-center rounded-md border hover:bg-gray-100">
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

      {/* PAGINATION */}
      <div className="flex flex-wrap items-center justify-center gap-1 text-sm">
        <button disabled={pagination.page === 1} onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))} className="px-2 py-1 disabled:opacity-40">
          <ChevronLeft size={18} />
        </button>

        {getPaginationRange(pagination.page, pagination.totalPages).map((p, idx) =>
          p === '...' ? (
            <span key={`dots-${idx}`} className="px-2 text-gray-500">
              …
            </span>
          ) : (
            <button key={p} onClick={() => setPagination((pg) => ({ ...pg, page: p }))} className={`px-3 py-1 rounded ${p === pagination.page ? 'bg-[#8D1231] text-white font-semibold' : 'hover:bg-gray-100'}`}>
              {p}
            </button>
          )
        )}

        <button disabled={pagination.page === pagination.totalPages} onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))} className="px-2 py-1 disabled:opacity-40">
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
