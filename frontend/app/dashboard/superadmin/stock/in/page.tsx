'use client';

import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { useStock } from '../context/StockContext';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { FileDown } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { StockSummary } from '@/app/dashboard/superadmin/stock/components/StockSummary';

export default function StockInPage() {
  const router = useRouter();
const { stockIn, deleteStockIn } = useStock();

  // FILTER DATE
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // FILTER DATA
  const filteredStockIn = useMemo(() => {
    return stockIn.filter((item) => {
      if (fromDate && item.tanggal < fromDate) return false;
      if (toDate && item.tanggal > toDate) return false;
      return true;
    });
  }, [stockIn, fromDate, toDate]);

  const handleExportPDF = () => {
    if (filteredStockIn.length === 0) {
      toast.error('Tidak ada data untuk diexport');
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text('Laporan Stock In (Vendor → Admin)', 14, 15);

    autoTable(doc, {
      startY: 22,
      head: [['Tanggal', 'Category', 'Type', 'Stock Masuk']],
      body: filteredStockIn.map((item) => [
        item.tanggal,
        item.category,
        item.type || '-',
        item.stock.toLocaleString(),
      ]),
      headStyles: {
        fillColor: [141, 18, 49],
      },
    });

    doc.save('laporan-stock-in.pdf');
  };

  const [openDelete, setOpenDelete] = useState(false);
const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* SUMMARY */}
      <StockSummary />

      {/* HEADER */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="text-lg font-semibold">
          Stock In (Vendor → Admin)
        </h2>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {/* FILTER FROM */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Dari</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="rounded-md border px-3 py-1.5 text-sm"
            />
          </div>

          {/* FILTER TO */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Sampai</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="rounded-md border px-3 py-1.5 text-sm"
            />
          </div>

          {/* EXPORT */}
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-gray-100"
          >
            <FileDown size={16} />
            PDF
          </button>

          {/* ADD */}
          <button
            onClick={() =>
              router.push('/dashboard/superadmin/stock/in/add')
            }
            className="rounded-md bg-[#8D1231] px-4 py-2 text-sm font-medium text-white"
          >
            Tambah
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="rounded-lg border bg-white overflow-x-auto">
        <table className="w-full text-sm min-w-[800px]">
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
            {filteredStockIn.map((row) => (
              <tr key={row.id} className="border-b">
                <td className="p-3">{row.tanggal}</td>
                <td className="p-3">{row.category}</td>
                <td className="p-3">{row.type || '-'}</td>
                <td className="p-3 text-right font-medium">
                  {row.stock.toLocaleString()}
                </td>
                <td className="p-3 text-center">
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() =>
                        router.push(
                          `/dashboard/superadmin/stock/in/${row.id}/edit`
                        )
                      }
                      className="rounded-md border px-3 py-1 text-sm hover:bg-gray-100"
                    >
                      Edit
                    </button>

                    <button
  onClick={() => {
    setSelectedId(row.id);
    setOpenDelete(true);
  }}
  className="rounded-md border border-red-500 px-3 py-1 text-sm text-red-500 hover:bg-red-500 hover:text-white"
>
  Hapus
</button>


                  </div>
                </td>
              </tr>
            ))}

            {filteredStockIn.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="p-6 text-center text-gray-500"
                >
                  Tidak ada data stock masuk
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <DeleteConfirmModal
  open={openDelete}
  onClose={() => {
    setOpenDelete(false);
    setSelectedId(null);
  }}
  onConfirm={() => {
    if (!selectedId) return;

    deleteStockIn(selectedId);
    toast.success('Stock berhasil dihapus');

    setOpenDelete(false);
    setSelectedId(null);
  }}
/>

      </div>
    </div>
  
  );
}
