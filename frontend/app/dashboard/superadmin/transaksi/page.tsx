'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import TransactionToolbar from './components/TransactionToolbar';
import TransactionFilter from './components/TransactionFilter';
import TransactionTable from './components/TransactionTable';

export default function TransactionPage() {
  const router = useRouter();

  /* =====================
     STATE
  ===================== */
  const [search, setSearch] = useState('');

  const [type, setType] = useState<'ALL' | 'KAI'>('ALL');
  const [stationId, setStationId] = useState<string | undefined>();
  const [purchasedDate, setPurchasedDate] =
    useState<string | undefined>();
  const [shiftDate, setShiftDate] =
    useState<string | undefined>();

  /* =====================
     HANDLER
  ===================== */
  const handleResetFilter = () => {
    setType('ALL');
    setStationId(undefined);
    setPurchasedDate(undefined);
    setShiftDate(undefined);
  };

  const handleAddPurchased = () => {
    router.push(
      '/dashboard/superadmin/transaksi/create'
    );
  };

  /* =====================
     RENDER
  ===================== */
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <TransactionToolbar
        search={search}
        onSearchChange={setSearch}
        onAdd={handleAddPurchased}
      />

      {/* FILTER */}
      <TransactionFilter
        type={type}
        stationId={stationId}
        purchasedDate={purchasedDate}
        shiftDate={shiftDate}
        onTypeChange={setType}
        onStationChange={setStationId}
        onPurchasedDateChange={setPurchasedDate}
        onShiftDateChange={setShiftDate}
        onReset={handleResetFilter}
      />

      {/* TABLE */}
      <TransactionTable
        data={[]}
        loading={false}
        onDelete={(id) => {
          console.log('delete', id);
        }}
      />
    </div>
  );
}
