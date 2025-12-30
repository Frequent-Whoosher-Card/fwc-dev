'use client';

import { useRouter, useParams } from 'next/navigation';
import toast from 'react-hot-toast';

export default function AdminEditStockInPage() {
  const router = useRouter();
  const { id } = useParams();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Stock berhasil diupdate');
    router.push('/dashboard/admin/stock/in');
  };

  return (
    <div className="max-w-xl space-y-4">
      <h2 className="text-lg font-semibold">
        Edit Stock (ID: {id})
      </h2>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input className="w-full rounded border p-2" />
        <input className="w-full rounded border p-2" />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => router.back()}>
            Batal
          </button>
          <button
            type="submit"
            className="rounded bg-[#8D1231] px-4 py-2 text-white"
          >
            Simpan
          </button>
        </div>
      </form>
    </div>
  );
}
