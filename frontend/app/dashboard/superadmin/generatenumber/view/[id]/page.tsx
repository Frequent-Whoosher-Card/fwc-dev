'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import axios from '@/lib/axios';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';

/* =====================
   ENV
===================== */

// ✅ SESUAI PERMINTAAN
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/* =====================
   TYPES
===================== */

type AllCardStatus = 'IN' | 'OUT' | 'TRANSFER' | 'USED' | 'DAMAGED' | string;

interface CardDetailResponse {
  id: string;
  status: AllCardStatus;
  notes?: string | null;

  serialNumber: string;
  purchaseDate?: string | null;
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
  } | null;

  previousStation?: {
    id: string;
    stationName: string;
    stationCode: string;
  } | null;
}

/* =====================
   COMPONENT
===================== */

export default function EditAllCardPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    tanggal: '',
    serialNumber: '',
    category: '',
    type: '',
    station: '',
    status: '' as AllCardStatus,
    note: '',
  });

  /* =====================
     FETCH DETAIL
  ===================== */

  useEffect(() => {
    if (!id) return;
    if (!API_BASE_URL) {
      toast.error('API_BASE_URL belum diset');
      return;
    }

    const fetchDetail = async () => {
      try {
        setLoading(true);

        const res = await fetch(`${API_BASE_URL}/cards/${id}`, {
          cache: 'no-store',
        });

        if (!res.ok) {
          throw new Error('Gagal fetch detail');
        }

        const json = await res.json();
        const raw = json.data as CardDetailResponse;

        // 🔥 NORMALIZE RESPONSE
        const data: CardDetailResponse = {
          ...raw,
          previousStation: raw.previousStation ?? null,
          station: raw.station ?? null,
          notes: raw.notes ?? '',
        };

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
            <Field label="Date">
              <input type="date" className="input" value={form.tanggal} disabled />
            </Field>

            <Field label="Serial Number">
              <input className="input" value={form.serialNumber} disabled />
            </Field>

            <Field label="Category">
              <input className="input" value={form.category} disabled />
            </Field>

            <Field label="Type">
              <input className="input" value={form.type} disabled />
            </Field>

            <Field label="Station">
              <input className="input" value={form.station} disabled />
            </Field>

            <Field label="Status">
              <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="IN">IN</option>
                <option value="OUT">OUT</option>
                <option value="TRANSFER">TRANSFER</option>
                <option value="USED">USED</option>
                <option value="DAMAGED">DAMAGED</option>
              </select>
            </Field>

            <Field label="Note">
              <textarea rows={3} className="input" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </Field>

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

/* =====================
   HELPER
===================== */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">{label}</label>
      {children}
    </div>
  );
}
