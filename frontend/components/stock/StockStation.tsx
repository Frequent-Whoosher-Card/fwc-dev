"use client";

import { useStockStation } from "@/hooks/useStockStation";

interface StockStationProps {
  programType?: string;
  filters: {
    station: string;
    category: string;
    type: string;
  };
}

const fmt = (n: number) => n.toLocaleString();

export function StockStation({ filters, programType }: StockStationProps) {
  const { rows, loading, totals } = useStockStation(filters, programType);

  if (loading) {
    return <div className="p-6 text-gray-500">Loading station stock...</div>;
  }

  return (
    <div className="rounded-xl border bg-white overflow-x-auto">
      <table className="w-full text-sm min-w-[1050px]">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th rowSpan={2} className="p-4 text-center">
              Station
            </th>
            <th rowSpan={2} className="p-4 text-center">
              Category
            </th>
            <th rowSpan={2} className="p-4 text-center">
              Type
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
          {rows.map((row, i) => {
            const totalTerjual = row.aktif + row.nonAktif;
            return (
              <tr key={i} className="border-b text-center">
                <td className="p-4">{row.stationName}</td>
                <td className="p-4">{row.cardCategory}</td>
                <td className="p-4">{row.cardType}</td>
                <td className="p-4">{fmt(row.cardInTransit)}</td>
                <td className="p-4">{fmt(row.cardBeredar)}</td>
                <td className="p-4">{fmt(row.aktif)}</td>
                <td className="p-4">{fmt(row.nonAktif)}</td>
                <td className="p-4 font-semibold">{fmt(totalTerjual)}</td>
                <td className="p-4">{fmt(row.cardBelumTerjual)}</td>
              </tr>
            );
          })}
        </tbody>

        <tfoot>
          <tr className="bg-green-800 text-white font-semibold text-center">
            <td colSpan={3} className="p-4">
              TOTAL
            </td>
            <td className="p-4">{fmt(totals.cardInTransit)}</td>
            <td className="p-4">{fmt(totals.cardBeredar)}</td>
            <td className="p-4">{fmt(totals.aktif)}</td>
            <td className="p-4">{fmt(totals.nonAktif)}</td>
            <td className="p-4">{fmt(totals.aktif + totals.nonAktif)}</td>
            <td className="p-4">{fmt(totals.cardBelumTerjual)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
