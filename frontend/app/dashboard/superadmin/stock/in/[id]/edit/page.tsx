'use client';

import { useRouter, useParams } from 'next/navigation';
import toast from 'react-hot-toast';

export default function EditStockInPage() {
  const router = useRouter();
  const { id } = useParams();
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Stock berhasil diupdate');
    router.push('/dashboard/superadmin/stock/in');
  };

  return (
    <div className="max-w-3xl space-y-6">
      <h2 className="text-lg font-semibold">Edit Stock Kartu Masuk</h2>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-white p-6">
        <input className="w-full rounded border p-2" defaultValue="2025-12-23" />
        <input className="w-full rounded border p-2" defaultValue="Gold" />
        <input className="w-full rounded border p-2" defaultValue="Jaka" />
        <input className="w-full rounded border p-2" defaultValue="Halim" />
        <input className="w-full rounded border p-2" defaultValue="12000" />

        {/* ⬇️ TOMBOLNYA DI SINI */}
        <div className="flex justify-end gap-2 pt-4">
          <button type="button" onClick={() => router.back()} className="rounded-md border px-4 py-2 text-sm">
            Batal
          </button>

          <button type="submit" className="rounded-md bg-[#8D1231] px-4 py-2 text-sm text-white">
            Simpan
          </button>
        </div>
      </form>
    </div>
  );
}
