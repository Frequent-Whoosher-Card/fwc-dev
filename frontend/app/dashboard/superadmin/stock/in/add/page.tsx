'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import axios from '@/lib/axios';

/* ======================
   TYPES
====================== */
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

/* ======================
   COMPONENT
====================== */
export default function AddStockInPage() {
  const router = useRouter();
  const today = new Date().toISOString().split('T')[0];

  /* ======================
     STATE
  ===================== */
  const [products, setProducts] = useState<CardProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSerial, setLoadingSerial] = useState(false);

  const [form, setForm] = useState({
    tanggal: today,
    productId: '',
    initialSerial: '',
    lastSerial: '',
  });

  /* ======================
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

  /* ======================
     FETCH AVAILABLE SERIAL (🔥 BARU)
  ===================== */
  const fetchAvailableSerial = async (productId: string) => {
    try {
      setLoadingSerial(true);

      const res = await axios.get('/stock/in/available-serials', {
        params: { cardProductId: productId },
      });

      const startSerial = res.data?.data?.startSerial;

      // 🔴 JIKA SERIAL TIDAK TERSEDIA
      if (!startSerial) {
        setForm((prev) => ({
          ...prev,
          initialSerial: '',
          lastSerial: '',
        }));

        toast.error('Nomor Serial Belum Tersedia');
        return;
      }

      // ✅ JIKA SERIAL ADA
      if (typeof startSerial === 'string') {
        const lastFiveDigits = startSerial.slice(-5);

        setForm((prev) => ({
          ...prev,
          initialSerial: lastFiveDigits,
          lastSerial: '',
        }));
      } else {
        console.error('Invalid startSerial format:', res.data);
        toast.error('Format serial number tidak valid');
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengambil available serial');
    } finally {
      setLoadingSerial(false);
    }
  };

  /* ======================
     HANDLE SUBMIT
  ===================== */
  const handleSubmit = async () => {
    if (!form.tanggal || !form.productId || !form.initialSerial || !form.lastSerial) {
      toast.error('Semua field wajib diisi');
      return;
    }

    const start = Number(form.initialSerial);
    const end = Number(form.lastSerial);

    if (isNaN(start) || isNaN(end)) {
      toast.error('Serial harus berupa angka');
      return;
    }

    if (end < start) {
      toast.error('Range serial tidak valid');
      return;
    }

    setLoading(true);
    try {
      await axios.post('/stock/in', {
        movementAt: new Date(form.tanggal).toISOString(),
        productId: form.productId,
        startSerial: form.initialSerial.padStart(4, '0'),
        endSerial: form.lastSerial.padStart(4, '0'),
        note: '',
      });

      toast.success('Stock berhasil ditambahkan');
      router.push('/dashboard/superadmin/stock/in');
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error?.message || err.response?.data?.message || 'Gagal menyimpan stock');
    } finally {
      setLoading(false);
    }
  };

  /* ======================
     RENDER
  ===================== */
  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex items-center gap-4 px-6">
        <button onClick={() => router.back()} className="rounded-lg border p-2 hover:bg-gray-100">
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-lg font-semibold">Add Stock-In</h2>
      </div>

      {/* FORM */}
      <div className="px-6">
        <div className="rounded-xl border bg-white p-6 space-y-6">
          {/* DATE */}
          <div>
            <label className="text-sm font-medium">Date</label>
            <input
              type="date"
              className="w-full rounded-lg border px-4 py-2"
              value={form.tanggal}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  tanggal: e.target.value,
                }))
              }
            />
          </div>

          {/* CARD PRODUCT */}
          <div>
            <label className="text-sm font-medium">Card Product</label>
            <select
              className="w-full rounded-lg border px-4 py-2"
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
                  fetchAvailableSerial(productId); // 🔥 AUTO FILL
                }
              }}
            >
              <option value="">-- Pilih Card Product --</option>
              {products
                .filter((p) => p.isActive !== false)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.category?.categoryName} - {p.type?.typeName}
                  </option>
                ))}
            </select>
          </div>

          {/* SERIAL */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Initial Serial</label>
              <input className="w-full rounded-lg border px-4 py-2" value={form.initialSerial} disabled placeholder={loadingSerial ? 'Loading...' : ''} />
            </div>

            <div>
              <label className="text-sm font-medium">Last Serial</label>
              <input
                className="w-full rounded-lg border px-4 py-2"
                value={form.lastSerial}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    lastSerial: e.target.value,
                  }))
                }
                disabled={!form.productId}
              />
            </div>
          </div>

          {/* SUBMIT */}
          <div className="flex justify-end">
            <button onClick={handleSubmit} disabled={loading} className="rounded-lg bg-[#8D1231] px-8 py-2 text-white hover:opacity-90 disabled:opacity-50">
              {loading ? 'Loading...' : 'Add Stock'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
