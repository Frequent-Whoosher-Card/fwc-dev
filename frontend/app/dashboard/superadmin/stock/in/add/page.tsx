'use client';

import { useStock } from '../../context/StockContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';

type CardCategory = 'Gold' | 'Silver' | 'KAI';
type CardType = 'JaBan' | 'JaKa' | 'KaBan' | '';

export default function AddStockInPage() {
  const router = useRouter();
  const { addStockIn } = useStock();

  const [form, setForm] = useState({
    tanggal: '',
    category: 'Gold' as CardCategory,
    type: '' as CardType,
    initialSerial: '',
    lastSerial: '',
  });

  const handleSubmit = () => {
    // =====================
    // VALIDASI
    // =====================
    if (!form.tanggal) {
      toast.error('Tanggal wajib diisi');
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

    // =====================
    // SIMPAN KE CONTEXT
    // =====================
    addStockIn({
      id: Date.now().toString(),
      tanggal: form.tanggal,
      category: form.category,
      type: form.category === 'KAI' ? '' : form.type,
      stock: totalStock,
    });

    toast.success('Stock berhasil ditambahkan');

    // =====================
    // REDIRECT KE STOCK IN
    // =====================
    router.push('/dashboard/superadmin/stock/in');
  };

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex items-center gap-4 px-4 sm:px-6">
        <button
          onClick={() => router.back()}
          className="rounded-lg border p-2 text-gray-600 hover:bg-gray-100"
        >
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-lg font-semibold">Add Stock-In</h2>
      </div>

      {/* FORM CARD */}
      <div className="w-full px-4 sm:px-6">
        <div className="rounded-xl border bg-white p-6 sm:p-8 lg:p-10">
          <div className="space-y-6 sm:space-y-7">
            {/* DATE */}
            <div>
              <label className="block text-sm font-medium mb-2">Date</label>
              <input
                type="date"
                className="w-full rounded-lg border px-4 py-3 text-sm"
                value={form.tanggal}
                onChange={(e) =>
                  setForm({ ...form, tanggal: e.target.value })
                }
              />
            </div>

            {/* CATEGORY */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Card Category
              </label>
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
              <label className="block text-sm font-medium mb-2">
                Card Type
              </label>
              <select
                className="w-full rounded-lg border px-4 py-3 text-sm disabled:bg-gray-100"
                disabled={form.category === 'KAI'}
                value={form.type}
                onChange={(e) =>
                  setForm({ ...form, type: e.target.value as CardType })
                }
              >
                <option value="">Select Card Type</option>
                <option value="JaBan">JaBan</option>
                <option value="JaKa">JaKa</option>
                <option value="KaBan">KaBan</option>
              </select>
            </div>

            {/* SERIAL NUMBER */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Initial Serial Number
                </label>
                <input
                  className="w-full rounded-lg border px-4 py-3 text-sm"
                  value={form.initialSerial}
                  onChange={(e) =>
                    setForm({ ...form, initialSerial: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Last Serial Number
                </label>
                <input
                  className="w-full rounded-lg border px-4 py-3 text-sm"
                  value={form.lastSerial}
                  onChange={(e) =>
                    setForm({ ...form, lastSerial: e.target.value })
                  }
                />
              </div>
            </div>

            {/* ACTION */}
            <div className="flex justify-end pt-6 sm:pt-8">
              <button
                onClick={handleSubmit}
                className="rounded-lg bg-[#8D1231] px-8 py-3 text-sm font-medium text-white hover:bg-[#7a102a] w-full sm:w-auto"
              >
                Add Stock
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
