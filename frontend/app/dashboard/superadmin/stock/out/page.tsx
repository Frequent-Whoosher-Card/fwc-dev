'use client';

import { StockSummary } from '../components/StockSummary';
import { StockTabs } from '../components/StockTabs';
import { StockFilter } from '../components/StockFilter';
import { StockTable } from '../components/StockTable';

export default function StockOutPage() {
  return (
    <div className="space-y-6">
      {/* SUMMARY */}
      <StockSummary />

      {/* TAB + FILTER */}
      <div className="flex items-center justify-between">
        <StockTabs />
        <StockFilter />
      </div>

      {/* TITLE */}
      <h2 className="text-lg font-semibold">Stock Out</h2>

      {/* TABLE */}
      <StockTable/>
    </div>
  );
}
