'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from '@/lib/axios';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';

interface StockOutDetail {
  id: string;
  movementAt: string;
  status: string;
  quantity: number;
  stationName: string;
  note: string;
  createdByName: string;
  cardCategory: {
    name: string;
  };
  cardType: {
    name: string;
  };
  sentSerialNumbers: string[];
}

export default function StockOutDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  // =========================
  // STATE (AMAN & DEFENSIVE)
  // =========================
  const [data, setData] = useState<StockOutDetail>({
    id: '',
    movementAt: '',
    status: '-',
    quantity: 0,
    stationName: '-',
    note: '-',
    createdByName: '-',
    cardCategory: { name: '-' },
    cardType: { name: '-' },
    sentSerialNumbers: [],
  });

  const [loading, setLoading] = useState(true);

  // =========================
  // FETCH DETAIL STOCK OUT
  // =========================
  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);

        const res = await axios.get(`/stock/out/${id}`);

        // 🔥 SESUAI RESPONSE API:
        // res.data.data.movement
        const item = res.data?.data?.movement;

        if (!item) {
          toast.error('Data tidak ditemukan');
          return;
        }

        setData({
          id: item.id ?? '',
          movementAt: item.movementAt ?? '',
          status: item.status ?? '-',
          quantity: item.quantity ?? 0,
          stationName: item.stationName ?? item.station?.name ?? '-',
          note: item.note || '-',
          createdByName: item.createdByName ?? '-',
          cardCategory: {
            name: item.cardCategory?.name ?? '-',
          },
          cardType: {
            name: item.cardType?.name ?? '-',
          },
          sentSerialNumbers: Array.isArray(item.sentSerialNumbers) ? item.sentSerialNumbers : [],
        });
      } catch (err) {
        toast.error('Gagal mengambil detail stock out');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchDetail();
  }, [id]);

  // =========================
  // LOADING STATE
  // =========================
  if (loading) {
    return <div className="p-6 text-center text-gray-500">Loading detail stock out...</div>;
  }

  return (
    <div className="space-y-6">
      {/* ================= HEADER ================= */}
      <div className="flex items-center gap-4 px-6">
        <button onClick={() => router.back()} className="rounded-lg border p-2 hover:bg-gray-100">
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-lg font-semibold">Detail Stock Out</h2>
      </div>

      {/* ================= INFO GRID ================= */}
      <div className="px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 rounded-xl border bg-white p-6">
          {/* CATEGORY */}
          <div>
            <p className="text-sm text-gray-500">Category</p>
            <p className="font-medium">{data.cardCategory.name}</p>
          </div>

          {/* TYPE */}
          <div>
            <p className="text-sm text-gray-500">Type</p>
            <p className="font-medium">{data.cardType.name}</p>
          </div>

          {/* STATION */}
          <div>
            <p className="text-sm text-gray-500">Station</p>
            <p className="font-medium">{data.stationName}</p>
          </div>

          {/* DATE */}
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

          {/* STATUS */}
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <span
              className={`inline-block rounded-full px-3 py-1 text-xs font-medium
                ${data.status === 'APPROVED' ? 'bg-green-100 text-green-700' : data.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}
            >
              {data.status}
            </span>
          </div>

          {/* QUANTITY */}
          <div>
            <p className="text-sm text-gray-500">Quantity</p>
            <p className="font-medium">{data.quantity.toLocaleString()}</p>
          </div>

          {/* CREATED BY */}
          <div>
            <p className="text-sm text-gray-500">Created By</p>
            <p className="font-medium">{data.createdByName}</p>
          </div>

          {/* NOTE */}
          <div className="md:col-span-3">
            <p className="text-sm text-gray-500">Note</p>
            <p className="font-medium">{data.note || '-'}</p>
          </div>
        </div>
      </div>

      {/* ================= SERIAL NUMBER LIST ================= */}
      <div className="px-6">
        <div className="rounded-xl border bg-white overflow-hidden">
          <div className="border-b px-4 py-3 font-medium">Serial Number</div>

          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-center w-16">No</th>
                <th className="px-4 py-3 text-left">Serial</th>
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

        <p className="mt-3 text-sm text-gray-500">
          Total Serial: <span className="font-medium text-gray-700">{data.sentSerialNumbers.length}</span>
        </p>
      </div>
    </div>
  );
}
