'use client';

import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function CreateStockInPage() {
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Stock berhasil ditambahkan');
    router.push('/dashboard/superadmin/stock/in');
  };

  return (
    <div className="max-w-3xl space-y-6">
      <h2 className="text-lg font-semibold">Tambah Stock Kartu Masuk</h2>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-white p-6">
        <input className="w-full rounded border p-2" placeholder="Tanggal" />
        <input className="w-full rounded border p-2" placeholder="Card Category" />
        <input className="w-full rounded border p-2" placeholder="Card Type" />
        <input className="w-full rounded border p-2" placeholder="Stasiun" />
        <input className="w-full rounded border p-2" placeholder="Stock" />

        <div className="flex justify-end">
          <button
            type="submit"
            className="rounded-md bg-[#8D1231] px-4 py-2 text-sm text-white"
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  );
}
