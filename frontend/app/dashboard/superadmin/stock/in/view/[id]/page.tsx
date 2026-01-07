'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from '@/lib/axios';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';

interface StockInDetail {
  id: string;
  movementAt: string;
  quantity: number;
  cardCategory: {
    name: string;
  };
  cardType: {
    name: string;
  };
  sentSerialNumbers: string[];
}

export default function StockInDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  // ✅ STATE AWAL AMAN
  const [data, setData] = useState<StockInDetail>({
    id: '',
    movementAt: '',
    quantity: 0,
    cardCategory: { name: '-' },
    cardType: { name: '-' },
    sentSerialNumbers: [],
  });

  const [loading, setLoading] = useState(true);

  // =========================
  // FETCH DETAIL
  // =========================
  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);

        const res = await axios.get(`/stock/in/${id}`);

        // 🔥 INI KUNCI UTAMA
        const item = res.data?.data?.movement;

        if (!item) {
          toast.error('Data tidak ditemukan');
          return;
        }

        setData({
          id: item.id ?? '',
          movementAt: item.movementAt ?? '',
          quantity: item.quantity ?? 0,
          cardCategory: {
            name: item.cardCategory?.name ?? '-',
          },
          cardType: {
            name: item.cardType?.name ?? '-',
          },
          sentSerialNumbers: Array.isArray(item.sentSerialNumbers) ? item.sentSerialNumbers : [],
        });
      } catch (err) {
        toast.error('Gagal mengambil detail stock');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchDetail();
  }, [id]);

  // =========================
  // LOADING
  // =========================
  if (loading) {
    return <div className="p-6 text-center text-gray-500">Loading detail stock...</div>;
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center gap-4 px-6">
        <button onClick={() => router.back()} className="rounded-lg border p-2 hover:bg-gray-100">
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-lg font-semibold">Detail Stock In</h2>
      </div>

      {/* INFO */}
      <div className="px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 rounded-xl border bg-white p-6">
          <div>
            <p className="text-sm text-gray-500">Category</p>
            <p className="font-medium">{data.cardCategory.name}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Type</p>
            <p className="font-medium">{data.cardType.name}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Tanggal</p>
            <p className="font-medium">
              {data.movementAt
                ? new Date(data.movementAt).toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })
                : '-'}
            </p>
          </div>
        </div>
      </div>

      {/* TABLE SERIAL */}
      <div className="px-6">
        <div className="rounded-xl border bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-center w-16">No</th>
                <th className="px-4 py-3 text-left">Serial Number</th>
              </tr>
            </thead>
            <tbody>
              {data.sentSerialNumbers.length > 0 ? (
                data.sentSerialNumbers.map((serial, index) => (
                  <tr key={serial} className="border-b">
                    <td className="px-4 py-2 text-center">{index + 1}</td>
                    <td className="px-4 py-2 font-mono">{serial}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={2} className="px-4 py-6 text-center text-gray-500">
                    Tidak ada serial number
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* FOOTER INFO */}
        <p className="mt-3 text-sm text-gray-500">
          Total Stock Masuk: <span className="font-medium text-gray-700">{data.quantity.toLocaleString()}</span>
        </p>
      </div>
    </div>
  );
}
