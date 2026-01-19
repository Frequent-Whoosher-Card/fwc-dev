'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from '@/lib/axios';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';

/* =====================
   INTERFACES
===================== */

interface SerialNumberItem {
  serialNumber: string;
  status: string; // IN_OFFICE | DAMAGED
}

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
  serialItems: SerialNumberItem[];
}

/* =====================
   COMPONENT
===================== */

export default function StockInDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [data, setData] = useState<StockInDetail>({
    id: '',
    movementAt: '',
    quantity: 0,
    cardCategory: { name: '-' },
    cardType: { name: '-' },
    serialItems: [],
  });

  const [loading, setLoading] = useState(true);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedSerials, setSelectedSerials] = useState<string[]>([]);
  const [updating, setUpdating] = useState(false);

  /* =====================
     FETCH DETAIL
  ===================== */

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);

        const res = await axios.get(`/stock/in/${id}`);
        const movement = res.data?.data?.movement;

        if (!movement) {
          toast.error('Data tidak ditemukan');
          return;
        }

        setData({
          id: movement.id ?? '',
          movementAt: movement.movementAt ?? '',
          quantity: movement.quantity ?? 0,
          cardCategory: {
            name: movement.cardCategory?.name ?? '-',
          },
          cardType: {
            name: movement.cardType?.name ?? '-',
          },
          serialItems: Array.isArray(movement.items) ? movement.items : [],
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

  /* =====================
     HANDLERS
  ===================== */

  const toggleSerial = (serial: string) => {
    setSelectedSerials((prev) => (prev.includes(serial) ? prev.filter((s) => s !== serial) : [...prev, serial]));
  };

  const handleDamage = async () => {
    if (selectedSerials.length === 0) {
      toast.error('Pilih minimal satu serial number');
      return;
    }

    try {
      setUpdating(true);

      await axios.put(`/stock/in/${id}/status-batch`, {
        updates: selectedSerials.map((serial) => ({
          serialNumber: serial,
          status: 'DAMAGED',
        })),
      });

      toast.success('Serial number berhasil di-damage');

      // update UI langsung
      setData((prev) => ({
        ...prev,
        serialItems: prev.serialItems.map((item) => (selectedSerials.includes(item.serialNumber) ? { ...item, status: 'DAMAGED' } : item)),
      }));

      setSelectedSerials([]);
      setSelectMode(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal update status');
    } finally {
      setUpdating(false);
    }
  };

  /* =====================
     LOADING
  ===================== */

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Loading detail stock...</div>;
  }

  /* =====================
     RENDER
  ===================== */

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

      {/* TABLE */}
      <div className="px-6">
        {/* ACTION BUTTON */}
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => {
              setSelectMode(!selectMode);
              setSelectedSerials([]);
            }}
            className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-100"
          >
            {selectMode ? 'Batal Pilih' : 'Pilih Serial Number'}
          </button>

          {selectMode && (
            <button onClick={handleDamage} disabled={updating} className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50">
              Damage
            </button>
          )}
        </div>

        <div className="rounded-xl border bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-center w-16">No</th>
                <th className="px-4 py-3 text-left">Serial Number</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>

            <tbody>
              {data.serialItems.length > 0 ? (
                data.serialItems.slice(0, 100).map((item, index) => {
                  const isDamaged = item.status === 'DAMAGED';

                  return (
                    <tr key={item.serialNumber} className={`border-b ${isDamaged ? 'bg-gray-50 text-gray-400' : ''}`}>
                      <td className="px-4 py-2 text-center">{selectMode && !isDamaged ? <input type="checkbox" checked={selectedSerials.includes(item.serialNumber)} onChange={() => toggleSerial(item.serialNumber)} /> : index + 1}</td>

                      <td className={`px-4 py-2 font-mono ${isDamaged ? 'line-through opacity-60' : ''}`}>{item.serialNumber}</td>

                      <td className="px-4 py-2">
                        <span className={`rounded px-2 py-0.5 text-xs font-medium ${isDamaged ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>{item.status}</span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-gray-500">
                    Tidak ada serial number
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* FOOTER */}
        <p className="mt-3 text-sm text-gray-500">
          Total Stock Masuk: <span className="font-medium text-gray-700">{data.quantity.toLocaleString()}</span>
        </p>
      </div>
    </div>
  );
}
