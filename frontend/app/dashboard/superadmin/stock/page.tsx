'use client';

import { useState } from 'react';
import { StockSummary } from './components/StockSummary';
import { StockFilter } from './components/StockFilter';
import { StockTable } from './components/StockTable';

export default function SuperAdminStockPage() {
  const [filters, setFilters] = useState({
    station: 'all',
    category: 'all',
    type: 'all',
  });

  return (
    <div className="space-y-6">
      <StockSummary />

      <div className="flex items-center justify-between">
        <StockFilter filters={filters} onChange={setFilters} />
      </div>

      {/* STOCK AVAILABLE (ALL) */}
      <StockTable filters={filters} />
    </div>
  );
}
