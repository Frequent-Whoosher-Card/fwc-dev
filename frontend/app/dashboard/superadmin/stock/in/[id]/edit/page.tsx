'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import axios from 'axios';

type CardCategory = 'Gold' | 'Silver' | 'KAI';
type CardType = 'JaBan' | 'JaKa' | 'KaBan' | '';

export default function EditStockInPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    tanggal: '',
    category: 'Gold' as CardCategory,
    type: '' as CardType,
    stock: 0,
  });

  const [dataLoaded, setDataLoaded] = useState(false);

  // 🔹 Fetch data stock-in by ID
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Token tidak ditemukan. Silakan login.');

        const { data } = await axios.get(`http://localhost:3001/stock/stock/in/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const item = data.data; // Sesuaikan dengan struktur response API

        setForm({
          tanggal: item.movementAt.split('T')[0],
          category: item.cardCategory.name as CardCategory,
          type: (item.cardType?.name as CardType) || '',
          stock: item.quantity,
        });

        setDataLoaded(true);
      } catch (err: any) {
        toast.error(err.message || 'Gagal mengambil data stock');
      }
    };

    fetchData();
  }, [id]);

  const handleSubmit = async () => {
    if (!form.tanggal || form.stock <= 0) {
      toast.error('Data tidak valid');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Token tidak ditemukan. Silakan login.');

      await axios.patch(
        `http://localhost:3001/stock/stock/in/${id}`,
        {
          movementAt: new Date(form.tanggal).toISOString(),
          categoryId: '', // jika API butuh, masukkan ID category sebenarnya
          typeId: form.category === 'KAI' ? 'JABAN_TYPE_UUID' : '', // sesuaikan dengan typeId dari backend
          quantity: form.stock,
          note: '',
        },
        {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        }
      );

      toast.success('Stock berhasil diupdate');
      router.push('/dashboard/superadmin/stock/in');
    } catch (err: any) {
      toast.error(err.message || 'Gagal update stock');
    } finally {
      setLoading(false);
    }
  };

  if (!dataLoaded) return <div className="p-6 text-gray-500">Loading...</div>;

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="rounded-lg border p-2 hover:bg-gray-100">
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-lg font-semibold">Edit Stock-In</h2>
      </div>

      <div className="rounded-xl border bg-white p-6 space-y-6">
        {/* Date */}
        <div>
          <label className="block text-sm font-medium mb-2">Date</label>
          <input type="date" className="w-full rounded-lg border px-4 py-2" value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium mb-2">Card Category</label>
          <select
            className="w-full rounded-lg border px-4 py-2"
            value={form.category}
            onChange={(e) =>
              setForm({
                ...form,
                category: e.target.value as CardCategory,
                type: '',
              })
            }
          >
            <option value="Gold">Gold</option>
            <option value="Silver">Silver</option>
            <option value="KAI">KAI</option>
          </select>
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-medium mb-2">Card Type</label>
          <select className="w-full rounded-lg border px-4 py-2 disabled:bg-gray-100" disabled={form.category === 'KAI'} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as CardType })}>
            <option value="">Select Card Type</option>
            <option value="JaBan">JaBan</option>
            <option value="JaKa">JaKa</option>
            <option value="KaBan">KaBan</option>
          </select>
          {form.category === 'KAI' && <p className="text-xs text-gray-400 mt-1">Type otomatis: JaBan</p>}
        </div>

        {/* Stock */}
        <div>
          <label className="block text-sm font-medium mb-2">Jumlah Stock</label>
          <input type="number" min={1} className="w-full rounded-lg border px-4 py-2" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} />
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-2 pt-6">
          <button onClick={() => router.back()} className="rounded-md border px-4 py-2">
            Batal
          </button>
          <button onClick={handleSubmit} disabled={loading} className="rounded-md bg-[#8D1231] px-4 py-2 text-white">
            {loading ? 'Loading...' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  );
}
