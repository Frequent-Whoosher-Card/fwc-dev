'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { FileDown, ChevronLeft, ChevronRight } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import axiosInstance from '@/lib/axios';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
// import { StockSummary } from '@/app/dashboard/superadmin/stock/components/StockSummary';

/* ======================
   TYPES
====================== */
type StockOutStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

interface StockOutItem {
  id: string;
  movementAt: string;
  status: StockOutStatus;
  quantity: number;
  stationName: string | null;
  note: string | null;
  createdByName: string | null;
  cardCategory: {
    id: string;
    name: string;
    code: string;
  };
  cardType: {
    id: string;
    name: string;
    code: string;
  };
  sentSerialNumbers: string[];
  // derived/optional for display compatibility
  serialStart?: string;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function StockOutPage() {
  const router = useRouter();

  /* ======================
     STATE
  ====================== */
  const [data, setData] = useState<StockOutItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(false);

  // Filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Delete
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  /* ======================
     FETCH DATA
  ====================== */
  const fetchStockOut = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (fromDate) params.startDate = new Date(fromDate).toISOString();
      if (toDate) params.endDate = new Date(toDate).toISOString();

      const response = await axiosInstance.get('/stock/out', { params });
      
      if (response.data.success) {
        const { items, pagination: paging } = response.data.data;
        setData(items);
        setPagination(paging);
      }
    } catch (error: any) {
      console.error('Error fetching stock out:', error);
      toast.error(error.response?.data?.message || 'Gagal mengambil data stock out');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, fromDate, toDate]);

  // Initial Fetch & Filter Effect
  useEffect(() => {
    fetchStockOut();
  }, [fetchStockOut]);

  // Handle Page Change
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page: newPage }));
    }
  };

  /* ======================
     DELETE ACTION
  ====================== */
  const handleDelete = async () => {
    if (!selectedId) return;

    try {
      await axiosInstance.delete(`/stock/out/${selectedId}`);
      toast.success('Stock berhasil dihapus');
      setOpenDelete(false);
      setSelectedId(null);
      fetchStockOut(); // Refresh data
    } catch (error: any) {
      console.error('Error deleting stock out:', error);
      toast.error(error.response?.data?.message || 'Gagal menghapus stock out');
    }
  };

  /* ======================
     EXPORT PDF
  ====================== */
  const handleExportPDF = () => {
    if (data.length === 0) {
      toast.error('Tidak ada data untuk diexport (halaman ini)');
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text('Laporan Stock Out (Admin → Outlet)', 14, 15);

    autoTable(doc, {
      startY: 22,
      head: [['Tanggal', 'Card Category', 'Card Type', 'Stasiun', 'Stock Out', 'Serial Awal', 'Status', 'Note']],
      body: data.map((item) => [
        new Date(item.movementAt).toLocaleDateString('id-ID'),
        item.cardCategory.name,
        item.cardType.name || '-',
        item.stationName || '-',
        item.quantity.toLocaleString(),
        item.sentSerialNumbers?.[0] || '-',
        item.status,
        item.note || '-',
      ]),
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
            <input 
              type="date" 
              value={fromDate} 
              onChange={(e) => {
                setFromDate(e.target.value);
                setPagination((p) => ({ ...p, page: 1 })); // Reset page
              }} 
              className="rounded-md border px-3 py-1.5 text-sm" 
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Sampai</label>
            <input 
              type="date" 
              value={toDate} 
              onChange={(e) => {
                setToDate(e.target.value);
                setPagination((p) => ({ ...p, page: 1 })); // Reset page
              }} 
              className="rounded-md border px-3 py-1.5 text-sm" 
            />
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
      <div className="rounded-lg border bg-white overflow-hidden">
        <div className="overflow-x-auto">
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
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                    Tidak ada data stock keluar
                  </td>
                </tr>
              ) : (
                data.map((row, index) => (
                  <tr key={row.id} className="border-b hover:bg-gray-50">
                    <td className="px-3 py-2 text-center">
                      {(pagination.page - 1) * pagination.limit + index + 1}
                    </td>
                    <td className="px-3 py-2 text-center whitespace-nowrap">
                      {new Date(row.movementAt).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-3 py-2 text-center">{row.cardCategory.name}</td>
                    <td className="px-3 py-2 text-center">{row.cardType.name || '-'}</td>
                    <td className="px-3 py-2 text-center">{row.stationName || '-'}</td>
                    <td className="px-3 py-2 text-center font-medium">{row.quantity.toLocaleString()}</td>
                    <td className="px-3 py-2 text-center whitespace-nowrap">
                      {row.sentSerialNumbers?.[0] || '-'}
                    </td>

                    <td className="px-3 py-2 text-center">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium
                          ${
                            row.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                            row.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                            row.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-600'
                          }`}
                      >
                        {row.status}
                      </span>
                    </td>

                    <td className="px-3 py-2 text-center max-w-[200px] truncate">{row.note || '-'}</td>

                    <td className="px-3 py-2 text-center">
                      <div className="flex justify-center gap-2">
                        {/* Only show Edit if PENDING? (Ideally yes, but let's keep it open, backend will reject if not allowed, or user can view) */}
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
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="flex items-center justify-between border-t px-4 py-3 sm:px-6">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Menampilkan <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> sampai <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> dari <span className="font-medium">{pagination.total}</span> hasil
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                >
                  <span className="sr-only">Previous</span>
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                
                {/* Simple Page Indicator */}
                <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
                  {pagination.page} / {pagination.totalPages || 1}
                </span>

                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                >
                  <span className="sr-only">Next</span>
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      <DeleteConfirmModal
        open={openDelete}
        onClose={() => {
          setOpenDelete(false);
          setSelectedId(null);
        }}
        onConfirm={handleDelete}
      />
    </div>
  );
}
