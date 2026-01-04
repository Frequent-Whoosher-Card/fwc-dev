'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import axios from '@/lib/axios';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';

/* =====================
   TYPES
===================== */
type StockOutStatus = 'SENT' | 'RECEIVED' | 'CANCELLED';
type Station = string;

interface Category {
  id: string;
  categoryName: string;
}

interface CardTypeItem {
  id: string;
  typeName: string;
  categoryId?: string;
}

interface OfficeStock {
  category?: { categoryName: string };
  type?: { typeName: string };
  cardOffice: number;
}

interface StationItem {
  id: string;
  stationName: string;
  stationCode: string;
  location: string;
}

/* =====================
   COMPONENT
===================== */
export default function AddStockOutPage() {
  const router = useRouter();

  /* =====================
     FORM STATE (PAKAI ID)
  ===================== */
  const [form, setForm] = useState({
    tanggal: '',
    categoryId: '',
    typeId: '',
    station: '',
    initialSerial: '',
    lastSerial: '',
    status: 'SENT' as StockOutStatus,
    note: '',
  });

  /* =====================
     MASTER DATA
  ===================== */
  const [categories, setCategories] = useState<Category[]>([]);
  const [types, setTypes] = useState<CardTypeItem[]>([]);

  /* =====================
     STOCK STATE
  ===================== */
  const [availableStock, setAvailableStock] = useState<number | null>(null);
  const [loadingStock, setLoadingStock] = useState(false);

  const [stations, setStations] = useState<StationItem[]>([]);

  /* =====================
     FETCH CATEGORY & TYPE
  ===================== */
  useEffect(() => {
    const fetchMaster = async () => {
      try {
        const [catRes, typeRes] = await Promise.all([axios.get('card/category'), axios.get('card/types')]);

        setCategories(catRes.data?.data ?? []);
        setTypes(typeRes.data?.data ?? []);
      } catch (err) {
        console.error(err);
        toast.error('Gagal mengambil data master');
      }
    };

    fetchMaster();
  }, []);

  /* =====================
     FILTER TYPE BY CATEGORY
  ===================== */
  const filteredTypes = useMemo(() => {
    if (!form.categoryId) return [];
    return types.filter((t) => !t.categoryId || t.categoryId === form.categoryId);
  }, [types, form.categoryId]);

  /* =====================
     FETCH OFFICE STOCK
  ===================== */
  useEffect(() => {
    if (!form.categoryId || !form.typeId) {
      setAvailableStock(null);
      return;
    }

    const fetchStock = async () => {
      try {
        setLoadingStock(true);

        const res = await axios.get('/inventory/office', {
          params: { page: '1', limit: '1000' },
        });

        const stocks: OfficeStock[] = res.data?.data?.stocks ?? [];

        const categoryName = categories.find((c) => c.id === form.categoryId)?.categoryName;

        const typeName = types.find((t) => t.id === form.typeId)?.typeName;

        let total = 0;

        stocks.forEach((s) => {
          if (s.category?.categoryName === categoryName && s.type?.typeName === typeName) {
            total += Number(s.cardOffice || 0);
          }
        });

        setAvailableStock(total);
      } catch (err) {
        console.error(err);
        setAvailableStock(0);
      } finally {
        setLoadingStock(false);
      }
    };

    fetchStock();
  }, [form.categoryId, form.typeId, categories, types]);

  //* =====================
  //    FETCH STATION
  //===================== */
  useEffect(() => {
    const fetchStations = async () => {
      try {
        const res = await axios.get('/station', {
          params: {
            page: 1,
            limit: 10,
            search: '',
          },
        });

        setStations(res.data?.data?.items ?? []);
      } catch (err) {
        console.error('FETCH STATION ERROR:', err);
        toast.error('Gagal mengambil data stasiun');
      }
    };

    fetchStations();
  }, []);

  /* =====================
     SUBMIT
  ===================== */
  const handleSubmit = async () => {
    if (!form.tanggal) return toast.error('Tanggal wajib diisi');
    if (!form.station) return toast.error('Stasiun wajib dipilih');
    if (!form.categoryId || !form.typeId) return toast.error('Category & Type wajib dipilih');
    if (!form.initialSerial || !form.lastSerial) return toast.error('Serial number wajib diisi');

    const start = Number(form.initialSerial);
    const end = Number(form.lastSerial);
    const total = end - start + 1;

    if (isNaN(start) || isNaN(end)) return toast.error('Serial harus angka');
    if (total <= 0) return toast.error('Range serial tidak valid');
    if ((availableStock ?? 0) < total) return toast.error('Stock tidak mencukupi');

    try {
      await axios.post('/stock/out', {
        movementAt: new Date(form.tanggal).toISOString(),
        categoryId: form.categoryId,
        typeId: form.typeId,
        stationId: form.station,
        startSerial: form.initialSerial,
        endSerial: form.lastSerial,
        note: form.note,
      });

      toast.success('Stock berhasil dikirim');
      router.push('/dashboard/superadmin/stock/out');
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Gagal mengirim stock');
    }
  };

  /* =====================
     UI (100% SAMA)
  ===================== */
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 px-4 sm:px-6">
        <button onClick={() => router.back()} className="rounded-lg border p-2 text-gray-600 hover:bg-gray-100">
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-lg font-semibold">Send Stock (Admin → Outlet)</h2>
      </div>

      <div className="w-full px-4 sm:px-6">
        <div className="rounded-xl border bg-white p-6 sm:p-8 lg:p-10">
          <div className="space-y-6">
            {/* DATE */}
            <div>
              <label className="block text-sm font-medium mb-2">Date</label>
              <input type="date" className="w-full rounded-lg border px-4 py-3 text-sm" value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} />
            </div>

            {/* CATEGORY */}
            <div>
              <label className="block text-sm font-medium mb-2">Card Category</label>
              <select
                className="w-full rounded-lg border px-4 py-3 text-sm"
                value={form.categoryId}
                onChange={(e) =>
                  setForm({
                    ...form,
                    categoryId: e.target.value,
                    typeId: '',
                  })
                }
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.categoryName}
                  </option>
                ))}
              </select>
            </div>

            {/* TYPE */}
            <div>
              <label className="block text-sm font-medium mb-2">Card Type</label>
              <select className="w-full rounded-lg border px-4 py-3 text-sm disabled:bg-gray-100" disabled={!form.categoryId} value={form.typeId} onChange={(e) => setForm({ ...form, typeId: e.target.value })}>
                <option value="">Select Card Type</option>
                {filteredTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.typeName}
                  </option>
                ))}
              </select>

              <p className="mt-2 text-sm text-gray-600">
                Stock tersedia: <span className="font-semibold text-[#8D1231]">{loadingStock ? '...' : availableStock ?? '-'}</span>
              </p>
            </div>

            {/* STATION */}
            <div>
              <label className="block text-sm font-medium mb-2">Stasiun</label>
              <select
                className="w-full rounded-lg border px-4 py-3 text-sm"
                value={form.station}
                onChange={(e) =>
                  setForm({
                    ...form,
                    station: e.target.value,
                  })
                }
              >
                <option value="">Pilih Stasiun</option>
                {stations.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.stationName}
                  </option>
                ))}
              </select>
            </div>

            {/* SERIAL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium mb-2">Initial Serial Number</label>
                <input
                  className="w-full rounded-lg border px-4 py-3 text-sm"
                  value={form.initialSerial}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      initialSerial: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Last Serial Number</label>
                <input
                  className="w-full rounded-lg border px-4 py-3 text-sm"
                  value={form.lastSerial}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      lastSerial: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            {/* NOTE */}
            <div>
              <label className="block text-sm font-medium mb-2">Note</label>
              <textarea rows={3} className="w-full rounded-lg border px-4 py-3 text-sm" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </div>

            {/* ACTION */}
            <div className="flex justify-end pt-6">
              <button onClick={handleSubmit} className="rounded-lg bg-[#8D1231] px-8 py-3 text-sm font-medium text-white hover:bg-[#7a102a] w-full sm:w-auto">
                Send Stock
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
