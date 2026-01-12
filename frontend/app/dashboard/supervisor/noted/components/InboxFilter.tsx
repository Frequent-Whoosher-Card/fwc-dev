"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Filter, RotateCcw, Calendar, PlusCircle } from "lucide-react";

/**
 * Konfigurasi status (tidak hardcode di JSX)
 */
const STATUS_OPTIONS = [
  { label: "Semua Status", value: "" },
  { label: "Accepted", value: "ACCEPTED" },
  { label: "Missing", value: "CARD_MISSING" },
  { label: "Damaged", value: "CARD_DAMAGED" },
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
  onFilter: (filters: Filters) => void;
  onAddNote: () => void;
}) {
  const router = useRouter();

  /**
   * 🔥 SATU STATE SAJA (lebih scalable)
   */
  const [filters, setFilters] = useState<Filters>({
    status: "",
    startDate: "",
    endDate: "",
  });

  /**
   * Update filter helper
   */
  const updateFilter = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  /**
   * Reset semua filter
   */
  const resetFilter = () => {
    const empty = { status: "", startDate: "", endDate: "" };
    setFilters(empty);
    onFilter({
      status: "",
      startDate: "",
      endDate: ""
    });
  };

  return (
    <div
      className="    flex flex-wrap items-center gap-3
          w-full md:w-auto
      "
    >
      {/* START DATE */}
      <DateInput
        label="Start"
        value={filters.startDate}
        onChange={(v) => updateFilter("startDate", v)}
      />

      {/* END DATE */}
      <DateInput
        label="End"
        value={filters.endDate}
        onChange={(v) => updateFilter("endDate", v)}
      />

      {/* STATUS */}
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <span className="text-sm font-medium whitespace-nowrap">Status</span>
        <select
          value={filters.status}
          onChange={(e) => updateFilter("status", e.target.value)}
          className="h-9 w-[160px] rounded-md border px-3 text-sm"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* APPLY FILTER */}
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => onFilter(filters)}
            className="bg-[#E31E24] text-white px-8 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-red-700"
          >
            Filter <Filter size={16} />
          </button>

          {/* RESET */}
          <button
            onClick={resetFilter}
            className="p-2.5 border border-gray-200 rounded-xl text-gray-400 hover:bg-gray-50 transition-all shadow-sm"
          >
            <RotateCcw size={20} />
          </button>
        </div>
      </div>

      {/* ACTION */}
      <div className="w-full md:w-auto md:ml-auto">
        <button
          onClick={() => router.push("/dashboard/supervisor/noted/formnoted")}
          className="bg-[#E31E24] text-white px-8 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-red-700"
        >
          <PlusCircle size={16} /> Add Note
        </button>
      </div>
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
    <div className="flex items-center gap-2 w-full sm:w-auto">
      <span className="text-sm font-medium whitespace-nowrap">{label}</span>
      <div className="relative w-full sm:w-auto">
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-[150px] rounded-md border px-3 pr-9 text-sm focus:ring-1 focus:ring-red-500"
        />
        <Calendar
          size={16}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-red-500 pointer-events-none"
        />
      </div>
    </div>
  );
}
