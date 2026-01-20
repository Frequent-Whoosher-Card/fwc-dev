'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import axios from '@/lib/axios';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';

/* =====================
   TYPES
===================== */

type AllCardStatus = 'IN' | 'OUT' | 'TRANSFER' | 'USED' | 'DAMAGED';

interface CardDetailResponse {
  id: string;
  status: AllCardStatus;
  notes?: string;

  serialNumber: string;
  purchaseDate?: string;
  createdAt: string;

  cardProduct?: {
    category?: {
      categoryName: string;
    };
    type?: {
      typeName: string;
    };
  };

  station?: {
    stationName: string;
  };
}

/* =====================
   COMPONENT
===================== */

export default function EditAllCardPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  /* =====================
     STATE
  ===================== */

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    tanggal: '',
    serialNumber: '',
    category: '',
    type: '',
    station: '',
    status: 'IN' as AllCardStatus,
    note: '',
  });

  /* =====================
     FETCH DETAIL
  ===================== */

  useEffect(() => {
    if (!id) return;

    const fetchDetail = async () => {
      try {
        setLoading(true);

        const res = await axios.get(`/cards/${id}`);
        const data: CardDetailResponse = res.data?.data;

        setForm({
          tanggal: (data.purchaseDate || data.createdAt).split('T')[0],
          serialNumber: data.serialNumber,
          category: data.cardProduct?.category?.categoryName ?? '-',
          type: data.cardProduct?.type?.typeName ?? '-',
          station: data.station?.stationName ?? '-',
          status: data.status,
          note: data.notes ?? '',
        });
      } catch (err) {
        console.error(err);
        toast.error('Gagal mengambil detail card');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  /* =====================
     SUBMIT (PATCH)
  ===================== */

  const handleSubmit = async () => {
    try {
      setLoading(true);

      await axios.patch(`/cards/${id}`, {
        status: form.status,
        notes: form.note,
      });

      toast.success('All Card berhasil diperbarui');
      router.push('/dashboard/superadmin/stock/allcard');
    } catch (err) {
      console.error(err);
      toast.error('Gagal update All Card');
    } finally {
      setLoading(false);
    }
  };

  /* =====================
     UI
  ===================== */

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex items-center gap-4 px-4 sm:px-6">
        <button onClick={() => router.back()} className="rounded-lg border p-2 text-gray-600 hover:bg-gray-100">
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-lg font-semibold">Edit All Card</h2>
      </div>

      <div className="w-full px-4 sm:px-6">
        <div className="rounded-xl border bg-white p-6 sm:p-8 lg:p-10">
          <div className="space-y-6">
            {/* DATE */}
            <div>
              <label className="block text-sm font-medium mb-2">Date</label>
              <input type="date" className="w-full rounded-lg border px-4 py-3 text-sm bg-gray-100" value={form.tanggal} disabled />
            </div>

            {/* SERIAL */}
            <div>
              <label className="block text-sm font-medium mb-2">Serial Number</label>
              <input className="w-full rounded-lg border px-4 py-3 text-sm bg-gray-100" value={form.serialNumber} disabled />
            </div>

            {/* CATEGORY */}
            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <input className="w-full rounded-lg border px-4 py-3 text-sm bg-gray-100" value={form.category} disabled />
            </div>

            {/* TYPE */}
            <div>
              <label className="block text-sm font-medium mb-2">Type</label>
              <input className="w-full rounded-lg border px-4 py-3 text-sm bg-gray-100" value={form.type} disabled />
            </div>

            {/* STATION */}
            <div>
              <label className="block text-sm font-medium mb-2">Station</label>
              <input className="w-full rounded-lg border px-4 py-3 text-sm bg-gray-100" value={form.station} disabled />
            </div>

            {/* STATUS (EDITABLE) */}
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select className="w-full rounded-lg border px-4 py-3 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as AllCardStatus })}>
                <option value="IN">IN</option>
                <option value="OUT">OUT</option>
                <option value="TRANSFER">TRANSFER</option>
                <option value="USED">USED</option>
                <option value="DAMAGED">DAMAGED</option>
              </select>
            </div>

            {/* NOTE (EDITABLE) */}
            <div>
              <label className="block text-sm font-medium mb-2">Note</label>
              <textarea rows={3} className="w-full rounded-lg border px-4 py-3 text-sm" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </div>

            {/* ACTION */}
            <div className="flex justify-end pt-6">
              <button onClick={handleSubmit} disabled={loading} className="rounded-lg bg-[#8D1231] px-8 py-3 text-sm font-medium text-white hover:bg-[#7a102a] disabled:opacity-60 w-full sm:w-auto">
                {loading ? 'Saving...' : 'Update All Card'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
