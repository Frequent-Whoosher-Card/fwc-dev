'use client';

import { useStock } from '../context/StockContext';
import type { StockIn, StockOut } from '../context/StockContext';

type Mode = 'all' | 'in' | 'out';

interface StockTableProps {
  mode?: Mode;
}

export function StockTable({ mode = 'all' }: StockTableProps) {
  const { stockIn, stockOut } = useStock();

  /* =========================
     MODE: ALL (STOCK AVAILABLE)
  ========================= */
  if (mode === 'all') {
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
                <td className="p-4 text-right font-medium">
                  {row.stock.toLocaleString()}
                </td>
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

  /* =========================
     MODE: IN / OUT (TRANSAKSI)
  ========================= */
  const rows: (StockIn | StockOut)[] =
    mode === 'in' ? stockIn : stockOut;

  return (
    <div className="rounded-lg border bg-white overflow-x-auto">
      <table className="w-full text-sm min-w-[700px]">
        <thead className="border-b bg-gray-50">
          <tr>
            <th className="p-3 text-left">Tanggal</th>
            <th className="p-3 text-left">Category</th>
            <th className="p-3 text-left">Type</th>
            {mode === 'out' && (
              <th className="p-3 text-left">Station</th>
            )}
            <th className="p-3 text-right">
              {mode === 'in' ? 'Stock Masuk' : 'Stock Keluar'}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b">
              <td className="p-3">{row.tanggal}</td>
              <td className="p-3">{row.category}</td>
              <td className="p-3">{row.type || '-'}</td>
              {mode === 'out' && 'station' in row && (
                <td className="p-3">{row.station}</td>
              )}
              <td className="p-3 text-right font-medium">
                {row.stock.toLocaleString()}
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td
                colSpan={mode === 'out' ? 5 : 4}
                className="p-6 text-center text-gray-500"
              >
                Belum ada data
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
