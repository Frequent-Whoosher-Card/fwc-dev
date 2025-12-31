'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { FileDown } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { useStock } from '../context/StockContext';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { StockSummary } from '@/app/dashboard/superadmin/stock/components/StockSummary';

export default function StockOutPage() {
  const router = useRouter();
  const { stockOut, deleteStockOut } = useStock();

  /* ======================
     FILTER DATE
  ====================== */
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  /* ======================
     DELETE STATE
  ====================== */
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  /* ======================
     FILTERED DATA
  ====================== */
  const filteredStockOut = useMemo(() => {
    return stockOut.filter((item) => {
      if (fromDate && item.tanggal < fromDate) return false;
      if (toDate && item.tanggal > toDate) return false;
      return true;
    });
  }, [stockOut, fromDate, toDate]);

  /* ======================
     EXPORT PDF
  ====================== */
  const handleExportPDF = () => {
    if (filteredStockOut.length === 0) {
      toast.error('Tidak ada data untuk diexport');
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text('Laporan Stock Out (Admin → Outlet)', 14, 15);

    autoTable(doc, {
      startY: 22,
      head: [['Tanggal', 'Card Category', 'Card Type', 'Stasiun', 'Stock Out', 'Serial Awal', 'Status', 'Note']],
      body: filteredStockOut.map((item) => [item.tanggal, item.category, item.type || '-', item.station, item.stock.toLocaleString(), item.serialStart || '-', item.status, item.note || '-']),
      headStyles: {
        fillColor: [141, 18, 49],
      },
    });

    doc.save('laporan-stock-out.pdf');
  };

  return (
    <div className="space-y-6">
      {/* SUMMARY */}
      {/* <StockSummary /> */}

      {/* HEADER */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="text-lg font-semibold">Stock Out (Admin → Stasiun)</h2>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Dari</label>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="rounded-md border px-3 py-1.5 text-sm" />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Sampai</label>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="rounded-md border px-3 py-1.5 text-sm" />
          </div>

          <button onClick={handleExportPDF} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-gray-100">
            <FileDown size={16} />
            PDF
          </button>

          <button onClick={() => router.push('/dashboard/superadmin/stock/out/add')} className="rounded-md bg-[#8D1231] px-4 py-2 text-sm font-medium text-white">
            Tambah
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="rounded-lg border bg-white overflow-x-auto">
        <table className="w-full min-w-[1200px] border-collapse text-sm">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-3 py-2 text-center">No</th>
              <th className="px-3 py-2 text-center">Tanggal</th>
              <th className="px-3 py-2 text-center">Card Category</th>
              <th className="px-3 py-2 text-center">Card Type</th>
              <th className="px-3 py-2 text-center">Stasiun</th>
              <th className="px-3 py-2 text-center">Stock Out</th>
              <th className="px-3 py-2 text-center whitespace-nowrap">Serial Number Awal</th>
              <th className="px-3 py-2 text-center">Status</th>
              <th className="px-3 py-2 text-center">Note</th>
              <th className="px-3 py-2 text-center">Aksi</th>
            </tr>
          </thead>

          <tbody>
            {filteredStockOut.map((row, index) => (
              <tr key={row.id} className="border-b hover:bg-gray-50">
                <td className="px-3 py-2 text-center">{index + 1}</td>
                <td className="px-3 py-2 text-center whitespace-nowrap">{row.tanggal}</td>
                <td className="px-3 py-2 text-center">{row.category}</td>
                <td className="px-3 py-2 text-center">{row.type || '-'}</td>
                <td className="px-3 py-2 text-center">{row.station}</td>
                <td className="px-3 py-2 text-center font-medium">{row.stock.toLocaleString()}</td>
                <td className="px-3 py-2 text-center whitespace-nowrap">{row.serialStart || '-'}</td>

                <td className="px-3 py-2 text-center">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium
                      ${row.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
                  >
                    {row.status}
                  </span>
                </td>

                <td className="px-3 py-2 text-center max-w-[200px] truncate">{row.note || '-'}</td>

                <td className="px-3 py-2 text-center">
                  <div className="flex justify-center gap-2">
                    <button onClick={() => router.push(`/dashboard/superadmin/stock/out/${row.id}/edit`)} className="rounded-md border px-3 py-1 text-xs hover:bg-gray-100">
                      Edit
                    </button>

                    <button
                      onClick={() => {
                        setSelectedId(row.id);
                        setOpenDelete(true);
                      }}
                      className="rounded-md border border-red-500 px-3 py-1 text-xs text-red-500 hover:bg-red-500 hover:text-white"
                    >
                      Hapus
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filteredStockOut.length === 0 && (
              <tr>
                <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                  Tidak ada data stock keluar
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

            deleteStockOut(selectedId);
            toast.success('Stock berhasil dihapus');

            setOpenDelete(false);
            setSelectedId(null);
          }}
        />
      </div>
    </div>
  );
}
