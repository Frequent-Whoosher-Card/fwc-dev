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
            <th rowSpan={2} className="p-4 text-center w-12">
              No
            </th>
            <th rowSpan={2} className="p-4 text-center">
              Card Category
            </th>
            <th rowSpan={2} className="p-4 text-center">
              Card Type
            </th>
            <th rowSpan={2} className="p-4 text-center">
              Card Office
            </th>
            <th rowSpan={2} className="p-4 text-center">
              Card Beredar
            </th>
            <th colSpan={3} className="p-4 text-center bg-blue-50">
              Terjual
            </th>
            <th rowSpan={2} className="p-4 text-center">
              Card Belum Terjual
            </th>
          </tr>
          <tr className="border-b bg-gray-50">
            <th className="p-3 text-center">Aktif</th>
            <th className="p-3 text-center">Non Aktif</th>
            <th className="p-3 text-center">Total</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b">
              <td className="p-4 text-center">{i + 1}</td>
              <td className="p-4 text-center">{row.category}</td>
              <td className="p-4 text-center">{row.type || '-'}</td>
              <td className="p-4 text-center">{row.cardOffice.toLocaleString()}</td>
              <td className="p-4 text-center">{row.cardBeredar.toLocaleString()}</td>
              <td className="p-4 text-center">{row.aktif}</td>
              <td className="p-4 text-center">{row.nonAktif}</td>
              <td className="p-4 text-center">{row.totalTerjual}</td>
              <td className="p-4 text-center">{row.cardBelumTerjual.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>

        <tfoot>
          <tr className="bg-[#00B54629] text-[#31b057] font-semibold">
            <td colSpan={3} className="p-4 text-center">
              Total
            </td>
            <td className="p-4 text-center">{total.cardOffice.toLocaleString()}</td>
            <td className="p-4 text-center">{total.cardBeredar.toLocaleString()}</td>
            <td className="p-4 text-center">{total.aktif}</td>
            <td className="p-4 text-center">{total.nonAktif}</td>
            <td className="p-4 text-center">{total.totalTerjual}</td>
            <td className="p-4 text-center">{total.cardBelumTerjual.toLocaleString()}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
