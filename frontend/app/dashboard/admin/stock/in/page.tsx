'use client';

import { useState } from 'react';
import { StockSummary } from '@/app/dashboard/admin/stock/components/StockSummary';
import { StockTabs } from '@/app/dashboard/admin/stock/components/StockTabs';

type CardCategory = 'Gold' | 'Silver' | 'KAI';
type CardType = 'JaBan' | 'JaKa' | 'KaBan' | '';

interface StockIn {
  id: string;
  tanggal: string;
  category: CardCategory;
  type: CardType;
  stock: number;
}

export default function StockInPage() {
  const [showForm, setShowForm] = useState(false);
  const [stockData, setStockData] = useState<StockIn[]>([]);

  const [form, setForm] = useState<Omit<StockIn, 'id'>>({
    tanggal: '',
    category: 'Gold',
    type: '',
    stock: 0,
  });

  const handleChange = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    if (!form.tanggal || form.stock <= 0) return;

    // Card Type hanya wajib untuk Gold & Silver
    if (form.category !== 'KAI' && !form.type) return;

    const payload: StockIn = {
      id: Date.now().toString(),
      tanggal: form.tanggal,
      category: form.category,
      type: form.category === 'KAI' ? '' : form.type,
      stock: form.stock,
    };

    setStockData((prev) => [...prev, payload]);

    setForm({
      tanggal: '',
      category: 'Gold',
      type: '',
      stock: 0,
    });

    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      {/* SUMMARY */}
      <StockSummary />

      {/* TABS */}
      <StockTabs />

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Stock In (Vendor → Admin)</h2>
        <button onClick={() => setShowForm(!showForm)} className="rounded-md bg-[#8D1231] px-4 py-2 text-sm font-medium text-white">
          Tambah
        </button>
      </div>

      {/* FORM INPUT */}
      {showForm && (
        <div className="rounded-lg border bg-white p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* TANGGAL */}
            <div>
              <label className="mb-1 block text-sm font-medium">Tanggal Masuk</label>
              <input type="date" className="w-full rounded border px-3 py-2" value={form.tanggal} onChange={(e) => handleChange('tanggal', e.target.value)} />
            </div>

            {/* CATEGORY */}
            <div>
              <label className="mb-1 block text-sm font-medium">Card Category</label>
              <select className="w-full rounded border px-3 py-2" value={form.category} onChange={(e) => handleChange('category', e.target.value as CardCategory)}>
                <option value="Gold">Gold</option>
                <option value="Silver">Silver</option>
                <option value="KAI">KAI</option>
              </select>
            </div>

            {/* CARD TYPE */}
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium">Card Type</label>
              <select className="w-full rounded border px-3 py-2 disabled:bg-gray-100" disabled={form.category === 'KAI'} value={form.type} onChange={(e) => handleChange('type', e.target.value as CardType)}>
                <option value="">Pilih Card Type</option>
                <option value="JaBan">JaBan</option>
                <option value="JaKa">JaKa</option>
                <option value="KaBan">KaBan</option>
              </select>
              {form.category === 'KAI' && <p className="mt-1 text-xs text-gray-500">Card Type tidak diperlukan untuk KAI</p>}
            </div>

            {/* STOCK */}
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium">Jumlah Stock</label>
              <input type="number" min={1} className="w-full rounded border px-3 py-2" value={form.stock || ''} onChange={(e) => handleChange('stock', Number(e.target.value))} />
            </div>
          </div>

          {/* ACTION */}
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="rounded border px-4 py-2 text-sm">
              Batal
            </button>
            <button onClick={handleSubmit} className="rounded bg-[#8D1231] px-4 py-2 text-sm text-white">
              Simpan
            </button>
          </div>
        </div>
      )}

      {/* TABLE */}
      <div className="rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b">
            <tr>
              <th className="p-4 text-left">Tanggal</th>
              <th className="p-4 text-left">Category</th>
              <th className="p-4 text-left">Type</th>
              <th className="p-4 text-left">Stock Masuk</th>
            </tr>
          </thead>
          <tbody>
            {stockData.map((row) => (
              <tr key={row.id} className="border-b">
                <td className="p-4">{row.tanggal}</td>
                <td className="p-4">{row.category}</td>
                <td className="p-4">{row.type || '-'}</td>
                <td className="p-4">{row.stock.toLocaleString()}</td>
              </tr>
            ))}

            {stockData.length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-gray-500">
                  Belum ada data stock masuk
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
