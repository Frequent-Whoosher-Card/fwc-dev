<<<<<<< HEAD
'use client';

export default function TransactionFilter() {
  return (
    <div className="flex items-center gap-3">
      <select className="h-9 rounded-md border px-3 text-sm">
        <option>Station</option>
      </select>

      <input
        type="date"
        className="h-9 rounded-md border px-3 text-sm"
      />

      <input
        type="date"
        className="h-9 rounded-md border px-3 text-sm"
      />
    </div>
  );
}
=======
'use client';

import { RotateCcw } from 'lucide-react';

/* ======================
   STATION OPTIONS
====================== */
const STATIONS = [
  { id: 'HALIM', name: 'Halim' },
  { id: 'KARAWANG', name: 'Karawang' },
  { id: 'PADALARANG', name: 'Padalarang' },
  { id: 'TEGALLUAR', name: 'Tegalluar' },
];

/* ======================
   TYPES
====================== */
interface Props {
  type: 'ALL' | 'KAI';
  stationId?: string;
  purchasedDate?: string;
  shiftDate?: string;

  onTypeChange: (v: 'ALL' | 'KAI') => void;
  onStationChange: (v?: string) => void;
  onPurchasedDateChange: (v?: string) => void;
  onShiftDateChange: (v?: string) => void;
  onReset: () => void;
}

/* ======================
   COMPONENT
====================== */
export default function TransactionFilter({
  type,
  stationId,
  purchasedDate,
  shiftDate,
  onTypeChange,
  onStationChange,
  onPurchasedDateChange,
  onShiftDateChange,
  onReset,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-white px-4 py-3">
      {/* ALL */}
      <button
        onClick={() => onTypeChange('ALL')}
        disabled={type === 'ALL'}
        className={`h-9 rounded-md border px-4 text-sm transition ${
          type === 'ALL'
            ? 'cursor-default border-blue-200 bg-blue-50 text-blue-600'
            : 'border-gray-300 bg-white text-gray-600 hover:bg-blue-50 hover:text-blue-600'
        }`}
      >
        All
      </button>

      {/* KAI */}
      <button
        onClick={() => onTypeChange('KAI')}
        disabled={type === 'KAI'}
        className={`h-9 rounded-md border px-4 text-sm transition ${
          type === 'KAI'
            ? 'cursor-default border-blue-200 bg-blue-50 text-blue-600'
            : 'border-gray-300 bg-white text-gray-600 hover:bg-blue-50 hover:text-blue-600'
        }`}
      >
        KAI
      </button>

      {/* STATION */}
      <select
        value={stationId ?? ''}
        onChange={(e) =>
          onStationChange(
            e.target.value ? e.target.value : undefined
          )
        }
        className="h-9 min-w-[160px] rounded-md border bg-white px-3 text-sm"
      >
        <option value="">Station</option>
        {STATIONS.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>

      {/* PURCHASED DATE */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">
          Purchased
        </span>
        <input
          type="date"
          value={purchasedDate}
          onChange={(e) =>
            onPurchasedDateChange(e.target.value)
          }
          className="h-9 w-[160px] rounded-md border px-3 text-sm"
        />
      </div>

      {/* SHIFT DATE */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">
          Shift
        </span>
        <input
          type="date"
          value={shiftDate}
          onChange={(e) =>
            onShiftDateChange(e.target.value)
          }
          className="h-9 w-[160px] rounded-md border px-3 text-sm"
        />
      </div>

      {/* RESET */}
      <button
        onClick={onReset}
        className="flex h-9 w-9 items-center justify-center rounded-md border hover:bg-gray-50"
      >
        <RotateCcw size={16} />
      </button>

      {/* PDF */}
      <div className="ml-auto">
        <button className="h-9 rounded-md border px-4 text-sm hover:bg-gray-50">
          PDF
        </button>
      </div>
    </div>
  );
}
>>>>>>> da9ad286010c29f3d8e17c72ef368bf0864559eb
