'use client';

export function StockTable() {
  return (
    <div className="rounded-lg border bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="px-4 py-3 text-left">Tanggal</th>
            <th className="px-4 py-3 text-left">Card Category</th>
            <th className="px-4 py-3 text-left">Card Type</th>
            <th className="px-4 py-3 text-left">Stasiun</th>
            <th className="px-4 py-3 text-left">Stock</th>
            <th className="px-4 py-3 text-left">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b">
            <td className="px-4 py-3">2025-12-23</td>
            <td className="px-4 py-3">Gold</td>
            <td className="px-4 py-3">Jaka</td>
            <td className="px-4 py-3">Halim</td>
            <td className="px-4 py-3">12,000</td>
            <td className="px-4 py-3 space-x-2">
              <button className="rounded bg-gray-800 px-3 py-1 text-white">
                Edit
              </button>
              <button className="rounded bg-red-600 px-3 py-1 text-white">
                Hapus
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
