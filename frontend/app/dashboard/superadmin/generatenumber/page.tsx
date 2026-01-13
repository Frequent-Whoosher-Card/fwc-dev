'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import axios from '@/lib/axios';

/* ======================
   TYPES
====================== */
interface CardProduct {
  id: string;
  serialTemplate: string;
  category: {
    categoryName: string;
  };
  type: {
    typeName: string;
  };
}

interface GenerateHistoryItem {
  id: string;
  movementAt: string;
  quantity: number;
  category: {
    name: string;
  };
  type: {
    name: string;
  };
  serialNumbers: string[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/* ======================
   COMPONENT
====================== */
export default function GenerateNumberPage() {
  const router = useRouter();

  /* ======================
     STATE
  ====================== */
  const [products, setProducts] = useState<CardProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<CardProduct | null>(null);

  const [startNumber, setStartNumber] = useState('');
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);

  const [history, setHistory] = useState<GenerateHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [page, setPage] = useState(1);
  const limit = 10;
  const [pagination, setPagination] = useState<Pagination | null>(null);

  /* ======================
     FETCH CARD PRODUCT
  ====================== */
  useEffect(() => {
    axios
      .get('/card/product')
      .then((res) => setProducts(res.data?.data || []))
      .catch(() => toast.error('Gagal mengambil card product'));
  }, []);

  /* ======================
     FETCH HISTORY (FINAL FIX)
  ====================== */
  const fetchHistory = async (currentPage = 1) => {
    try {
      setLoadingHistory(true);

      const res = await axios.get('/cards/generate/history', {
        params: {
          page: currentPage,
          limit, // ⚠️ WAJIB ADA
        },
      });

      const responseData = res.data?.data;

      // ✅ PASTIKAN HISTORY SELALU ARRAY
      const items: GenerateHistoryItem[] = Array.isArray(responseData?.items) ? responseData.items : Array.isArray(responseData) ? responseData : [];

      setHistory(items);

      // ✅ PAGINATION AMAN
      if (responseData?.pagination) {
        setPagination(responseData.pagination);
      } else {
        setPagination({
          page: currentPage,
          limit,
          total: items.length,
          totalPages: items.length > limit ? Math.ceil(items.length / limit) : 1,
        });
      }

      setPage(currentPage);
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengambil history generate');
      setHistory([]);
      setPagination(null);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory(1);
  }, []);

  /* ======================
     FETCH NEXT SERIAL
  ====================== */
  const fetchNextSerial = async (productId: string) => {
    try {
      const res = await axios.get('/cards/generate/next-serial', {
        params: { cardProductId: productId },
      });

      const nextSerial = res.data?.data?.nextSerial || res.data?.data?.serial || res.data?.data || '';

      if (typeof nextSerial === 'string') {
        setStartNumber(nextSerial);
        setQuantity('');
      }
    } catch {
      toast.error('Gagal mengambil next serial number');
    }
  };

  /* ======================
     FORMAT DATE
  ====================== */
  const formatDateDMY = (dateString: string) => {
    const d = new Date(dateString);
    return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
  };

  /* ======================
     SERIAL CALCULATION
  ====================== */
  const startSerial5 = startNumber ? startNumber.slice(-5) : '';
  const qtyNumber = Number(quantity);

  const calculatedEndSerial = /^\d{5}$/.test(startSerial5) && qtyNumber > 0 ? String(Number(startSerial5) + qtyNumber - 1).padStart(5, '0') : '';

  /* ======================
     GENERATE
  ====================== */
  const handleGenerate = async () => {
    if (!selectedProduct || qtyNumber <= 0) {
      toast.error('Data tidak valid');
      return;
    }

    setLoading(true);

    try {
      await axios.post('/cards/generate', {
        cardProductId: selectedProduct.id,
        startSerial: startSerial5,
        endSerial: calculatedEndSerial,
      });

      toast.success('Generate serial berhasil');
      fetchHistory(1);
      fetchNextSerial(selectedProduct.id);
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || err?.response?.data?.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  /* ======================
     RENDER
  ====================== */
  return (
    <div className="space-y-8 px-6">
      <h2 className="text-lg font-semibold">Generate Number + Barcode</h2>

      {/* FORM */}
      <div className="rounded-xl border bg-white p-6 space-y-4 max-w-xl">
        <select
          className="w-full rounded-lg border px-4 py-2"
          value={selectedProductId}
          onChange={(e) => {
            const id = e.target.value;
            setSelectedProductId(id);
            const p = products.find((x) => x.id === id) || null;
            setSelectedProduct(p);
            if (p) fetchNextSerial(p.id);
          }}
        >
          <option value="">-- Pilih Card Product --</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.category.categoryName} - {p.type.typeName}
            </option>
          ))}
        </select>

        <input className="w-full rounded-lg border px-4 py-2 font-mono" value={startNumber} disabled />

        <input className="w-full rounded-lg border px-4 py-2 font-mono" placeholder="Jumlah kartu" value={quantity} onChange={(e) => setQuantity(e.target.value.replace(/\D/g, ''))} />

        {calculatedEndSerial && (
          <div className="text-sm font-mono">
            Serial terakhir: <b>{calculatedEndSerial}</b>
          </div>
        )}

        <button onClick={handleGenerate} disabled={loading} className="rounded-lg bg-[#8D1231] px-6 py-2 text-white">
          Generate
        </button>
      </div>

      {/* TABLE */}
      <div className="rounded-xl border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th>Tanggal</th>
              <th>Product</th>
              <th>Serial</th>
              <th>Qty</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {loadingHistory ? (
              <tr>
                <td colSpan={5} className="text-center py-6 text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : history.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-6 text-gray-400">
                  Belum ada data
                </td>
              </tr>
            ) : (
              history.map((item) => (
                <tr key={item.id}>
                  <td>{formatDateDMY(item.movementAt)}</td>
                  <td>
                    {item.category?.name} - {item.type?.name}
                  </td>
                  <td>
                    {item.serialNumbers?.[0]} – {item.serialNumbers?.[item.serialNumbers.length - 1]}
                  </td>
                  <td>{item.quantity}</td>
                  <td>
                    <button onClick={() => router.push(`/dashboard/superadmin/generatenumber/view/${item.id}`)} className="text-[#8D1231] underline">
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {pagination && pagination.totalPages > 1 && (
          <div className="flex justify-between px-4 py-3">
            <button disabled={page === 1} onClick={() => fetchHistory(page - 1)}>
              Prev
            </button>
            <span>
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button disabled={page === pagination.totalPages} onClick={() => fetchHistory(page + 1)}>
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
