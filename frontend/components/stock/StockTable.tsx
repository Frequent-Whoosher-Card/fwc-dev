"use client";

import { useStockInventoryTable } from "@/hooks/useStockInventoryTable";

interface StockTableProps {
  programType?: string;
  filters: {
    station: string;
    category: string;
    type: string;
    startDate: string;
    endDate: string;
  };
}

const fmt = (n: number) => n.toLocaleString();

export function StockTable({ filters, programType }: StockTableProps) {
  const { rows, loading, totals } = useStockInventoryTable(
    filters,
    programType,
  );

  if (loading) {
    return <div className="p-6 text-gray-500">Loading...</div>;
  }

  return (
    <div className="rounded-xl border bg-white overflow-x-auto">
      <table className="w-full text-sm min-w-[950px]">
        <thead className="bg-gray-50 border-b">
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
              Transit
            </th>
            <th rowSpan={2} className="p-4 text-center">
              Beredar
            </th>
            <th colSpan={3} className="p-4 text-center bg-blue-50">
              Terjual
            </th>
            <th rowSpan={2} className="p-4 text-center">
              Belum Terjual
            </th>
          </tr>
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
              <tr
                key={`${row.categoryId}-${row.typeId}`}
                className="border-b text-center"
              >
                <td className="p-4">{row.categoryName}</td>
                <td className="p-4">{row.typeName}</td>
                <td className="p-4">{fmt(row.totalOffice)}</td>
                <td className="p-4">{fmt(row.totalInTransit)}</td>
                <td className="p-4">{fmt(row.totalBeredar)}</td>
                <td className="p-4">{fmt(row.totalAktif)}</td>
                <td className="p-4">{fmt(row.totalNonAktif)}</td>
                <td className="p-4 font-medium">{fmt(totalTerjual)}</td>
                <td className="p-4">{fmt(row.totalBelumTerjual)}</td>
              </tr>
            );
          })}
        </tbody>

        <tfoot>
          <tr className="bg-green-800 text-white font-semibold text-center">
            <td colSpan={2} className="p-4">
              TOTAL
            </td>
            <td className="p-4">{fmt(totals.totalOffice)}</td>
            <td className="p-4">{fmt(totals.totalInTransit)}</td>
            <td className="p-4">{fmt(totals.totalBeredar)}</td>
            <td className="p-4">{fmt(totals.totalAktif)}</td>
            <td className="p-4">{fmt(totals.totalNonAktif)}</td>
            <td className="p-4">
              {fmt(totals.totalAktif + totals.totalNonAktif)}
            </td>
            <td className="p-4">{fmt(totals.totalBelumTerjual)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
