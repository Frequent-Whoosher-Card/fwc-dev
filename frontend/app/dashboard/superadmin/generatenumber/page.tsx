'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import axios from '@/lib/axios';

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

export default function GenerateNumberPage() {
  const router = useRouter();

  const [products, setProducts] = useState<CardProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<CardProduct | null>(null);

  const [startNumber, setStartNumber] = useState('');
  const [endNumber, setEndNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const [history, setHistory] = useState<GenerateHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const year2 = String(new Date().getFullYear()).slice(-2);

  // =========================
  // FETCH CARD PRODUCT
  // =========================
  useEffect(() => {
    axios
      .get('/card/product')
      .then((res) => setProducts(res.data?.data || []))
      .catch(() => toast.error('Gagal mengambil card product'));
  }, []);

  // =========================
  // FETCH GENERATE HISTORY
  // =========================
  const fetchHistory = async () => {
    try {
      const res = await axios.get('/cards/generate/history');

      // backend SUDAH menentukan page & limit
      setHistory(res.data?.data?.items || []);
    } catch (err) {
      toast.error('Gagal mengambil history generate');
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // =========================
  // GENERATE (CALL BACKEND)
  // =========================
  const handleGenerate = async () => {
    if (!selectedProduct) {
      toast.error('Card product wajib dipilih');
      return;
    }

    if (!startNumber || !endNumber) {
      toast.error('Start & end number wajib diisi');
      return;
    }

    if (startNumber.length !== 5 || endNumber.length !== 5) {
      toast.error('Serial number harus 5 digit');
      return;
    }

    const start = Number(startNumber);
    const end = Number(endNumber);

    if (start > end) {
      toast.error('Start number tidak boleh lebih besar dari end number');
      return;
    }

    setLoading(true);

    try {
      await axios.post('/cards/generate', {
        cardProductId: selectedProduct.id,
        startSerial: startNumber,
        endSerial: endNumber,
      });

      toast.success('Generate serial berhasil');

      // 🔁 REFRESH LIST DARI BACKEND
      fetchHistory();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Nomor sudah digenerate');
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // RENDER
  // =========================
  return (
    <div className="space-y-8 px-6">
      {/* HEADER */}
      <div>
        <h2 className="text-lg font-semibold">Generate Number + Barcode</h2>
        <p className="text-sm text-gray-500">Generate serial number beserta barcode</p>
      </div>

      {/* FORM */}
      <div className="rounded-xl border bg-white p-6 space-y-4 max-w-xl">
        {/* CARD PRODUCT */}
        <select
          className="w-full rounded-lg border px-4 py-2"
          value={selectedProductId}
          onChange={(e) => {
            const id = e.target.value;
            setSelectedProductId(id);
            setSelectedProduct(products.find((p) => p.id === id) || null);
          }}
        >
          <option value="">-- Pilih Card Product --</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.category.categoryName} - {product.type.typeName}
            </option>
          ))}
        </select>

        {/* SERIAL TEMPLATE */}
        {selectedProduct && (
          <div className="rounded-lg border bg-gray-50 px-4 py-3 text-sm space-y-1">
            <p className="text-gray-500">Serial Template</p>
            <p className="font-mono font-medium">
              {selectedProduct.serialTemplate}
              {year2}
              <span className="ml-2 text-gray-500">+ 5 angka serial number</span>
            </p>
          </div>
        )}

        {/* START NUMBER */}
        <div className="flex">
          <span className="flex items-center rounded-l-lg border border-r-0 bg-gray-100 px-3 font-mono text-sm text-gray-600">
            {selectedProduct?.serialTemplate}
            {year2}
          </span>
          <input className="w-full rounded-r-lg border px-4 py-2 font-mono" placeholder="00001" value={startNumber} onChange={(e) => setStartNumber(e.target.value.replace(/\D/g, ''))} disabled={!selectedProduct} maxLength={5} />
        </div>

        {/* END NUMBER */}
        <div className="flex">
          <span className="flex items-center rounded-l-lg border border-r-0 bg-gray-100 px-3 font-mono text-sm text-gray-600">
            {selectedProduct?.serialTemplate}
            {year2}
          </span>
          <input className="w-full rounded-r-lg border px-4 py-2 font-mono" placeholder="00100" value={endNumber} onChange={(e) => setEndNumber(e.target.value.replace(/\D/g, ''))} disabled={!selectedProduct} maxLength={5} />
        </div>

        {/* ACTION */}
        <button onClick={handleGenerate} disabled={loading || !selectedProduct} className="rounded-lg bg-[#8D1231] px-6 py-2 text-white disabled:opacity-50">
          {loading ? 'Generating...' : 'Generate'}
        </button>
      </div>

      {/* LIST TABLE */}
      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="border-b px-4 py-3 font-medium">Generate History</div>

        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3">Tanggal</th>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Serial Range</th>
              <th className="px-4 py-3 text-center">Qty</th>
              <th className="px-4 py-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {loadingHistory ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : history.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                  Belum ada data
                </td>
              </tr>
            ) : (
              history.map((item) => {
                const startSerial = item.serialNumbers?.[0];
                const endSerial = item.serialNumbers?.[item.serialNumbers.length - 1];

                return (
                  <tr key={item.id} className="border-b">
                    <td className="px-4 py-2">{new Date(item.movementAt).toLocaleDateString()}</td>

                    <td className="px-4 py-2">
                      {item.category?.name} - {item.type?.name}
                    </td>

                    <td className="px-4 py-2 font-mono">
                      {startSerial} – {endSerial}
                    </td>

                    <td className="px-4 py-2 text-center">{item.quantity}</td>

                    <td className="px-4 py-2 text-center">
                      <button onClick={() => router.push(`/dashboard/superadmin/generatenumber/view/${item.id}`)} className="text-[#8D1231] underline">
                        View
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
