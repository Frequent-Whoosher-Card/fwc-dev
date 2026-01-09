'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import axios from '@/lib/axios';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';

/* =====================
   TYPES
===================== */
type StockOutStatus = 'SENT' | 'RECEIVED' | 'CANCELLED';

interface CardProduct {
  id: string;
  category?: {
    categoryName: string;
  };
  type?: {
    typeName: string;
  };
  isActive?: boolean;
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
  const today = new Date().toISOString().split('T')[0];

  /* =====================
     FORM STATE
  ===================== */
  const [form, setForm] = useState({
    tanggal: today,
    productId: '',
    station: '',
    initialSerial: '',
    lastSerial: '',
    status: 'SENT' as StockOutStatus,
    note: '',
  });

  /* =====================
     MASTER DATA
  ===================== */
  const [products, setProducts] = useState<CardProduct[]>([]);
  const [stations, setStations] = useState<StationItem[]>([]);

  /* =====================
     STOCK STATE
  ===================== */
  const [availableStock, setAvailableStock] = useState<number | null>(null);
  const [loadingStock, setLoadingStock] = useState(false);
  const [loadingSerial, setLoadingSerial] = useState(false);

  /* =====================
     FETCH CARD PRODUCT
  ===================== */
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get('/card/product');
        setProducts(res.data?.data ?? []);
      } catch (err) {
        console.error(err);
        toast.error('Gagal mengambil data card product');
      }
    };

    fetchProducts();
  }, []);

  /* =====================
     FETCH OFFICE STOCK
  ===================== */
  useEffect(() => {
    if (!form.productId) {
      setAvailableStock(null);
      return;
    }

    const fetchStock = async () => {
      try {
        setLoadingStock(true);

        const selectedProduct = products.find((p) => p.id === form.productId);
        if (!selectedProduct) {
          setAvailableStock(0);
          return;
        }

        const categoryName = selectedProduct.category?.categoryName;
        const typeName = selectedProduct.type?.typeName;

        const res = await axios.get('/inventory/office', {
          params: {
            page: 1,
            limit: 1000,
            categoryName,
            typeName,
          },
        });

        const stocks = res.data?.data?.stocks ?? [];

        let total = 0;
        stocks.forEach((s: any) => {
          total += Number(s.cardOffice || 0);
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
  }, [form.productId, products]);

  /* =====================
     FETCH AVAILABLE SERIAL (STOCK OUT)
  ===================== */
  const fetchAvailableOutSerial = async (productId: string) => {
    try {
      setLoadingSerial(true);

      const res = await axios.get('/stock/out/available-serials', {
        params: { cardProductId: productId },
      });

      const startSerial: string | null = res.data?.data?.startSerial ?? null;

      // 🔴 SERIAL BELUM TERSEDIA
      if (!startSerial) {
        setForm((prev) => ({
          ...prev,
          initialSerial: '',
          lastSerial: '',
        }));

        toast.error('Nomor Serial Belum Tersedia');
        return;
      }

      // ✅ AMBIL 5 DIGIT TERAKHIR
      const lastFiveDigits = startSerial.slice(-5);

      setForm((prev) => ({
        ...prev,
        initialSerial: lastFiveDigits,
        lastSerial: '',
      }));
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengambil available serial');
    } finally {
      setLoadingSerial(false);
    }
  };

  /* =====================
     FETCH STATION
  ===================== */
  useEffect(() => {
    const fetchStations = async () => {
      try {
        const res = await axios.get('/station', {
          params: { page: 1, limit: 10, search: '' },
        });

        setStations(res.data?.data?.items ?? []);
      } catch (err) {
        console.error(err);
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
    if (!form.productId) return toast.error('Card Product wajib dipilih');
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
        productId: form.productId,
        stationId: form.station,
        startSerial: form.initialSerial,
        endSerial: form.lastSerial,
        note: form.note,
      });

      toast.success('Stock berhasil dikirim');
      router.push('/dashboard/superadmin/stock/out');
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error?.message || err.response?.data?.message || 'Gagal mengirim stock');
    }
  };

  /* =====================
     UI (TIDAK DIUBAH)
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

            {/* CARD PRODUCT */}
            <div>
              <label className="block text-sm font-medium mb-2">Card Product</label>
              <select
                className="w-full rounded-lg border px-4 py-3 text-sm"
                value={form.productId}
                onChange={(e) => {
                  const productId = e.target.value;

                  setForm((prev) => ({
                    ...prev,
                    productId,
                    initialSerial: '',
                    lastSerial: '',
                  }));

                  if (productId) {
                    fetchAvailableOutSerial(productId);
                  }
                }}
              >
                <option value="">Select Card Product</option>
                {products
                  .filter((p) => p.isActive !== false)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.category?.categoryName} - {p.type?.typeName}
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
              <select className="w-full rounded-lg border px-4 py-3 text-sm" value={form.station} onChange={(e) => setForm({ ...form, station: e.target.value })}>
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
                <input className="w-full rounded-lg border px-4 py-3 text-sm" value={form.initialSerial} disabled placeholder={loadingSerial ? 'Loading...' : ''} />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Last Serial Number</label>
                <input className="w-full rounded-lg border px-4 py-3 text-sm" value={form.lastSerial} onChange={(e) => setForm({ ...form, lastSerial: e.target.value })} disabled={!form.productId} />
              </div>
            </div>

            {/* NOTE */}
            {/* <div>
              <label className="block text-sm font-medium mb-2">Note</label>
              <textarea rows={3} className="w-full rounded-lg border px-4 py-3 text-sm" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </div> */}

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
