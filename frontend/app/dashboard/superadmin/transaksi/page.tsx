'use client';

import TransactionToolbar from './components/TransactionToolbar';
import TransactionFilter from './components/TransactionFilter';
import TransactionTable from './components/TransactionTable';

export default function TransactionPage() {
  return (
    <div className="space-y-4">
      <TransactionToolbar />
      <TransactionFilter />
      <TransactionTable />
    </div>
  );
}
