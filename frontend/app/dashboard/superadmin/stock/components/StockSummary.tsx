export function StockSummary() {
  const items = [
    { label: 'All Card', value: 500 },
    { label: 'Stock In', value: 500 },
    { label: 'Stock Out', value: 500 },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">{item.label}</p>
          <p className="text-2xl font-semibold">{item.value}</p>
          <p className="text-xs text-gray-400">Rp -</p>
        </div>
      ))}
    </div>
  );
}
('use client');

import { useEffect, useState } from 'react';
import axios from '@/lib/axios';

interface SummaryData {
  totalCard: number;
  totalStockIn: number;
  totalStockOut: number;
}

const safeNumber = (value?: number) => (value ?? 0).toLocaleString();

export function StockSummary() {
  const [summary, setSummary] = useState<SummaryData>({
    totalCard: 0,
    totalStockIn: 0,
    totalStockOut: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await axios.get('/inventory/total-summary');

        console.log('TOTAL SUMMARY API:', res.data);

        const data = res.data?.data ?? res.data ?? {};

        setSummary({
          totalCard: Number(data.totalCard ?? 0),
          totalStockIn: Number(data.totalStockIn ?? 0),
          totalStockOut: Number(data.totalStockOut ?? 0),
        });
      } catch (err) {
        console.error('FETCH TOTAL SUMMARY ERROR:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  const items = [
    { label: 'All Card', value: summary.totalCard },
    { label: 'Stock In', value: summary.totalStockIn },
    { label: 'Stock Out', value: summary.totalStockOut },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">{item.label}</p>

          <p className="text-2xl font-semibold">{loading ? '…' : safeNumber(item.value)}</p>

          <p className="text-xs text-gray-400">Rp -</p>
        </div>
      ))}
    </div>
  );
}
