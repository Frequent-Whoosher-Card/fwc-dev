'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import axios from '@/lib/axios';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { FileDown } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface StockInItem {
  id: string;
  tanggal: string;
  rawTanggal: string;
  category: string;
  type: string;
  stock: number;
}

export default function StockInPage() {
  const router = useRouter();

  // STATE
  const [stockIn, setStockIn] = useState<StockInItem[]>([]);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // FETCH DATA
  useEffect(() => {
    const fetchStockIn = async () => {
      try {
        const res = await axios.get('/stock/in');
        const data = res.data?.data?.items || [];
        const mappedData = data.map((item: any) => ({
          id: item.id,
          tanggal: new Date(item.movementAt).toLocaleDateString('id-ID'),
          rawTanggal: item.movementAt,
          category: item.cardCategory?.name || '-',
          type: item.cardType?.name || '-',
          stock: item.quantity,
        }));
        setStockIn(mappedData);
      } catch (err: any) {
        toast.error('Gagal mengambil data stock-in');
        console.error(err);
      }
    };

    fetchStockIn();
  }, []);

  // FILTERED DATA
  const filteredStockIn = useMemo(() => {
    return stockIn.filter((item) => {
      if (fromDate && new Date(item.rawTanggal) < new Date(fromDate)) return false;
      if (toDate && new Date(item.rawTanggal) > new Date(toDate)) return false;
      return true;
    });
  }, [stockIn, fromDate, toDate]);

  // EXPORT PDF
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
      body: filteredStockIn.map((item) => [item.tanggal, item.category, item.type || '-', item.stock.toLocaleString()]),
      headStyles: { fillColor: [141, 18, 49] },
    });

    doc.save('laporan-stock-in.pdf');
  };

  // HAPUS DATA
  const handleDelete = (id: string) => {
    // Panggil API delete di sini jika ada
    setStockIn((prev) => prev.filter((item) => item.id !== id));
    toast.success('Stock berhasil dihapus');
    setOpenDelete(false);
    setSelectedId(null);
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="text-lg font-semibold">Stock In (Vendor → Office)</h2>

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

          <button onClick={() => router.push('/dashboard/superadmin/stock/in/add')} className="rounded-md bg-[#8D1231] px-4 py-2 text-sm font-medium text-white">
            Tambah
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="rounded-lg border bg-white overflow-x-auto">
        <table className="w-full text-sm min-w-[800px]">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="p-3 text-center w-12">No</th>
              <th className="p-3 text-center">Tanggal</th>
              <th className="p-3 text-center">Category</th>
              <th className="p-3 text-center">Type</th>
              <th className="p-3 text-center">Stock Masuk</th>
              <th className="p-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredStockIn.map((row, i) => (
              <tr key={row.id} className="border-b">
                <td className="p-3 text-center">{i + 1}</td>
                <td className="p-3 text-center">{row.tanggal}</td>
                <td className="p-3 text-center">{row.category}</td>
                <td className="p-3 text-center">{row.type || '-'}</td>
                <td className="p-3 text-center font-medium">{row.stock.toLocaleString()}</td>
                <td className="p-3 text-center">
                  <div className="flex justify-center gap-2">
                    <button onClick={() => router.push(`/dashboard/superadmin/stock/in/${row.id}/edit`)} className="rounded-md border px-3 py-1 text-sm hover:bg-gray-100">
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
                <td colSpan={6} className="p-6 text-center text-gray-500">
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
          onConfirm={() => selectedId && handleDelete(selectedId)}
        />
      </div>
    </div>
  );
}
