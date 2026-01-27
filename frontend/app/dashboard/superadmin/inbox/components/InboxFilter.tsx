"use client";

import { useState } from "react";
import { RotateCcw, Calendar } from "lucide-react";

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
  const [filters, setFilters] = useState<InboxFilters>({
    status: "",
    startDate: "",
    endDate: "",
  });

  const update = (key: keyof InboxFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilter(newFilters);
  };

  const reset = () => {
    const empty = { status: "", startDate: "", endDate: "" };
    setFilters(empty);
    onFilter(empty);
  };

  return (
    <div className="flex flex-wrap items-center gap-4">
      <DateInput
        label="Start"
        value={filters.startDate}
        onChange={(v) => update("startDate", v)}
      />
      <DateInput
        label="End"
        value={filters.endDate}
        onChange={(v) => update("endDate", v)}
      />

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Status</span>
        <select
          value={filters.status}
          onChange={(e) => update("status", e.target.value)}
          className="h-9 w-[160px] rounded-md border px-3 text-sm"
        >
          <option value="">Semua Status</option>
          <option value="COMPLETED">Completed</option>
          <option value="ISSUE">Issue</option>
        </select>
      </div>

      <div className="ml-auto flex gap-2">
        <button
          onClick={reset}
          className="p-2.5 border rounded-xl text-gray-400 hover:bg-gray-50 transition-all"
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
