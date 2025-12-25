'use client';

import { useRouter } from 'next/navigation';
import { StockSummary } from '@/app/dashboard/admin/stock/components/StockSummary';
import { StockTabs } from '@/app/dashboard/admin/stock/components/StockTabs';

const dummyStockIn = [
  {
    id: '1',
    tanggal: '2025-12-23',
    category: 'Gold',
    type: 'Jaka',
    station: 'Halim',
    stock: 12000,
  },
  {
    id: '2',
    tanggal: '2025-12-22',
    category: 'Silver',
    type: 'Bima',
    station: 'Bandung',
    stock: 8000,
  },
];

export default function StockInPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* SUMMARY (optional, boleh sama) */}
      <StockSummary />

      {/* TABS (aktif di Stock In) */}
      <StockTabs />

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Stock In</h2>
        <button
          onClick={() => router.push('/dashboard/admin/stock/in/create')}
          className="rounded-md bg-[#8D1231] px-4 py-2 text-sm font-medium text-white"
        >
          Tambah
        </button>
      </div>

      {/* TABLE */}
      <div className="rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b">
            <tr className="text-left">
              <th className="p-4">Tanggal</th>
              <th className="p-4">Card Category</th>
              <th className="p-4">Card Type</th>
              <th className="p-4">Stasiun</th>
              <th className="p-4">Stock</th>
              <th className="p-4">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {dummyStockIn.map((row) => (
              <tr key={row.id} className="border-b last:border-b-0">
                <td className="p-4">{row.tanggal}</td>
                <td className="p-4">{row.category}</td>
                <td className="p-4">{row.type}</td>
                <td className="p-4">{row.station}</td>
                <td className="p-4">{row.stock.toLocaleString()}</td>
                <td className="p-4 space-x-2">
                  <button
                    onClick={() =>
                      router.push(`/dashboard/admin/stock/in/${row.id}/edit`)
                    }
                    className="rounded bg-gray-700 px-3 py-1 text-xs text-white"
                  >
                    Edit
                  </button>
                  <button className="rounded bg-red-600 px-3 py-1 text-xs text-white">
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
