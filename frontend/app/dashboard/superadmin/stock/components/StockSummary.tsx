<<<<<<< HEAD
'use client';

import { useEffect, useState } from 'react';
import axios from '@/lib/axios';

interface SummaryData {
  totalCards: number;
  totalIn: number;
  totalOut: number;
}

const safeNumber = (value?: number) => (value ?? 0).toLocaleString();

export function StockSummary() {
  const [summary, setSummary] = useState<SummaryData>({
    totalCards: 0,
    totalIn: 0,
    totalOut: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await axios.get('/inventory/total-summary');

        console.log('RAW RESPONSE:', res.data);

        const data = res.data?.data;

        if (!data) {
          console.error('SUMMARY DATA EMPTY');
          return;
        }

        setSummary({
          totalCards: Number(data.totalCards),
          totalIn: Number(data.totalIn),
          totalOut: Number(data.totalOut),
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
    { label: 'All Card', value: summary.totalCards },
    { label: 'Stock In', value: summary.totalIn },
    { label: 'Stock Out', value: summary.totalOut },
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
=======
'use client';

import { useEffect, useState } from 'react';
import axios from '@/lib/axios';

interface SummaryData {
  totalCards: number;
  totalIn: number;
  totalOut: number;
}

const safeNumber = (value?: number) => (value ?? 0).toLocaleString();

export function StockSummary() {
  const [summary, setSummary] = useState<SummaryData>({
    totalCards: 0,
    totalIn: 0,
    totalOut: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await axios.get('/inventory/total-summary');

        console.log('RAW RESPONSE:', res.data);

        const data = res.data?.data;

        if (!data) {
          console.error('SUMMARY DATA EMPTY');
          return;
        }

        setSummary({
          totalCards: Number(data.totalCards),
          totalIn: Number(data.totalIn),
          totalOut: Number(data.totalOut),
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
    { label: 'All Card', value: summary.totalCards },
    { label: 'Stock In', value: summary.totalIn },
    { label: 'Stock Out', value: summary.totalOut },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">{item.label}</p>

          <p className="text-2xl font-semibold">{loading ? '…' : safeNumber(item.value)}</p>
        </div>
      ))}
    </div>
  );
}
>>>>>>> da9ad286010c29f3d8e17c72ef368bf0864559eb
