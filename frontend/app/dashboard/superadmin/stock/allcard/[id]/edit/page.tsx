'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import axiosInstance from '@/lib/axios';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';

type AllCardStatus = string;

interface CardDetailResponse {
  id: string;
  serialNumber: string;
  status: AllCardStatus;
  notes?: string | null;
  purchaseDate?: string | null;
  createdAt: string;
  cardProduct?: {
    category?: { categoryName: string };
    type?: { typeName: string };
  };
  station?: { stationName: string } | null;
}

export default function EditAllCardPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  const [form, setForm] = useState({
    tanggal: '',
    serialNumber: '',
    category: '',
    type: '',
    station: '',
    status: '',
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

        const res = await axiosInstance.get(`/cards/${id}`);
        const data: CardDetailResponse = res.data.data;

        setForm({
          tanggal: (data.purchaseDate || data.createdAt).split('T')[0],
          serialNumber: data.serialNumber,
          category: data.cardProduct?.category?.categoryName ?? '-',
          type: data.cardProduct?.type?.typeName ?? '-',
          station: data.station?.stationName ?? '-',
          status: data.status ?? '',
          note: data.notes ?? '',
        });

        setReady(true);
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
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      await axiosInstance.patch(`/cards/${id}`, {
        status: form.status,
        notes: form.note,
      });

      toast.success('Berhasil update card');
      router.push('/dashboard/superadmin/stock/allcard');
    } catch (err) {
      console.error(err);
      toast.error('Gagal update card');
    } finally {
      setLoading(false);
    }
  };

  if (!ready) {
    return <div className="p-6 text-sm text-gray-500">Loading data...</div>;
  }

  /* =====================
     UI
  ===================== */
  return (
    <div className="space-y-6 max-w-2xl">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="rounded-md border p-2 hover:bg-gray-100">
          <ArrowLeft size={16} />
        </button>
        <h2 className="text-lg font-semibold">Edit All Card</h2>
      </div>

      {/* FORM */}
      <form onSubmit={handleSubmit} className="rounded-xl border bg-white p-6 space-y-5">
        {/* DATE */}
        <div>
          <label className="block text-sm font-medium mb-1">Tanggal</label>
          <input type="date" value={form.tanggal} disabled className="w-full rounded-md border px-3 py-2 text-sm bg-gray-100" />
        </div>

        {/* SERIAL */}
        <div>
          <label className="block text-sm font-medium mb-1">Serial Number</label>
          <input value={form.serialNumber} disabled className="w-full rounded-md border px-3 py-2 text-sm bg-gray-100" />
        </div>

        {/* CATEGORY */}
        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <input value={form.category} disabled className="w-full rounded-md border px-3 py-2 text-sm bg-gray-100" />
        </div>

        {/* TYPE */}
        <div>
          <label className="block text-sm font-medium mb-1">Type</label>
          <input value={form.type} disabled className="w-full rounded-md border px-3 py-2 text-sm bg-gray-100" />
        </div>

        {/* STATION */}
        <div>
          <label className="block text-sm font-medium mb-1">Station</label>
          <input value={form.station} disabled className="w-full rounded-md border px-3 py-2 text-sm bg-gray-100" />
        </div>

        {/* STATUS (EDITABLE) */}
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} required className="w-full rounded-md border px-3 py-2 text-sm">
            <option value="">Pilih Status</option>

            {/* REQUEST */}
            <option value="ON_REQUEST">Sedang Diajukan</option>

            {/* INTERNAL */}
            <option value="IN_OFFICE">Di Kantor</option>
            <option value="IN_STATION">Di Stasiun</option>
            <option value="IN_TRANSIT">Dalam Pengiriman</option>

            {/* PROBLEM */}
            <option value="DAMAGED">Rusak</option>
            <option value="LOST">Hilang</option>
            <option value="BLOCKED">Diblokir</option>

            {/* SOLD */}
            <option value="SOLD_ACTIVE">Terjual (Aktif)</option>
            <option value="SOLD_INACTIVE">Terjual (Tidak Aktif)</option>

            {/* SYSTEM */}
            <option value="DELETED">Dihapus</option>
          </select>
        </div>

        {/* NOTES (EDITABLE) */}
        <div>
          <label className="block text-sm font-medium mb-1">Catatan</label>
          <textarea rows={4} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="w-full rounded-md border px-3 py-2 text-sm" placeholder="Tambahkan catatan (opsional)" />
        </div>

        {/* ACTION */}
        <div className="flex justify-end pt-4">
          <button type="submit" disabled={loading} className="rounded-md bg-[#8D1231] px-6 py-2 text-sm font-medium text-white hover:bg-[#7a102a] disabled:opacity-60">
            {loading ? 'Saving...' : 'Update'}
          </button>
        </div>
      </form>
    </div>
  );
}
