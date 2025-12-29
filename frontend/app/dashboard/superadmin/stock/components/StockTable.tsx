'use client';

import { useStock } from '../context/StockContext';

export function StockTable() {
  const { stockIn, stockOut } = useStock();

  // Gabungkan & hitung stock
  const stockMap = new Map<string, number>();

  // STOCK IN
  stockIn.forEach((item) => {
    const key = `${item.category}-${item.type}`;
    stockMap.set(key, (stockMap.get(key) || 0) + item.stock);
  });

  // STOCK OUT
  stockOut.forEach((item) => {
    const key = `${item.category}-${item.type}`;
    stockMap.set(key, (stockMap.get(key) || 0) - item.stock);
  });

  const rows = Array.from(stockMap.entries()).map(([key, stock]) => {
    const [category, type] = key.split('-');
    return { category, type, stock };
  });

  return (
    <div className="rounded-lg border bg-white overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b bg-gray-50">
          <tr>
            <th className="p-4 text-left">Category</th>
            <th className="p-4 text-left">Type</th>
            <th className="p-4 text-right">Stock Available</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b">
              <td className="p-4">{row.category}</td>
              <td className="p-4">{row.type || '-'}</td>
              <td className="p-4 text-right font-medium">{row.stock.toLocaleString()}</td>
            </tr>
          ))}

          {rows.length === 0 && (
            <tr>
              <td colSpan={3} className="p-6 text-center text-gray-500">
                Belum ada data stock
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
