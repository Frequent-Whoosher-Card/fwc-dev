'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import axiosInstance from '@/lib/axios';
import { ChevronLeft, ChevronRight, Eye, Calendar, FileDown, Plus, Pencil } from 'lucide-react';
import StatusBadge from '@/components/ui/status-badge';

/* ======================
   TYPES
====================== */

type CardStatus = 'ON_REQUEST' | 'IN_OFFICE' | 'IN_TRANSIT' | 'IN_STATION' | 'LOST' | 'DAMAGED' | 'SOLD_ACTIVE' | 'SOLD_INACTIVE';

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

  // STATUS
  const [status, setStatus] = useState<'all' | CardStatus>('all');
  const [statusOptions, setStatusOptions] = useState<CardStatus[]>([]);

  // FILTER VALUE
  const [category, setCategory] = useState('');
  const [type, setType] = useState('');
  const [station, setStation] = useState('');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // FILTER OPTIONS
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [typeOptions, setTypeOptions] = useState<string[]>([]);
  const [stationOptions, setStationOptions] = useState<string[]>([]);

  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);

  /* ======================
      FETCH ALL CARD
  ====================== */

  const fetchAllCard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/cards', {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          status: status === 'all' ? undefined : status,
          categoryName: category || undefined,
          typeName: type || undefined,
          stationName: station || undefined,
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
    } catch {
      toast.error('Gagal mengambil data All Card');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, status, category, type, station, search, startDate, endDate]);

  useEffect(() => {
    fetchAllCard();
  }, [fetchAllCard]);

  /* ======================
      FETCH STATUS OPTIONS
  ====================== */

  useEffect(() => {
    axiosInstance
      .get('/cards', { params: { page: 1, limit: 100000 } })
      .then((res) => {
        const items = res.data?.data?.items ?? [];
        const unique = Array.from(new Set(items.map((i: any) => i.status as CardStatus)));
        setStatusOptions(unique);
      })
      .catch(() => {});
  }, []);

  /* ======================
      FETCH FILTER OPTIONS
  ====================== */

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [categoryRes, typeRes, stationRes] = await Promise.all([
          axiosInstance.get('/card/category/'),
          axiosInstance.get('/card/types/'),
          axiosInstance.get('/station/', {
            params: { page: 1, limit: 100000, search: '' },
          }),
        ]);

        setCategoryOptions((categoryRes.data?.data ?? []).map((c: any) => c.categoryName));
        setTypeOptions((typeRes.data?.data ?? []).map((t: any) => t.typeName));
        setStationOptions((stationRes.data?.data?.items ?? []).map((s: any) => s.stationName));
      } catch {
        toast.error('Gagal mengambil data filter');
      }
    };

    fetchFilters();
  }, []);

  /* ======================
      PAGINATION
  ====================== */

  const getPaginationRange = (current: number, total: number, delta = 2): (number | '...')[] => {
    const range: (number | '...')[] = [];
    range.push(1);

    const left = Math.max(2, current - delta);
    const right = Math.min(total - 1, current + delta);

    if (left > 2) range.push('...');
    for (let i = left; i <= right; i++) range.push(i);
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
      {/* HEADER + FILTER */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="text-lg font-semibold">All Card</h2>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as any);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="rounded-md border px-3 py-2 text-sm"
          >
            <option value="all">All Status</option>
            {statusOptions.map((st) => (
              <option key={st} value={st}>
                {st.replace(/_/g, ' ')}
              </option>
            ))}
          </select>

          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setType('');
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="rounded-md border px-3 py-2 text-sm"
          >
            <option value="">All Category</option>
            {categoryOptions.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="rounded-md border px-3 py-2 text-sm"
          >
            <option value="">All Type</option>
            {typeOptions.map((tp) => (
              <option key={tp} value={tp}>
                {tp}
              </option>
            ))}
          </select>

          <select
            value={station}
            onChange={(e) => {
              setStation(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="rounded-md border px-3 py-2 text-sm"
          >
            <option value="">All Station</option>
            {stationOptions.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          <input placeholder="Search serial number" value={search} onChange={(e) => setSearch(e.target.value)} className="rounded-md border px-3 py-2 text-sm" />

          <div className="relative">
            <input ref={startDateRef} type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rounded-md border px-3 py-2 pr-9 text-sm" />
            <button type="button" onClick={() => startDateRef.current?.showPicker?.()} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8D1231]">
              <Calendar size={16} />
            </button>
          </div>

          <div className="relative">
            <input ref={endDateRef} type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="rounded-md border px-3 py-2 pr-9 text-sm" />
            <button type="button" onClick={() => endDateRef.current?.showPicker?.()} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8D1231]">
              <Calendar size={16} />
            </button>
          </div>

          <button onClick={handleExportPDF} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-gray-100">
            <FileDown size={16} /> PDF
          </button>

          <button onClick={() => router.push('/dashboard/superadmin/stock/allcard/add')} className="flex items-center gap-2 rounded-md bg-[#8D1231] px-4 py-2 text-sm text-white">
            <Plus size={16} /> Tambah
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="rounded-lg border bg-white overflow-x-auto">
        <table className="min-w-[1400px] w-full text-sm">
          <thead className="bg-gray-100 border-b sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3">No</th>
              <th className="px-4 py-3">Tanggal</th>
              <th className="px-4 py-3">Serial</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Station</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Note</th>
              <th className="px-4 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={row.id} className="border-b odd:bg-white even:bg-gray-50">
                <td className="px-4 py-3 text-center">{(pagination.page - 1) * pagination.limit + i + 1}</td>
                <td className="px-4 py-3 text-center whitespace-nowrap">{new Date(row.date).toLocaleDateString('id-ID').replace(/\//g, '-')}</td>
                <td className="px-4 py-3 text-center whitespace-nowrap">{row.serialNumber}</td>
                <td className="px-4 py-3 text-center">{row.cardCategoryName}</td>
                <td className="px-4 py-3 text-center">{row.cardTypeName}</td>
                <td className="px-4 py-3 text-center">{row.stationName}</td>
                <td className="px-4 py-3 text-center">
                  <StatusBadge status={row.status} />
                </td>
                <td className="px-4 py-3 text-center">{row.note}</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex justify-center gap-2">
                    {/* <button onClick={() => router.push(`/dashboard/superadmin/stock/allcard/${row.id}`)} className="h-8 w-8 rounded-md border flex items-center justify-center">
                      <Eye size={16} />
                    </button> */}
                    <button
                      onClick={() => router.push(`/dashboard/superadmin/stock/allcard/${row.id}/edit`)}
                      className="
    h-8 px-3
    rounded-md border
    text-xs font-medium
    border-blue-500 text-blue-600
    hover:bg-blue-500 hover:text-white
    transition-colors duration-200
    flex items-center justify-center
  "
                    >
                      Edit
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="flex justify-center gap-1">
        <button disabled={pagination.page === 1} onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}>
          <ChevronLeft />
        </button>

        {getPaginationRange(pagination.page, pagination.totalPages).map((p, idx) =>
          p === '...' ? (
            <span key={idx} className="px-2 text-gray-500">
              …
            </span>
          ) : (
            <button key={idx} onClick={() => setPagination((pg) => ({ ...pg, page: p }))} className={`px-3 py-1 rounded ${p === pagination.page ? 'bg-[#8D1231] text-white font-semibold' : 'hover:bg-gray-100'}`}>
              {p}
            </button>
          )
        )}

        <button disabled={pagination.page === pagination.totalPages} onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}>
          <ChevronRight />
        </button>
      </div>
    </div>
  );
}
