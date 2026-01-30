import { useState, useEffect } from "react";
import { RotateCcw, Calendar, Search } from "lucide-react";

export interface InboxFilters {
  status?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

// Custom Hook to avoid external dependency
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function InboxFilter({
  onFilter,
  onAddNote,
}: {
  onFilter: (filters: InboxFilters) => void;
  onAddNote?: () => void;
}) {
  // =========================
  // STATE FILTER (LOCAL UI)
  // =========================
  const [status, setStatus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");

  // Debounce text/date inputs
  const debouncedSearch = useDebounce(search, 500);
  const debouncedStartDate = useDebounce(startDate, 500);
  const debouncedEndDate = useDebounce(endDate, 500);

  // Effect: Auto-trigger filter when debounced values or status change
  useEffect(() => {
    onFilter({
      status,
      startDate: debouncedStartDate,
      endDate: debouncedEndDate,
      search: debouncedSearch,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, debouncedStartDate, debouncedEndDate, debouncedSearch]);

  const reset = () => {
    setStatus("");
    setStartDate("");
    setEndDate("");
    setSearch("");
  };

  return (
    <div className="flex flex-wrap items-center gap-4 w-full">
      {/* SEARCH INPUT */}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari..."
          className="h-9 w-[200px] rounded-md border px-3 pl-9 text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
        />
        <Search
          size={16}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
        />
      </div>

      <DateInput label="Start" value={startDate} onChange={setStartDate} />
      <DateInput label="End" value={endDate} onChange={setEndDate} />

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Status</span>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-9 w-[160px] rounded-md border px-3 text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
        >
          <option value="">Semua Status</option>
          <option value="PENDING_VALIDATION">Pending Validation</option>
          <option value="ACCEPTED">Accepted</option>
          <option value="CARD_MISSING">Missing</option>
          <option value="CARD_DAMAGED">Damaged</option>
        </select>
      </div>

      <div className="flex gap-2 ml-auto">
        <button
          onClick={reset}
          title="Reset Filter"
          className="p-2.5 border rounded-xl text-gray-400 hover:bg-gray-50 hover:text-red-600 transition-colors"
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
          className="h-9 w-[150px] rounded-md border px-3 pr-9 text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
        />
        <Calendar
          size={16}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-red-500"
        />
      </div>
    </div>
  );
}
