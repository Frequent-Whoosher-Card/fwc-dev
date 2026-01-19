'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import axios from '@/lib/axios';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { Eye, FileDown, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/* =====================
   TYPES
===================== */

interface Category {
  id: string;
  categoryCode: string;
  categoryName: string;
}

interface TypeItem {
  id: string;
  typeCode: string;
  typeName: string;
}

interface StockInItem {
  id: string;
  tanggal: string;
  category: string;
  type: string;
  stock: number;
  sentSerialNumbers?: string[]; // ✅ INI SAJA
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/* =====================
   COMPONENT
===================== */

export default function StockInPage() {
  const router = useRouter();

  /* =====================
     STATE
  ===================== */
  const [data, setData] = useState<StockInItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(false);

  // filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [category, setCategory] = useState('all');
  const [type, setType] = useState('all');

  // delete
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedSerial, setSelectedSerial] = useState<string>('');

  const fromDateRef = useRef<HTMLInputElement>(null);
  const toDateRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [types, setTypes] = useState<TypeItem[]>([]);

  /* =====================
     FETCH DATA (SAMA SEPERTI STOCK OUT)
  ===================== */
  const fetchStockIn = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (fromDate) {
        const start = new Date(fromDate);
        start.setHours(0, 0, 0, 0);
        params.startDate = start.toISOString();
      }

      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        params.endDate = end.toISOString();
      }

      const res = await axios.get('/stock/in', { params });

      if (res.data?.success) {
        const { items, pagination: paging } = res.data.data;

        setData(
          items.map((item: any) => ({
            id: item.id,
            tanggal: item.movementAt,
            category: item.cardCategory?.name || '-',
            type: item.cardType?.name || '-',
            stock: item.quantity,

            // ✅ SESUAI RESPONSE BACKEND
            sentSerialNumbers: item.sentSerialNumbers ?? [],
          }))
        );

        setPagination(paging);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal mengambil data stock-in');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, fromDate, toDate]);

  useEffect(() => {
    fetchStockIn();
  }, [fetchStockIn]);

  /* =====================
     FILTER (FRONTEND) – SAMA POLA STOCK OUT
  ===================== */
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const categoryMatch = category === 'all' || item.category === category;
      const typeMatch = type === 'all' || item.type === type;
      return categoryMatch && typeMatch;
    });
  }, [data, category, type]);

  /* =====================
   FETCH CATEGORY & TYPE
===================== */
  useEffect(() => {
    const fetchCategoryAndType = async () => {
      try {
        const [catRes, typeRes] = await Promise.all([axios.get('/card/category'), axios.get('/card/types')]);

        setCategories(Array.isArray(catRes.data?.data) ? catRes.data.data : []);
        setTypes(Array.isArray(typeRes.data?.data) ? typeRes.data.data : []);
      } catch (err) {
        console.error('Failed fetch category/type', err);
        setCategories([]);
        setTypes([]);
      }
    };

    fetchCategoryAndType();
  }, []);

  /* =====================
     DELETE
  ===================== */
  const handleDelete = async () => {
    if (!selectedId) return;

    try {
      await axios.delete(`/stock/in/${selectedId}`);
      toast.success('Stock berhasil dihapus');
      setOpenDelete(false);
      setSelectedId(null);
      fetchStockIn();
    } catch {
      toast.error('Gagal menghapus stock');
    }
  };

  /* =====================
     EXPORT PDF (CURRENT PAGE)
  ===================== */
  const handleExportPDF = async () => {
    try {
      const res = await axios.get('/stock/in', {
        params: {
          page: 1,
          limit: 100000, // ambil semua data
        },
      });

      const rawData = res.data?.data;
      const allData = Array.isArray(rawData?.items) ? rawData.items : [];

      if (allData.length === 0) {
        toast.error('Tidak ada data untuk diexport');
        return;
      }

      const doc = new jsPDF('p', 'mm', 'a4');
      const title = 'Laporan Stock In (Vendor ke Office)';
      const pageWidth = doc.internal.pageSize.getWidth();

      // TITLE
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(title, pageWidth / 2, 18, { align: 'center' });
      doc.line(14, 22, pageWidth - 14, 22);

      // TABLE
      autoTable(doc, {
        startY: 26,
        head: [['No', 'Tanggal', 'Category', 'Type', 'Stock Masuk']],
        body: allData.map((item: any, index: number) => [
          index + 1, // ✅ NOMOR URUT
          new Date(item.movementAt).toLocaleDateString('id-ID').replace(/\//g, '-'),
          item.cardCategory?.name ?? '-',
          item.cardType?.name ?? '-',
          item.quantity.toLocaleString(),
        ]),
        styles: {
          font: 'helvetica',
          fontSize: 10,
          cellPadding: 3,
          halign: 'center',
        },
        headStyles: {
          fillColor: [141, 18, 49],
          textColor: 255,
          fontStyle: 'bold',
          halign: 'center',
        },
        columnStyles: {
          0: { cellWidth: 10 }, // kolom No lebih kecil
        },
      });

      doc.save('laporan-stock-in.pdf');
    } catch (err) {
      toast.error('Gagal export PDF');
      console.error(err);
    }
  };

  const pageNumbers = Array.from({ length: pagination.totalPages }, (_, i) => i + 1);

  /* =====================
     RENDER
  ===================== */
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="text-lg font-semibold">Stock In (Vendor → Office)</h2>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {/* CATEGORY */}
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="rounded-md border border-gray-300
    bg-white text-black
    px-3 py-2 text-sm
    focus:bg-[#8D1231] focus:text-white
    focus:outline-none focus:ring-0
    transition-colors"
          >
            <option value="all">All Category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.categoryName}>
                {cat.categoryName}
              </option>
            ))}
          </select>

          {/* TYPE */}
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="rounded-md border border-gray-300
    bg-white text-black
    px-3 py-2 text-sm
    focus:bg-[#8D1231] focus:text-white
    focus:outline-none focus:ring-0
    transition-colors"
          >
            <option value="all">All Type</option>
            {types.map((t) => (
              <option key={t.id} value={t.typeName}>
                {t.typeName}
              </option>
            ))}
          </select>

          {/* DATE */}
          <div className="relative">
            <input ref={fromDateRef} type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="rounded-md border px-3 py-1.5 pr-9 text-sm" />
            <button onClick={() => fromDateRef.current?.showPicker?.()} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8D1231]">
              <Calendar size={16} />
            </button>
          </div>

          <div className="relative">
            <input ref={toDateRef} type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="rounded-md border px-3 py-1.5 pr-9 text-sm" />
            <button onClick={() => toDateRef.current?.showPicker?.()} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8D1231]">
              <Calendar size={16} />
            </button>
          </div>

          <button onClick={handleExportPDF} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
            <FileDown size={16} /> PDF
          </button>

          <button onClick={() => router.push('/dashboard/superadmin/stock/in/add')} className="rounded-md bg-[#8D1231] px-4 py-2 text-sm text-white">
            Tambah
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="rounded-lg border bg-white overflow-x-auto">
        <table className="w-full min-w-200 text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="p-3">No</th>
              <th className="p-3">Tanggal</th>
              <th className="p-3">Category</th>
              <th className="p-3">Type</th>
              <th className="p-3">Stock</th>
              <th className="p-3">View</th>
              <th className="p-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="p-6 text-center">
                  Loading...
                </td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6 text-center">
                  Tidak ada data
                </td>
              </tr>
            ) : (
              filteredData.map((row, index) => (
                <tr key={row.id} className="border-b-2 hover:bg-gray-50">
                  <td className="px-3 py-2 text-center">{(pagination.page - 1) * pagination.limit + index + 1}</td>
                  <td className="px-3 py-2 text-center whitespace-nowrap">{new Date(row.tanggal).toLocaleDateString('id-ID').replace(/\//g, '-')}</td> <td className="px-3 py-2 text-center">{row.category}</td>
                  <td className="px-3 py-2 text-center">{row.type}</td>
                  <td className="px-3 py-2 text-center font-medium">{row.stock.toLocaleString()}</td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => router.push(`/dashboard/superadmin/stock/in/view/${row.id}`)}
                      className="
      mx-auto flex items-center justify-center
      w-8 h-8
      border border-gray-300 rounded-md
      text-gray-500
      hover:bg-[#8D1231] hover:text-white
      transition-colors duration-200
    "
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                  <td className="px-3 py-2 text-center space-x-2">
                    {/* EDIT
                    <button
                      onClick={() => router.push(`/dashboard/superadmin/stock/in/${row.id}/edit`)}
                      className="
      rounded-md border border-blue-500
      px-3 py-1 text-xs
      text-blue-500
      hover:bg-blue-500 hover:text-white
    "
                    >
                      Edit
                    </button> */}

                    <button
                      onClick={() => {
                        setSelectedId(row.id);

                        let serialRange = '-';

                        if (Array.isArray(row.sentSerialNumbers) && row.sentSerialNumbers.length > 0) {
                          const first = row.sentSerialNumbers[0];
                          const last = row.sentSerialNumbers[row.sentSerialNumbers.length - 1];

                          serialRange = first === last ? first : `${first} - ${last}`;
                        }

                        setSelectedSerial(serialRange);
                        setOpenDelete(true);
                      }}
                      className="
    rounded-md
    border border-red-500
    px-3 py-1
    text-xs font-medium
    text-red-500
    hover:bg-red-500
    hover:text-white
    transition-colors
  "
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION (SAMA STOCK OUT) */}
      <div className="mt-4 flex items-center justify-center gap-2 text-sm">
        <button disabled={pagination.page === 1} onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}>
          <ChevronLeft size={18} />
        </button>

        {pageNumbers.map((p) => (
          <button key={p} onClick={() => setPagination((pg) => ({ ...pg, page: p }))} className={p === pagination.page ? 'font-semibold underline' : ''}>
            {p}
          </button>
        ))}

        <button disabled={pagination.page === pagination.totalPages} onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}>
          <ChevronRight size={18} />
        </button>
      </div>

      <DeleteConfirmModal
        open={openDelete}
        onClose={() => {
          setOpenDelete(false);
          setSelectedId(null);
          setSelectedSerial('');
        }}
        onConfirm={handleDelete}
        title="Konfirmasi Hapus Data"
        description="Apakah Anda yakin ingin menghapus data ini"
        serialNumber={selectedSerial}
      />
    </div>
  );
}
