"use client";

import { useState } from "react";
import { Filter, RotateCcw, Calendar } from "lucide-react";

export interface InboxFilters {
  status?: string;
  startDate?: string;
  endDate?: string;
}

export default function InboxFilter({
  onFilter,
}: {
  onFilter: (filters: InboxFilters) => void;
}) {
  // =========================
  // STATE FILTER (LOCAL UI)
  // =========================
  const [status, setStatus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const reset = () => {
    setStatus("");
    setStartDate("");
    setEndDate("");
    onFilter({});
  };
  const applyFilters = () => {
    onFilter({ status, startDate, endDate });
  };

  return (
    <div className="flex flex-wrap items-center gap-4">
      <DateInput label="Start" value={startDate} onChange={setStartDate} />
      <DateInput label="End" value={endDate} onChange={setEndDate} />

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Status</span>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-9 w-[160px] rounded-md border px-3 text-sm"
        >
          <option value="">Semua Status</option>
          <option value="ACCEPTED">Accepted</option>
          <option value="CARD_MISSING">Missing</option>
          <option value="CARD_DAMAGED">Damaged</option>
        </select>
      </div>

      <div className="ml-auto flex gap-2">
        <button
          onClick={() => onFilter({ status, startDate, endDate })}
          className="bg-red-600 text-white px-8 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2"
        >
          Filter <Filter size={16} />
        </button>

        <button
          onClick={reset}
          className="p-2.5 border rounded-xl text-gray-400"
        >
          <RotateCcw size={20} />
        </button>
      </div>
    </div>
  );
}

function DateInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">{label}</span>
      <div className="relative">
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-[150px] rounded-md border px-3 pr-9 text-sm"
        />
        <Calendar
          size={16}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-red-500"
        />
      </div>
    </div>
  );
}
