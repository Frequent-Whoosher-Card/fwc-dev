'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import axios from '@/lib/axios';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';

/* =====================
   TYPES
===================== */

type AllCardStatus = 'IN' | 'OUT' | 'TRANSFER' | 'USED' | 'DAMAGED';

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

export default function AddAllCardPage() {
  const router = useRouter();
  const today = new Date().toISOString().split('T')[0];

  /* =====================
     FORM STATE
  ===================== */

  const [form, setForm] = useState({
    tanggal: today,
    productId: '',
    senderStation: '',
    receiverStation: '',
    serialNumber: '',
    status: 'IN' as AllCardStatus,
    note: '',
  });

  /* =====================
     MASTER DATA
  ===================== */

  const [products, setProducts] = useState<CardProduct[]>([]);
  const [stations, setStations] = useState<StationItem[]>([]);

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
     FETCH STATION
  ===================== */

  useEffect(() => {
    const fetchStations = async () => {
      try {
        const res = await axios.get('/station', {
          params: { page: 1, limit: 100, search: '' },
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
     FETCH SERIAL (PLACEHOLDER)
  ===================== */

  const fetchAvailableSerial = async (productId: string) => {
    try {
      setLoadingSerial(true);

      // 🔵 PLACEHOLDER
      // nanti ganti endpoint All Card
      setTimeout(() => {
        setForm((prev) => ({
          ...prev,
          serialNumber: '0000001',
        }));
      }, 600);
    } finally {
      setLoadingSerial(false);
    }
  };

  /* =====================
     SUBMIT
  ===================== */

  const handleSubmit = async () => {
    if (!form.tanggal) return toast.error('Tanggal wajib diisi');
    if (!form.productId) return toast.error('Card Product wajib dipilih');
    if (!form.serialNumber) return toast.error('Serial number wajib diisi');

    try {
      // 🔵 ENDPOINT BELUM ADA
      // await axios.post('/all-card', payload);

      console.log('SUBMIT ALL CARD:', {
        date: form.tanggal,
        productId: form.productId,
        senderStation: form.senderStation,
        receiverStation: form.receiverStation,
        serialNumber: form.serialNumber,
        status: form.status,
        note: form.note,
      });

      toast.success('All Card berhasil ditambahkan (dummy)');
      router.push('/dashboard/superadmin/stock/allcard');
    } catch (err) {
      console.error(err);
      toast.error('Gagal menambahkan All Card');
    }
  };

  /* =====================
     UI
  ===================== */

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex items-center gap-4 px-4 sm:px-6">
        <button onClick={() => router.back()} className="rounded-lg border p-2 text-gray-600 hover:bg-gray-100">
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-lg font-semibold">Add All Card</h2>
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
                    serialNumber: '',
                  }));

                  if (productId) fetchAvailableSerial(productId);
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
            </div>

            {/* STATION */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium mb-2">Sender Station</label>
                <select className="w-full rounded-lg border px-4 py-3 text-sm" value={form.senderStation} onChange={(e) => setForm({ ...form, senderStation: e.target.value })}>
                  <option value="">Select Sender</option>
                  {stations.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.stationName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Receiver Station</label>
                <select className="w-full rounded-lg border px-4 py-3 text-sm" value={form.receiverStation} onChange={(e) => setForm({ ...form, receiverStation: e.target.value })}>
                  <option value="">Select Receiver</option>
                  {stations.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.stationName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* SERIAL NUMBER */}
            <div>
              <label className="block text-sm font-medium mb-2">Serial Number</label>
              <input className="w-full rounded-lg border px-4 py-3 text-sm" value={form.serialNumber} disabled placeholder={loadingSerial ? 'Loading...' : ''} />
            </div>

            {/* STATUS */}
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                className="w-full rounded-lg border px-4 py-3 text-sm"
                value={form.status}
                onChange={(e) =>
                  setForm({
                    ...form,
                    status: e.target.value as AllCardStatus,
                  })
                }
              >
                <option value="IN">IN</option>
                <option value="OUT">OUT</option>
                <option value="TRANSFER">TRANSFER</option>
                <option value="USED">USED</option>
                <option value="DAMAGED">DAMAGED</option>
              </select>
            </div>

            {/* NOTE */}
            <div>
              <label className="block text-sm font-medium mb-2">Note</label>
              <textarea rows={3} className="w-full rounded-lg border px-4 py-3 text-sm" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </div>

            {/* ACTION */}
            <div className="flex justify-end pt-6">
              <button onClick={handleSubmit} className="rounded-lg bg-[#8D1231] px-8 py-3 text-sm font-medium text-white hover:bg-[#7a102a] w-full sm:w-auto">
                Save All Card
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
