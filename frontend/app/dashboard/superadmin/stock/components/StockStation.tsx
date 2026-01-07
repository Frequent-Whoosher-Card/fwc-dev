'use client';

import { useEffect, useMemo, useState } from 'react';
import axios from '@/lib/axios';

interface StationRow {
  stationName: string;
  cardCategory: string;
  cardType: string;
  cardBeredar: number;
  aktif: number;
  nonAktif: number;
  total: number;
  cardBelumTerjual: number;
}

interface StockStationProps {
  filters: {
    station: string;
    category: string;
    type: string;
  };
}

const fmt = (n: number) => n.toLocaleString();

export function StockStation({ filters }: StockStationProps) {
  const [rows, setRows] = useState<StationRow[]>([]);
  const [loading, setLoading] = useState(true);

  // =========================
  // FETCH STATION MONITOR
  // =========================
  useEffect(() => {
    const fetchStation = async () => {
      setLoading(true);
      try {
        const params: Record<string, string> = {};

        if (filters.station !== 'all') params.stationName = filters.station;
        if (filters.category !== 'all') params.categoryName = filters.category;
        if (filters.type !== 'all') params.typeName = filters.type;

        console.log('STATION PARAMS:', params);

        const res = await axios.get('/inventory/station-monitor', {
          params,
        });

        setRows(res.data?.data ?? []);
      } catch (err) {
        console.error('FETCH STATION ERROR:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStation();
  }, [filters]);

  // =========================
  // TOTAL FOOTER
  // =========================
  const total = useMemo(() => {
    return rows.reduce(
      (acc, r) => {
        acc.cardBeredar += r.cardBeredar;
        acc.aktif += r.aktif;
        acc.nonAktif += r.nonAktif;
        acc.total += r.total;
        acc.cardBelumTerjual += r.cardBelumTerjual;
        return acc;
      },
      {
        cardBeredar: 0,
        aktif: 0,
        nonAktif: 0,
        total: 0,
        cardBelumTerjual: 0,
      }
    );
  }, [rows]);

  if (loading) {
    return <div className="p-6 text-gray-500">Loading station stock...</div>;
  }

  return (
    <div className="rounded-xl border bg-white overflow-x-auto">
      <table className="w-full text-sm min-w-[1000px]">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="p-4 text-center">Station</th>
            <th className="p-4 text-center">Category</th>
            <th className="p-4 text-center">Type</th>
            <th className="p-4 text-center">Beredar</th>
            <th className="p-4 text-center">Aktif</th>
            <th className="p-4 text-center">Non Aktif</th>
            <th className="p-4 text-center">Total</th>
            <th className="p-4 text-center">Belum Terjual</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b text-center">
              <td className="p-4">{row.stationName}</td>
              <td className="p-4">{row.cardCategory}</td>
              <td className="p-4">{row.cardType}</td>
              <td className="p-4">{fmt(row.cardBeredar)}</td>
              <td className="p-4">{fmt(row.aktif)}</td>
              <td className="p-4">{fmt(row.nonAktif)}</td>
              <td className="p-4 font-semibold">{fmt(row.total)}</td>
              <td className="p-4">{fmt(row.cardBelumTerjual)}</td>
            </tr>
          ))}
        </tbody>

        <tfoot>
          <tr className="bg-green-800 text-white font-semibold text-center">
            <td colSpan={3} className="p-4">
              TOTAL
            </td>
            <td className="p-4">{fmt(total.cardBeredar)}</td>
            <td className="p-4">{fmt(total.aktif)}</td>
            <td className="p-4">{fmt(total.nonAktif)}</td>
            <td className="p-4">{fmt(total.total)}</td>
            <td className="p-4">{fmt(total.cardBelumTerjual)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
