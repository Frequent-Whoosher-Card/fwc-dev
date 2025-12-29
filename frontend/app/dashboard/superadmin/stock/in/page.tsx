'use client';

import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import { FileDown } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { StockSummary } from '@/app/dashboard/superadmin/stock/components/StockSummary';

type CardCategory = 'Gold' | 'Silver' | 'KAI';
type CardType = 'JaBan' | 'JaKa' | 'KaBan' | '';

interface StockIn {
  id: string;
  tanggal: string; // yyyy-mm-dd
  category: CardCategory;
  type: CardType;
  stock: number;
}

export default function StockInPage() {
  const router = useRouter();

  const [showForm, setShowForm] = useState(false);
  const [stockData, setStockData] = useState<StockIn[]>([]);

  // 🔥 FILTER DATE
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [form, setForm] = useState<Omit<StockIn, 'id'>>({
    tanggal: '',
    category: 'Gold',
    type: '',
    stock: 0,
  });

  // ========================
  // FILTERED DATA (REALTIME)
  // ========================
  const filteredStockData = useMemo(() => {
    return stockData.filter((item) => {
      if (fromDate && item.tanggal < fromDate) return false;
      if (toDate && item.tanggal > toDate) return false;
      return true;
    });
  }, [stockData, fromDate, toDate]);

  // ========================
  // HANDLERS
  // ========================
  const handleChange = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    if (!form.tanggal || form.stock <= 0) {
      toast.error('Tanggal dan jumlah stock wajib diisi');
      return;
    }

    if (form.category !== 'KAI' && !form.type) {
      toast.error('Card Type wajib untuk Gold & Silver');
      return;
    }

    const payload: StockIn = {
      id: Date.now().toString(),
      tanggal: form.tanggal,
      category: form.category,
      type: form.category === 'KAI' ? '' : form.type,
      stock: form.stock,
    };

    setStockData((prev) => [...prev, payload]);
    toast.success('Stock berhasil ditambahkan');

    setForm({
      tanggal: '',
      category: 'Gold',
      type: '',
      stock: 0,
    });

    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Yakin ingin menghapus data stock ini?')) return;

    setStockData((prev) => prev.filter((item) => item.id !== id));
    toast.success('Stock berhasil dihapus');
  };
  const handleExportPDF = () => {
    if (filteredStockData.length === 0) {
      toast.error('Tidak ada data untuk diexport');
      return;
    }

    const doc = new jsPDF();

    doc.setFontSize(14);
    doc.text('Laporan Stock In (Vendor → Admin)', 14, 15);

    if (fromDate || toDate) {
      doc.setFontSize(10);
      doc.text(`Periode: ${fromDate || '-'} s/d ${toDate || '-'}`, 14, 22);
    }

    autoTable(doc, {
      startY: fromDate || toDate ? 28 : 22,
      head: [['Tanggal', 'Category', 'Type', 'Stock Masuk']],
      body: filteredStockData.map((item) => [item.tanggal, item.category, item.type || '-', item.stock.toLocaleString()]),
      styles: {
        fontSize: 10,
      },
      headStyles: {
        fillColor: [141, 18, 49], // warna merah KCIC
      },
    });

    doc.save('laporan-stock-in.pdf');
  };

  // ========================
  // RENDER
  // ========================
  return (
    <div className="space-y-6">
      {/* SUMMARY */}
      <StockSummary />

      {/* HEADER */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="text-lg font-semibold">Stock In (Vendor → Admin)</h2>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {/* FILTER DARI */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Dari</label>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="rounded-md border px-3 py-1.5 text-sm" />
          </div>

          {/* FILTER SAMPAI */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Sampai</label>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="rounded-md border px-3 py-1.5 text-sm" />
          </div>

          {/* EXPORT PDF */}
          <button onClick={handleExportPDF} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-gray-100">
            <FileDown size={16} />
            PDF
          </button>

          {/* TAMBAH */}
          <button onClick={() => setShowForm(!showForm)} className="rounded-md bg-[#8D1231] px-4 py-2 text-sm font-medium text-white">
            Tambah
          </button>
        </div>
      </div>

      {/* FORM INPUT */}
      {showForm && (
        <div className="rounded-lg border bg-white p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tanggal Masuk</label>
              <input type="date" className="w-full rounded border px-3 py-2" value={form.tanggal} onChange={(e) => handleChange('tanggal', e.target.value)} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Card Category</label>
              <select className="w-full rounded border px-3 py-2" value={form.category} onChange={(e) => handleChange('category', e.target.value as CardCategory)}>
                <option value="Gold">Gold</option>
                <option value="Silver">Silver</option>
                <option value="KAI">KAI</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Card Type</label>
              <select className="w-full rounded border px-3 py-2 disabled:bg-gray-100" disabled={form.category === 'KAI'} value={form.type} onChange={(e) => handleChange('type', e.target.value as CardType)}>
                <option value="">Pilih Card Type</option>
                <option value="JaBan">JaBan</option>
                <option value="JaKa">JaKa</option>
                <option value="KaBan">KaBan</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Jumlah Stock</label>
              <input type="number" min={1} className="w-full rounded border px-3 py-2" value={form.stock || ''} onChange={(e) => handleChange('stock', Number(e.target.value))} />
            </div>
          </div>

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
      <div className="rounded-lg border bg-white overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="p-3 text-left">Tanggal</th>
              <th className="p-3 text-left">Category</th>
              <th className="p-3 text-left">Type</th>
              <th className="p-3 text-right">Stock Masuk</th>
              <th className="p-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredStockData.map((row) => (
              <tr key={row.id} className="border-b">
                <td className="p-3">{row.tanggal}</td>
                <td className="p-3">{row.category}</td>
                <td className="p-3">{row.type || '-'}</td>
                <td className="p-3 text-right font-medium">{row.stock.toLocaleString()}</td>
                <td className="p-3 text-center">
                  <div className="flex justify-center gap-2">
                    <button onClick={() => router.push(`/dashboard/superadmin/stock/in/${row.id}/edit`)} className="rounded-md border px-3 py-1 text-sm hover:bg-gray-100">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(row.id)} className="rounded border border-red-500 px-3 py-1 text-sm text-red-500 hover:bg-red-500 hover:text-white">
                      Hapus
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filteredStockData.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-500">
                  Tidak ada data pada rentang tanggal ini
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
