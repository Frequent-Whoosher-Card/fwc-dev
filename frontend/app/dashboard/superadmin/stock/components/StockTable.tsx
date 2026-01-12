'use client';

import { useEffect, useMemo, useState } from 'react';
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
  totalBelumTerjual: number;
}

interface StockTableProps {
  filters: {
    station: string;
    category: string;
    type: string;
    startDate: string;
    endDate: string;
  };
}

const fmt = (n: number) => n.toLocaleString();

export function StockTable({ filters }: StockTableProps) {
  const [rows, setRows] = useState<StockRow[]>([]);
  const [loading, setLoading] = useState(false);

  // =========================
  // FETCH DATA (FILTER AKTIF)
  // =========================
  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);

      try {
        const params: Record<string, string> = {};

        if (filters.station !== 'all') params.stationName = filters.station;
        if (filters.category !== 'all') params.categoryName = filters.category;
        if (filters.type !== 'all') params.typeName = filters.type;
        if (filters.startDate) params.startDate = filters.startDate;
        if (filters.endDate) params.endDate = filters.endDate;

        const res = await axios.get('/inventory/category-type-summary', {
          params,
        });

        const raw = res.data?.data ?? [];

        setRows(
          raw.map((item: any) => ({
            categoryId: item.categoryId,
            categoryName: item.categoryName ?? '-',
            typeId: item.typeId,
            typeName: item.typeName ?? '-',
            totalOffice: Number(item.totalOffice ?? 0),
            totalBeredar: Number(item.totalBeredar ?? 0),
            totalAktif: Number(item.totalAktif ?? 0),
            totalNonAktif: Number(item.totalNonAktif ?? 0),
            totalBelumTerjual: Number(item.totalBelumTerjual ?? 0),
          }))
        );
      } catch (err) {
        console.error('FETCH SUMMARY ERROR:', err);
        setRows([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [filters.station, filters.category, filters.type, filters.startDate, filters.endDate]);

  // =========================
  // TOTAL
  // =========================
  const total = useMemo(() => {
    return rows.reduce(
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
  }, [rows]);

  if (loading) {
    return <div className="p-6 text-gray-500">Loading...</div>;
  }

  return (
    <div className="rounded-xl border bg-white overflow-x-auto">
      <table className="w-full text-sm min-w-[950px]">
        <thead className="bg-gray-50 border-b">
          {/* HEADER BARIS 1 */}
          <tr>
            <th rowSpan={2} className="p-4 text-center">
              Category
            </th>
            <th rowSpan={2} className="p-4 text-center">
              Type
            </th>
            <th rowSpan={2} className="p-4 text-center">
              Office
            </th>
            <th rowSpan={2} className="p-4 text-center">
              Beredar
            </th>

            {/* GROUP TERJUAL */}
            <th colSpan={3} className="p-4 text-center bg-blue-50">
              Terjual
            </th>

            <th rowSpan={2} className="p-4 text-center">
              Belum Terjual
            </th>
          </tr>

          {/* HEADER BARIS 2 */}
          <tr>
            <th className="p-4 text-center">Aktif</th>
            <th className="p-4 text-center">Non Aktif</th>
            <th className="p-4 text-center">Total</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => {
            const totalTerjual = row.totalAktif + row.totalNonAktif;

            return (
              <tr key={`${row.categoryId}-${row.typeId}`} className="border-b text-center">
                <td className="p-4">{row.categoryName}</td>
                <td className="p-4">{row.typeName}</td>
                <td className="p-4">{fmt(row.totalOffice)}</td>
                <td className="p-4">{fmt(row.totalBeredar)}</td>
                <td className="p-4">{fmt(row.totalAktif)}</td>
                <td className="p-4">{fmt(row.totalNonAktif)}</td>
                <td className="p-4 font-medium">{fmt(totalTerjual)}</td>
                <td className="p-4">{fmt(row.totalBelumTerjual)}</td>
              </tr>
            );
          })}
        </tbody>

        {/* TOTAL FOOTER */}
        <tfoot>
          <tr className="bg-green-800 text-white font-semibold text-center">
            <td colSpan={2} className="p-4">
              TOTAL
            </td>
            <td className="p-4">{fmt(total.totalOffice)}</td>
            <td className="p-4">{fmt(total.totalBeredar)}</td>
            <td className="p-4">{fmt(total.totalAktif)}</td>
            <td className="p-4">{fmt(total.totalNonAktif)}</td>
            <td className="p-4">{fmt(total.totalAktif + total.totalNonAktif)}</td>
            <td className="p-4">{fmt(total.totalBelumTerjual)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
