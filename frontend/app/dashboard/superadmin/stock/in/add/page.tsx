'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import { fetchCategories, fetchTypes, createStockIn, Category, Type } from '@/services/stock/stockIn.service';

export default function AddStockInPage() {
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [types, setTypes] = useState<Type[]>([]);
  const [jabanTypeUUID, setJabanTypeUUID] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    tanggal: '',
    categoryId: '',
    typeId: '',
    initialSerial: '',
    lastSerial: '',
  });

  // Fetch categories & types
  useEffect(() => {
    const fetchData = async () => {
      try {
        const catData = await fetchCategories();
        setCategories(catData);

        const typeData = await fetchTypes();
        setTypes(typeData);

        // Cari UUID type "JABAN"
        const jabanType = typeData.find((t) => t.typeName.toUpperCase() === 'JABAN');
        if (jabanType) setJabanTypeUUID(jabanType.id);
      } catch (err: any) {
        toast.error(err.message || 'Gagal mengambil category/type');
      }
    };
    fetchData();
  }, []);

  const handleCategoryChange = (categoryId: string) => {
    const selectedCategory = categories.find((c) => c.id === categoryId);

    // Jika category KAI → set typeId otomatis ke UUID JABAN
    const typeId = selectedCategory?.categoryName.toUpperCase() === 'KAI' ? jabanTypeUUID : '';
    setForm({ ...form, categoryId, typeId });
  };

  const handleSubmit = async () => {
    if (!form.tanggal || !form.categoryId || !form.initialSerial || !form.lastSerial) {
      toast.error('Semua field wajib diisi');
      return;
    }

    // Tentukan typeId sesuai category
    const selectedCategory = categories.find((c) => c.id === form.categoryId);
    const typeIdToSend = selectedCategory?.categoryName.toUpperCase() === 'KAI' ? jabanTypeUUID : form.typeId;

    if (!typeIdToSend) {
      toast.error('Card Type wajib diisi');
      return;
    }

    setLoading(true);
    try {
      await createStockIn({
        movementAt: new Date(form.tanggal).toISOString(),
        categoryId: form.categoryId,
        typeId: typeIdToSend,
        startSerial: form.initialSerial.padStart(4, '0'),
        endSerial: form.lastSerial.padStart(4, '0'),
        note: '',
      });

      toast.success('Stock berhasil ditambahkan');
      router.push('/dashboard/superadmin/stock/in');
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan stock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 px-6">
        <button onClick={() => router.back()} className="rounded-lg border p-2 hover:bg-gray-100">
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-lg font-semibold">Add Stock-In</h2>
      </div>

      <div className="px-6">
        <div className="rounded-xl border bg-white p-6 space-y-6">
          {/* Date */}
          <div>
            <label className="text-sm font-medium">Date</label>
            <input type="date" className="w-full rounded-lg border px-4 py-2" value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} />
          </div>

          {/* Category */}
          <div>
            <label className="text-sm font-medium">Card Category</label>
            <select className="w-full rounded-lg border px-4 py-2" value={form.categoryId} onChange={(e) => handleCategoryChange(e.target.value)}>
              <option value="">-- Pilih Category --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.categoryName}
                </option>
              ))}
            </select>
          </div>

          {/* Type */}
          <div>
            <label className="text-sm font-medium">Card Type</label>
            <select
              className="w-full rounded-lg border px-4 py-2"
              value={form.typeId}
              onChange={(e) => setForm({ ...form, typeId: e.target.value })}
              disabled={categories.find((c) => c.id === form.categoryId)?.categoryName.toUpperCase() === 'KAI'}
            >
              <option value="">-- Pilih Type --</option>
              {types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.typeName}
                </option>
              ))}
            </select>

            {categories.find((c) => c.id === form.categoryId)?.categoryName.toUpperCase() === 'KAI' && <p className="text-xs text-gray-400 mt-1">Card type otomatis untuk KAI: JABAN</p>}
          </div>

          {/* Serial */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Initial Serial</label>
              <input className="w-full rounded-lg border px-4 py-2" value={form.initialSerial} onChange={(e) => setForm({ ...form, initialSerial: e.target.value })} />
            </div>

            <div>
              <label className="text-sm font-medium">Last Serial</label>
              <input className="w-full rounded-lg border px-4 py-2" value={form.lastSerial} onChange={(e) => setForm({ ...form, lastSerial: e.target.value })} />
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end">
            <button onClick={handleSubmit} disabled={loading} className="rounded-lg bg-[#8D1231] px-8 py-2 text-white hover:opacity-90 disabled:opacity-50">
              {loading ? 'Loading...' : 'Add Stock'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
