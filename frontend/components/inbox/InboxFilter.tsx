import { useState, useEffect, useRef } from "react";
import { Calendar, Search, RefreshCw } from "lucide-react";

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
  onRefresh,
  onAddNote,
  stations,
  selectedStation,
  onStationChange,
}: {
  onFilter: (filters: InboxFilters) => void;
  onRefresh?: () => void;
  onAddNote?: () => void;
  stations?: any[];
  selectedStation?: string;
  onStationChange?: (id: string) => void;
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
    <div className="flex flex-col md:flex-row md:items-center gap-4 w-full">
      {/* SEARCH INPUT */}
      <div className="relative w-full md:w-auto">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari..."
          className="h-9 w-full md:w-[200px] rounded-md border px-3 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-[#8D1231]/10 focus:border-[#8D1231]"
        />
        <Search
          size={16}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
        />
      </div>

      <div className="grid grid-cols-2 gap-2 w-full md:flex md:w-auto md:items-center">
        <DateInput label="Start" value={startDate} onChange={setStartDate} />
        <DateInput label="End" value={endDate} onChange={setEndDate} />
      </div>

      <div className="flex items-center gap-2 w-full md:w-auto">
        <span className="text-sm font-medium text-gray-700">Status</span>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-9 w-full md:w-[160px] rounded-md border px-3 text-sm focus:outline-none bg-[#8D1231] text-white font-medium"
        >
          <option value="">Semua Status</option>
          <option value="PENDING_VALIDATION">Menunggu Validasi</option>
          <option value="ACCEPTED">Diterima</option>
          <option value="CARD_MISSING">Hilang</option>
          <option value="CARD_DAMAGED">Rusak</option>
        </select>
      </div>

      <div className="flex gap-2 ml-auto">
        {onRefresh && (
            <button
              onClick={onRefresh}
              title="Refresh"
              className="p-2 border rounded-lg text-gray-400 hover:bg-gray-50 transition-colors border-gray-200"
            >
              <RefreshCw size={18} />
            </button>
        )}
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
  const ref = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2 w-full md:w-auto">
      <span className="text-sm font-medium text-gray-500 md:text-gray-900 text-xs md:text-sm">{label}</span>
      <div className="relative w-full md:w-auto">
        <input
          ref={ref}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onClick={(e) => e.preventDefault()} // Prevent native picker on click
          className="h-9 w-full md:w-[150px] rounded-md border px-3 pr-9 text-sm focus:outline-none focus:ring-1 focus:ring-red-500 [&::-webkit-calendar-picker-indicator]:hidden"
        />
        <Calendar
          size={16}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8D1231] cursor-pointer"
          onClick={() => ref.current?.showPicker()}
        />
      </div>
    </div>
  );
}
