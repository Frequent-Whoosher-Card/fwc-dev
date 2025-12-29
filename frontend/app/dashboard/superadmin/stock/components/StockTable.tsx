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
    <div className="rounded-lg border bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-120 w-full text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="p-3 md:p-4 text-left text-xs md:text-sm whitespace-nowrap">Category</th>

              <th className="p-3 md:p-4 text-left text-xs md:text-sm whitespace-nowrap">Type</th>

              <th className="p-3 md:p-4 text-right text-xs md:text-sm">
                <span className="hidden sm:inline">Stock Available</span>
                <span className="sm:hidden">Stock</span>
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row, i) => (
              <tr key={`${row.category}-${row.type}-${i}`} className="border-b last:border-b-0">
                <td className="p-3 md:p-4">{row.category}</td>
                <td className="p-3 md:p-4">{row.type || '-'}</td>
                <td className="p-3 md:p-4 text-right font-medium">{row.stock.toLocaleString()}</td>
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
    </div>
  );
}
