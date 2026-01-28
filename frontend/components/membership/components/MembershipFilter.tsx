import { Calendar, RotateCcw } from "lucide-react";
import { RefObject } from "react";

interface MembershipFilterProps {
  cardCategory: "all" | "NIPKAI";
  gender: "all" | "L" | "P";
  startDate: string;
  endDate: string;
  startDateRef: RefObject<HTMLInputElement>;
  endDateRef: RefObject<HTMLInputElement>;
  onCardCategoryChange: (value: "all" | "NIPKAI") => void;
  onGenderChange: (value: "all" | "L" | "P") => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onReset: () => void;
}

export default function MembershipFilter({
  cardCategory,
  gender,
  startDate,
  endDate,
  startDateRef,
  endDateRef,
  onCardCategoryChange,
  onGenderChange,
  onStartDateChange,
  onEndDateChange,
  onReset,
}: MembershipFilterProps) {
  return (
    <div className="space-y-4">
      {/* Card Category Filter */}
      <div className="flex items-center gap-2 rounded-lg border bg-white px-4 py-3">
        <button
          onClick={() => onCardCategoryChange("all")}
          aria-pressed={cardCategory === "all"}
          className={`h-9 rounded-md border px-4 text-sm transition ${
            cardCategory === "all"
              ? "cursor-default border-[#8D1231] bg-[#8D1231] text-white"
              : "border-gray-300 bg-white text-gray-600 hover:bg-red-50 hover:text-[#8D1231]"
          }`}
        >
          All
        </button>

        <button
          onClick={() => onCardCategoryChange("NIPKAI")}
          aria-pressed={cardCategory === "NIPKAI"}
          className={`h-9 rounded-md border px-4 text-sm transition ${
            cardCategory === "NIPKAI"
              ? "cursor-default border-[#8D1231] bg-[#8D1231] text-white"
              : "border-gray-300 bg-white text-gray-600 hover:bg-red-50 hover:text-[#8D1231]"
          }`}
        >
          NIPKAI
        </button>
      </div>

      {/* Advanced Filters */}
      <div className="flex items-center gap-3 rounded-lg border bg-white px-4 py-3">
        <div className="text-sm font-medium text-gray-600">Filter by:</div>

        {/* Gender */}
        <select
          value={gender}
          onChange={(e) => onGenderChange(e.target.value as "all" | "L" | "P")}
          className="h-9 rounded-md border border-gray-300 px-3 text-sm focus:border-gray-400 focus:outline-none"
        >
          <option value="all">All Gender</option>
          <option value="L">Laki - Laki</option>
          <option value="P">Perempuan</option>
        </select>

        {/* Start Date */}
        <div className="relative">
          <input
            ref={startDateRef}
            type="date"
            onChange={(e) => onStartDateChange(e.target.value)}
            className="h-9 rounded-md border border-gray-300 pl-10 pr-3 text-sm focus:border-gray-400 focus:outline-none"
            placeholder="Start Date"
          />
          <Calendar
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
        </div>

        {/* End Date */}
        <div className="relative">
          <input
            ref={endDateRef}
            type="date"
            onChange={(e) => onEndDateChange(e.target.value)}
            className="h-9 rounded-md border border-gray-300 pl-10 pr-3 text-sm focus:border-gray-400 focus:outline-none"
            placeholder="End Date"
          />
          <Calendar
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
        </div>

        {/* Reset Button */}
        <button
          onClick={onReset}
          className="ml-auto flex h-9 items-center gap-2 rounded-md border border-gray-300 bg-white px-4 text-sm text-gray-600 hover:bg-gray-50"
        >
          <RotateCcw size={14} />
          Reset
        </button>
      </div>
    </div>
  );
}
