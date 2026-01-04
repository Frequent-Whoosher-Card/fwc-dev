'use client';

import { useEffect, useState } from 'react';
import axios from '@/lib/axios';

interface StockRow {
  categoryId: string;
  categoryName: string;
  typeId: string;
  typeName: string;
  totalOffice: number;
  totalBeredar: number;
  totalAktif: number;
  totalNonAktif: number;
  totalStock: number;
  totalBelumTerjual: number;
}

const safeNumber = (value?: number) => (value ?? 0).toLocaleString();

export function StockTable() {
  const [rows, setRows] = useState<StockRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await axios.get('/inventory/category-type-summary');
        const raw = res.data?.data ?? res.data ?? [];

        const normalized: StockRow[] = raw.map((item: any) => ({
          categoryId: item.categoryId,
          categoryName: item.categoryName ?? '-',
          typeId: item.typeId,
          typeName: item.typeName ?? '-',
          totalOffice: Number(item.totalOffice ?? 0),
          totalBeredar: Number(item.totalBeredar ?? 0),
          totalAktif: Number(item.totalAktif ?? 0),
          totalNonAktif: Number(item.totalNonAktif ?? 0),
          totalStock: Number(item.totalStock ?? 0),
          totalBelumTerjual: Number(item.totalBelumTerjual ?? 0),
        }));

        setRows(normalized);
      } catch (err) {
        console.error('FETCH SUMMARY ERROR:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  const total = rows.reduce(
    (acc, row) => {
      acc.totalOffice += row.totalOffice;
      acc.totalBeredar += row.totalBeredar;
      acc.totalAktif += row.totalAktif;
      acc.totalNonAktif += row.totalNonAktif;
      acc.totalBelumTerjual += row.totalBelumTerjual;
      return acc;
    },
    {
      totalOffice: 0,
      totalBeredar: 0,
      totalAktif: 0,
      totalNonAktif: 0,
      totalBelumTerjual: 0,
    }
  );

  if (loading) {
    return <div className="p-6 text-gray-500">Loading...</div>;
  }

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
            <tr key={`${row.categoryId}-${row.typeId}`} className="border-b">
              <td className="p-4 text-center">{i + 1}</td>
              <td className="p-4 text-center">{row.categoryName}</td>
              <td className="p-4 text-center">{row.typeName}</td>
              <td className="p-4 text-center">{safeNumber(row.totalOffice)}</td>
              <td className="p-4 text-center">{safeNumber(row.totalBeredar)}</td>
              <td className="p-4 text-center">{row.totalAktif}</td>
              <td className="p-4 text-center">{row.totalNonAktif}</td>
              <td className="p-4 text-center">{safeNumber(row.totalBeredar)}</td>
              <td className="p-4 text-center">{safeNumber(row.totalBelumTerjual)}</td>
            </tr>
          ))}
        </tbody>

        <tfoot>
          <tr className="bg-[#00B54629] text-[#31b057] font-semibold">
            <td colSpan={3} className="p-4 text-center">
              Total
            </td>
            <td className="p-4 text-center">{safeNumber(total.totalOffice)}</td>
            <td className="p-4 text-center">{safeNumber(total.totalBeredar)}</td>
            <td className="p-4 text-center">{total.totalAktif}</td>
            <td className="p-4 text-center">{total.totalNonAktif}</td>
            <td className="p-4 text-center">{safeNumber(total.totalBeredar)}</td>
            <td className="p-4 text-center">{safeNumber(total.totalBelumTerjual)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
