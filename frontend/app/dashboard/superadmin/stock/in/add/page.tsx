'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import { fetchCategories, fetchTypes, createStockIn, Category, Type } from '@/services/stock/stockIn.service';

export default function AddStockInPage() {
  const router = useRouter();

  // ======================
  // STATE
  // ======================
  const [categories, setCategories] = useState<Category[]>([]);
  const [types, setTypes] = useState<Type[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    tanggal: '',
    categoryId: '',
    typeId: '', // kosong utk KAI
    initialSerial: '',
    lastSerial: '',
  });

  // ======================
  // FETCH CATEGORY & TYPE
  // ======================
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catData, typeData] = await Promise.all([fetchCategories(), fetchTypes()]);

        setCategories(catData);
        setTypes(typeData);
      } catch (err: any) {
        toast.error(err.message || 'Gagal mengambil category/type');
      }
    };

    fetchData();
  }, []);

  // ======================
  // SELECTED CATEGORY
  // ======================
  const selectedCategory = useMemo(() => {
    return categories.find((c) => c.id === form.categoryId);
  }, [categories, form.categoryId]);

  // ======================
  // AUTO TYPE FOR KAI
  // ======================
  const jabanType = useMemo(() => {
    return types.find((t) => t.typeName?.toUpperCase() === 'JABAN');
  }, [types]);

  const typeIdToSend = selectedCategory?.categoryName?.toUpperCase() === 'KAI' ? jabanType?.id || '' : form.typeId;

  // ======================
  // HANDLE SUBMIT
  // ======================
  const handleSubmit = async () => {
    if (!form.tanggal || !form.categoryId || !form.initialSerial || !form.lastSerial) {
      toast.error('Semua field wajib diisi');
      return;
    }

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

  // ======================
  // RENDER
  // ======================
  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex items-center gap-4 px-6">
        <button onClick={() => router.back()} className="rounded-lg border p-2 hover:bg-gray-100">
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-lg font-semibold">Add Stock-In</h2>
      </div>

      {/* FORM */}
      <div className="px-6">
        <div className="rounded-xl border bg-white p-6 space-y-6">
          {/* Date */}
          <div>
            <label className="text-sm font-medium">Date</label>
            <input
              type="date"
              className="w-full rounded-lg border px-4 py-2"
              value={form.tanggal}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  tanggal: e.target.value,
                }))
              }
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-sm font-medium">Card Category</label>
            <select
              className="w-full rounded-lg border px-4 py-2"
              value={form.categoryId}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  categoryId: e.target.value,
                  typeId: '', // reset type jika ganti category
                }))
              }
            >
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

            {selectedCategory?.categoryName?.toUpperCase() === 'KAI' ? (
              <input disabled className="w-full rounded-lg border bg-gray-100 px-4 py-2" value="JABAN (Auto)" />
            ) : (
              <select
                className="w-full rounded-lg border px-4 py-2"
                value={form.typeId}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    typeId: e.target.value,
                  }))
                }
              >
                <option value="">-- Pilih Type --</option>
                {types.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.typeName}
                  </option>
                ))}
              </select>
            )}

            {selectedCategory?.categoryName?.toUpperCase() === 'KAI' && <p className="mt-1 text-xs text-gray-400">Card Type otomatis untuk category KAI</p>}
          </div>

          {/* Serial */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Initial Serial</label>
              <input
                className="w-full rounded-lg border px-4 py-2"
                value={form.initialSerial}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    initialSerial: e.target.value,
                  }))
                }
              />
            </div>

            <div>
              <label className="text-sm font-medium">Last Serial</label>
              <input
                className="w-full rounded-lg border px-4 py-2"
                value={form.lastSerial}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    lastSerial: e.target.value,
                  }))
                }
              />
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
