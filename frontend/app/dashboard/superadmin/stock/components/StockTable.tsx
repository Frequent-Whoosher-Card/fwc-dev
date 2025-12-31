'use client';

import { useStock } from '../context/StockContext';
import type { CardCategory, CardType } from '../context/StockContext';

/* =====================
   TYPES
===================== */
interface StockRow {
  category: CardCategory;
  type: CardType;
  cardOffice: number;
  cardBeredar: number;
  aktif: number;
  nonAktif: number;
  totalTerjual: number;
  cardBelumTerjual: number;
}

export function StockTable() {
  const { stockIn, stockOut } = useStock();

  /* =====================
     BUILD DATA
  ===================== */
  const map = new Map<string, StockRow>();

  // Collect combinations
  [...stockIn, ...stockOut].forEach((item) => {
    const key = `${item.category}-${item.type}`;
    if (!map.has(key)) {
      map.set(key, {
        category: item.category,
        type: item.type,
        cardOffice: 0,
        cardBeredar: 0,
        aktif: 0,
        nonAktif: 0,
        totalTerjual: 0,
        cardBelumTerjual: 0,
      });
    }
  });

  const rows = Array.from(map.values()).map((row) => {
    const totalIn = stockIn.filter((s) => s.category === row.category && s.type === row.type).reduce((sum, s) => sum + s.stock, 0);

    const totalOut = stockOut.filter((s) => s.category === row.category && s.type === row.type && s.status !== 'CANCELLED').reduce((sum, s) => sum + s.stock, 0);

    return {
      ...row,
      cardOffice: totalIn - totalOut, // ✅ AUTO BERKURANG
      cardBeredar: totalOut,
      aktif: 0,
      nonAktif: 0,
      totalTerjual: 0,
      cardBelumTerjual: totalOut,
    };
  });

  /* =====================
     TOTAL FOOTER
  ===================== */
  const total = rows.reduce(
    (acc, row) => {
      acc.cardOffice += row.cardOffice;
      acc.cardBeredar += row.cardBeredar;
      acc.aktif += row.aktif;
      acc.nonAktif += row.nonAktif;
      acc.totalTerjual += row.totalTerjual;
      acc.cardBelumTerjual += row.cardBelumTerjual;
      return acc;
    },
    {
      cardOffice: 0,
      cardBeredar: 0,
      aktif: 0,
      nonAktif: 0,
      totalTerjual: 0,
      cardBelumTerjual: 0,
    }
  );

  /* =====================
     RENDER
  ===================== */
  return (
    <div className="rounded-xl border bg-white overflow-x-auto">
      <table className="w-full text-sm min-w-[1000px]">
        <thead>
          <tr className="border-b bg-gray-50">
            <th rowSpan={2} className="p-4 text-left">
              Card Category
            </th>
            <th rowSpan={2} className="p-4 text-left">
              Card Type
            </th>
            <th rowSpan={2} className="p-4 text-right">
              Card Office
            </th>
            <th rowSpan={2} className="p-4 text-right">
              Card Beredar
            </th>
            <th colSpan={3} className="p-4 text-center bg-blue-50">
              Terjual
            </th>
            <th rowSpan={2} className="p-4 text-right">
              Card Belum Terjual
            </th>
          </tr>
          <tr className="border-b bg-gray-50">
            <th className="p-3 text-right">Aktif</th>
            <th className="p-3 text-right">Non Aktif</th>
            <th className="p-3 text-right">Total</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b">
              <td className="p-4">{row.category}</td>
              <td className="p-4">{row.type || '-'}</td>
              <td className="p-4 text-right">{row.cardOffice.toLocaleString()}</td>
              <td className="p-4 text-right">{row.cardBeredar.toLocaleString()}</td>
              <td className="p-4 text-right">{row.aktif}</td>
              <td className="p-4 text-right">{row.nonAktif}</td>
              <td className="p-4 text-right">{row.totalTerjual}</td>
              <td className="p-4 text-right">{row.cardBelumTerjual.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>

        <tfoot>
          <tr className="bg-[#00B54629] text-[#31b057] font-semibold">
            <td colSpan={2} className="p-4">
              Total
            </td>
            <td className="p-4 text-right">{total.cardOffice.toLocaleString()}</td>
            <td className="p-4 text-right">{total.cardBeredar.toLocaleString()}</td>
            <td className="p-4 text-right">{total.aktif}</td>
            <td className="p-4 text-right">{total.nonAktif}</td>
            <td className="p-4 text-right">{total.totalTerjual}</td>
            <td className="p-4 text-right">{total.cardBelumTerjual.toLocaleString()}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
