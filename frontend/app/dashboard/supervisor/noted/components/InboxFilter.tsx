"use client";

import { useState } from "react";
import { Filter, RotateCcw, Calendar, Plus } from "lucide-react";
import { InboxFilters } from "@/lib/services/inbox";

/**
 * Konfigurasi status (tidak hardcode di JSX)
 */
const STATUS_OPTIONS = [
  { label: "Semua Status", value: "" },
  { label: "Perlu Validasi", value: "PENDING" },
  { label: "Tervalidasi", value: "COMPLETED" },
  { label: "Ada Masalah", value: "ISSUE" },
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
  onFilter: (filters: InboxFilters) => void | Promise<void>;
  onAddNote?: () => void;
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
    <div className="flex flex-wrap items-center gap-3 w-full">
      {/* START DATE */}
      <DateInput
        label="Start"
        value={filters.startDate}
        onChange={(v) => update("startDate", v)}
      />

      {/* END DATE */}
      <DateInput
        label="End"
        value={filters.endDate}
        onChange={(v) => update("endDate", v)}
      />

      {/* STATUS */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Status</span>

        <select
          value={filters.status}
          onChange={(e) => update("status", e.target.value)}
          className="h-9 w-[170px] rounded-md border px-3 text-sm"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* RESET */}
        <button
          onClick={reset}
          className="p-2.5 border border-gray-200 rounded-xl text-gray-400 hover:bg-gray-50 transition-all shadow-sm"
          title="Reset Filter"
        >
          <RotateCcw size={20} />
        </button>
      </div>

      {/* ACTION: ADD NOTE */}
      {onAddNote && (
        <div className="w-full md:w-auto md:ml-auto">
          <button
            onClick={onAddNote}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm flex items-center gap-2 shadow hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            <span>Buat Catatan</span>
          </button>
        </div>
      )}
    </div>
  );
}

/* ======================
   SMALL COMPONENTS
====================== */

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
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
        />
      </div>
    </div>
  );
}
