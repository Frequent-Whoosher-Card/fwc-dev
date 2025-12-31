'use client';

import { useRouter, useParams } from 'next/navigation';
import { useStock } from '../../../context/StockContext';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';

type CardCategory = 'Gold' | 'Silver' | 'KAI';
type CardType = 'JaBan' | 'JaKa' | 'KaBan' | '';

export default function EditStockInPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { stockIn, updateStockIn } = useStock();

  const existingData = stockIn.find((item) => item.id === id);

  const [form, setForm] = useState({
    tanggal: '',
    category: 'Gold' as CardCategory,
    type: '' as CardType,
    stock: 0,
  });

  // 🔥 LOAD DATA DARI CONTEXT
  useEffect(() => {
    if (!existingData) return;

    setForm({
      tanggal: existingData.tanggal,
      category: existingData.category,
      type: existingData.type,
      stock: existingData.stock,
    });
  }, [existingData]);

  if (!existingData) {
    return <div className="p-6 text-gray-500">Data tidak ditemukan</div>;
  }

  const handleSubmit = () => {
    if (!form.tanggal || form.stock <= 0) {
      toast.error('Data tidak valid');
      return;
    }

    if (form.category !== 'KAI' && !form.type) {
      toast.error('Card Type wajib diisi');
      return;
    }

    // 🔥 UPDATE KE CONTEXT
    updateStockIn(id, {
      tanggal: form.tanggal,
      category: form.category,
      type: form.category === 'KAI' ? '' : form.type,
      stock: form.stock,
    });

    toast.success('Stock berhasil diupdate');
    router.push('/dashboard/superadmin/stock/in');
  };

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex items-center gap-4 px-4 sm:px-6">
        <button onClick={() => router.back()} className="rounded-lg border p-2 text-gray-600 hover:bg-gray-100">
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-lg font-semibold">Edit Stock-In</h2>
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
              <select
                className="w-full rounded-lg border px-4 py-3 text-sm disabled:bg-gray-100"
                disabled={form.category === 'KAI'}
                value={form.type}
                onChange={(e) =>
                  setForm({
                    ...form,
                    type: e.target.value as CardType,
                  })
                }
              >
                <option value="">Select Card Type</option>
                <option value="JaBan">JaBan</option>
                <option value="JaKa">JaKa</option>
                <option value="KaBan">KaBan</option>
              </select>
            </div>

            {/* STOCK */}
            <div>
              <label className="block text-sm font-medium mb-2">Jumlah Stock</label>
              <input
                type="number"
                min={1}
                className="w-full rounded-lg border px-4 py-3 text-sm"
                value={form.stock}
                onChange={(e) =>
                  setForm({
                    ...form,
                    stock: Number(e.target.value),
                  })
                }
              />
            </div>

            {/* ACTION */}
            <div className="flex justify-end gap-2 pt-6">
              <button onClick={() => router.back()} className="rounded-md border px-4 py-2 text-sm">
                Batal
              </button>

              <button onClick={handleSubmit} className="rounded-md bg-[#8D1231] px-4 py-2 text-sm text-white">
                Simpan
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
