'use client';

import { useState } from 'react';
import { StockSummary } from './components/StockSummary';
import { StockFilter } from './components/StockFilter';
import { StockTable } from './components/StockTable';
import { StockStation } from './components/StockStation';

type StockMode = 'all' | 'station';

export default function SuperAdminStockPage() {
  const [mode, setMode] = useState<StockMode>('all');

  const [filters, setFilters] = useState({
    station: 'all',
    category: 'all',
    type: 'all',
    startDate: '',
    endDate: '',
  });

  return (
    <div className="space-y-6">
      {/* SUMMARY */}
      <StockSummary />

      {/* MODE BUTTON */}
      {/* <div className="flex gap-2">
        <button
          className={`px-4 py-2 rounded-md text-sm border ${mode === 'all' ? 'bg-black text-white' : 'bg-white text-gray-700'}`}
          onClick={() => {
            setMode('all');
            setFilters((prev) => ({
              ...prev,
              station: 'all', // reset station
            }));
          }}
        >
          All Stock
        </button>

        <button className={`px-4 py-2 rounded-md text-sm border ${mode === 'station' ? 'bg-black text-white' : 'bg-white text-gray-700'}`} onClick={() => setMode('station')}>
          By Station
        </button>
      </div> */}

      {/* FILTER */}
      <StockFilter mode={mode} onModeChange={setMode} filters={filters} onChange={setFilters} />
      {/* TABLE SWITCH */}
      {mode === 'all' && <StockTable filters={filters} />}

      {mode === 'station' && <StockStation filters={filters} />}
    </div>
  );
}
