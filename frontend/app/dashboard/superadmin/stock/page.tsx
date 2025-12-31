'use client';

import { StockSummary } from './components/StockSummary';
import { StockTabs } from './components/StockTabs';
import { StockFilter } from './components/StockFilter';
import { StockTable } from './components/StockTable';

export default function AdminStockPage() {
  return (
    <div className="space-y-6">
      <StockSummary />

      <div className="flex items-center justify-between">
        {/* <StockTabs /> */}
        <StockFilter />
      </div>

      {/* STOCK AVAILABLE (ALL) */}
      <StockTable />
    </div>
  );
}
