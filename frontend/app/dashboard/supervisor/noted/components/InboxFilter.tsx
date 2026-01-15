"use client";

import { useState } from "react";
import { Filter, RotateCcw, Calendar, PlusCircle } from "lucide-react";
import { InboxFilters } from "@/lib/services/inbox";

/**
 * Status sesuai business flow
 */
const STATUS_OPTIONS = [
  { label: "Semua Status", value: "" },
  { label: "Pending", value: "PENDING" },
  { label: "Selesai", value: "COMPLETED" },
  { label: "Issue", value: "ISSUE" },
];

interface Filters {
  status: string;
  startDate: string;
  endDate: string;
}

export default function InboxFilter({
  onFilter,
  onAddNote,
}: {
  onFilter: (filters: InboxFilters) => void;
  onAddNote: () => void;
}) {
  const [filters, setFilters] = useState<InboxFilters>({
    status: "",
    startDate: "",
    endDate: "",
  });

  const update = (key: keyof InboxFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const reset = () => {
    const empty = { status: "", startDate: "", endDate: "" };
    setFilters(empty);
    onFilter(empty);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 w-full">
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
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <button
          onClick={() => onFilter(filters)}
          className="bg-[#8B1538] text-white px-6 py-2 rounded-lg text-sm flex items-center gap-2"
        >
          Filter <Filter size={16} />
        </button>

        <button onClick={reset} className="p-2 border rounded-lg text-gray-400">
          <RotateCcw size={18} />
        </button>
      </div>

      <button
        onClick={onAddNote}
        className="ml-auto bg-[#8B1538] text-white px-6 py-2 rounded-lg text-sm flex items-center gap-2"
      >
        <PlusCircle size={16} /> Add Note
      </button>
    </div>
  );
}

/**
 * Reusable Date Input Component
 */
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
