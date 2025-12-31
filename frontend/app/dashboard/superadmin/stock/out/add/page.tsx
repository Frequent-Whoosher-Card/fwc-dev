'use client';

import { useStock } from '../../context/StockContext';
import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';

/* =====================
   TYPES
===================== */
type CardCategory = 'Gold' | 'Silver' | 'KAI';
type CardType = 'JaBan' | 'JaKa' | 'KaBan' | '';
type StockOutStatus = 'SENT' | 'RECEIVED' | 'CANCELLED';
type Station = 'Halim' | 'Karawang' | 'Padalarang' | 'Tegalluar';

export default function AddStockOutPage() {
  const router = useRouter();
  const { addStockOut, getAvailableStock } = useStock();

  /* =====================
     FORM STATE
  ===================== */
  const [form, setForm] = useState({
    tanggal: '',
    category: 'Gold' as CardCategory,
    type: '' as CardType,
    station: '' as Station | '',
    initialSerial: '',
    lastSerial: '',
    status: 'SENT' as StockOutStatus,
    note: '',
  });

  /* =====================
     DERIVED STATE (NO useEffect ❌)
  ===================== */
  const availableStock = useMemo(() => {
    if (!form.category) return 0;
    return getAvailableStock(form.category, form.type);
  }, [form.category, form.type, getAvailableStock]);

  /* =====================
     SUBMIT HANDLER
  ===================== */
  const handleSubmit = () => {
    if (!form.tanggal) {
      toast.error('Tanggal wajib diisi');
      return;
    }

    if (!form.station) {
      toast.error('Stasiun wajib dipilih');
      return;
    }

    if (form.category !== 'KAI' && !form.type) {
      toast.error('Card Type wajib diisi');
      return;
    }

    if (!form.initialSerial || !form.lastSerial) {
      toast.error('Serial number wajib diisi');
      return;
    }

    const start = parseInt(form.initialSerial, 10);
    const end = parseInt(form.lastSerial, 10);

    if (isNaN(start) || isNaN(end)) {
      toast.error('Serial number harus berupa angka');
      return;
    }

    const totalStock = end - start + 1;

    if (totalStock <= 0) {
      toast.error('Range serial number tidak valid');
      return;
    }

    if (totalStock > availableStock) {
      toast.error(`Stock tidak mencukupi. Tersedia: ${availableStock}`);
      return;
    }

    /* =====================
       SAVE TO CONTEXT
    ===================== */
    addStockOut({
      id: Date.now().toString(),
      tanggal: form.tanggal,
      category: form.category,
      type: form.category === 'KAI' ? '' : form.type,
      station: form.station,
      stock: totalStock,
      serialStart: form.initialSerial,
      status: form.status,
      note: form.note,
    });

    toast.success('Stock berhasil dikirim');
    router.push('/dashboard/superadmin/stock/out');
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
        <h2 className="text-lg font-semibold">Send Stock (Admin → Outlet)</h2>
      </div>

      {/* FORM */}
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
                value={form.category}
                onChange={(e) =>
                  setForm({
                    ...form,
                    category: e.target.value as CardCategory,
                    type: '',
                  })
                }
              >
                <option value="Gold">Gold</option>
                <option value="Silver">Silver</option>
                <option value="KAI">KAI</option>
              </select>
            </div>

            {/* TYPE */}
            <div>
              <label className="block text-sm font-medium mb-2">Card Type</label>
              <select className="w-full rounded-lg border px-4 py-3 text-sm disabled:bg-gray-100" disabled={form.category === 'KAI'} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as CardType })}>
                <option value="">Select Card Type</option>
                <option value="JaBan">JaBan</option>
                <option value="JaKa">JaKa</option>
                <option value="KaBan">KaBan</option>
              </select>

              {/* AVAILABLE STOCK */}
              <p className="mt-2 text-sm text-gray-600">
                Stock tersedia: <span className="font-semibold text-[#8D1231]">{availableStock}</span>
              </p>
            </div>

            {/* STATION */}
            <div>
              <label className="block text-sm font-medium mb-2">Stasiun</label>
              <select className="w-full rounded-lg border px-4 py-3 text-sm" value={form.station} onChange={(e) => setForm({ ...form, station: e.target.value as Station })}>
                <option value="">Pilih Stasiun</option>
                <option value="Halim">Halim</option>
                <option value="Karawang">Karawang</option>
                <option value="Padalarang">Padalarang</option>
                <option value="Tegalluar">Tegalluar</option>
              </select>
            </div>

            {/* SERIAL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium mb-2">Initial Serial Number</label>
                <input className="w-full rounded-lg border px-4 py-3 text-sm" value={form.initialSerial} onChange={(e) => setForm({ ...form, initialSerial: e.target.value })} />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Last Serial Number</label>
                <input className="w-full rounded-lg border px-4 py-3 text-sm" value={form.lastSerial} onChange={(e) => setForm({ ...form, lastSerial: e.target.value })} />
              </div>
            </div>

            {/* STATUS */}
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select className="w-full rounded-lg border px-4 py-3 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as StockOutStatus })}>
                <option value="SENT">Sent</option>
                <option value="RECEIVED">Received</option>
                <option value="CANCELLED">Cancelled</option>
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
                Send Stock
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
