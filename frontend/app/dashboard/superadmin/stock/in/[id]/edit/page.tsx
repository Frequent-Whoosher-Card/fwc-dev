'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
export default function EditStockInPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  const [form, setForm] = useState({
    tanggal: '',
    startSerial: '',
    endSerial: '',
    note: '',
  });

  // ===============================
  // GET DATA (GET /stock/in/{id})
  // ===============================
  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/stock/in/${id}`, {
          withCredentials: true,
        });

        const item = res.data?.data?.movement;
        if (!item) {
          toast.error('Data tidak ditemukan');
          return;
        }

        const serials = item.sentSerialNumbers ?? [];

        setForm({
          tanggal: item.movementAt ? item.movementAt.split('T')[0] : '',
          startSerial: serials[0] ?? '',
          endSerial: serials[serials.length - 1] ?? '',
          note: item.note ?? '',
        });

        setDataLoaded(true);
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Gagal mengambil data stock-in');
      }
    };

    fetchData();
  }, [id]);

  // ===============================
  // PATCH UPDATE (PATCH /stock/in/{id})
  // ===============================
  const handleSubmit = async () => {
    if (!id) {
      toast.error('ID tidak valid');
      return;
    }

    if (!form.tanggal) {
      toast.error('Tanggal wajib diisi');
      return;
    }

    if (!form.startSerial || !form.endSerial) {
      toast.error('Start & End Serial wajib diisi');
      return;
    }

    // opsional: validasi urutan serial
    if (form.startSerial > form.endSerial) {
      toast.error('Start Serial tidak boleh lebih besar dari End Serial');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        movementAt: new Date(form.tanggal + 'T00:00:00').toISOString(),
        note: form.note ?? '',
        startSerial: form.startSerial,
        endSerial: form.endSerial,
      };

      console.log('PATCH PAYLOAD:', payload);

      await axios.patch(`${API_BASE_URL}/stock/in/${id}`, payload, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      toast.success('Stock-in berhasil diperbarui');
      router.push('/dashboard/superadmin/stock/in');
    } catch (err: any) {
      console.error('PATCH ERROR:', err.response?.data || err);
      toast.error(err.response?.data?.message || 'Gagal update stock-in');
    } finally {
      setLoading(false);
    }
  };

  if (!dataLoaded) {
    return <div className="p-6 text-gray-500">Loading...</div>;
  }

  return (
    <div className="space-y-8 p-6">
      {/* HEADER */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="rounded-lg border p-2 hover:bg-gray-100">
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-lg font-semibold">Edit Stock-In</h2>
      </div>

      {/* FORM */}
      <div className="space-y-6 rounded-xl border bg-white p-6">
        <div>
          <label className="mb-2 block text-sm font-medium">Tanggal</label>
          <input type="date" className="w-full rounded-lg border px-4 py-2" value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Start Serial</label>
          <input className="w-full rounded-lg border px-4 py-2" value={form.startSerial} onChange={(e) => setForm({ ...form, startSerial: e.target.value })} />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">End Serial</label>
          <input className="w-full rounded-lg border px-4 py-2" value={form.endSerial} onChange={(e) => setForm({ ...form, endSerial: e.target.value })} />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Catatan</label>
          <textarea className="w-full rounded-lg border px-4 py-2" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
        </div>

        <div className="flex justify-end gap-2 pt-6">
          <button onClick={() => router.back()} className="rounded-md border px-4 py-2">
            Batal
          </button>
          <button onClick={handleSubmit} disabled={loading} className="rounded-md bg-[#8D1231] px-4 py-2 text-white disabled:opacity-60">
            {loading ? 'Loading...' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  );
}
