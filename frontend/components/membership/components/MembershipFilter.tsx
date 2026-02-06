import { useEffect, useState } from "react";
import { Calendar, RotateCcw } from "lucide-react";
import { RefObject } from "react";
import { getEmployeeTypes } from "@/lib/services/employee-type.service";

interface EmployeeTypeItem {
  id: string;
  code: string;
  name: string;
}

import { Search } from "lucide-react"; // Added Search icon

interface MembershipFilterProps {
  search: string; // Added prop
  onSearchChange: (value: string) => void; // Added prop
  cardCategory: "all" | "NIPKAI";
  gender: "all" | "L" | "P";
  employeeTypeId: string;
  startDate: string;
  endDate: string;
  startDateRef: RefObject<HTMLInputElement>;
  endDateRef: RefObject<HTMLInputElement>;
  onCardCategoryChange: (value: "all" | "NIPKAI") => void;
  onGenderChange: (value: "all" | "L" | "P") => void;
  onEmployeeTypeChange: (value: string) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onReset: () => void;
  actions?: React.ReactNode;
}

export default function MembershipFilter({
  search, // Added
  onSearchChange, // Added
  cardCategory,
  gender,
  employeeTypeId,
  startDate,
  endDate,
  startDateRef,
  endDateRef,
  onCardCategoryChange,
  onGenderChange,
  onEmployeeTypeChange,
  onStartDateChange,
  onEndDateChange,
  onReset,
  actions,
}: MembershipFilterProps) {
  const [employeeTypes, setEmployeeTypes] = useState<EmployeeTypeItem[]>([]);

  useEffect(() => {
    getEmployeeTypes({ limit: 200 })
      .then((res) => setEmployeeTypes(res.data ?? []))
      .catch(() => setEmployeeTypes([]));
  }, []);

  const isFilterActive =
    gender !== "all" ||
    cardCategory !== "all" ||
    !!employeeTypeId ||
    !!startDate ||
    !!endDate;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-white px-4 py-3">
      {/* Search Input - First item */}
      <div className="relative w-full md:w-auto md:min-w-[200px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Cari Member..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-9 w-full rounded-md border pl-9 pr-3 text-sm focus:border-[#8D1231] focus:outline-none focus:ring-1 focus:ring-[#8D1231]"
        />
      </div>

      <div className="h-6 w-px bg-gray-200 hidden md:block" />

      {/* Filter Group */}
      <div className="flex flex-wrap items-center gap-2">
        {/* NIPKAI / All Toggle */}
        <div className="flex rounded-md border p-1 border-gray-200">
          <button
            onClick={() => onCardCategoryChange("all")}
            className={`h-7 rounded px-3 text-xs font-medium transition ${
              cardCategory === "all"
                ? "bg-[#8D1231] text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            All
          </button>
          <button
            onClick={() => onCardCategoryChange("NIPKAI")}
            className={`h-7 rounded px-3 text-xs font-medium transition ${
              cardCategory === "NIPKAI"
                ? "bg-[#8D1231] text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            NIPKAI
          </button>
        </div>

        {/* Gender Dropdown */}
        <select
          value={gender}
          onChange={(e) => onGenderChange(e.target.value as "all" | "L" | "P")}
          className={`h-9 rounded-md border px-3 text-sm focus:outline-none ${
            gender !== "all"
              ? "border-[#8D1231] bg-red-50 text-[#8D1231]"
              : "border-gray-300 bg-white text-gray-600"
          }`}
        >
          <option value="all">Gender</option>
          <option value="L">Laki - Laki</option>
          <option value="P">Perempuan</option>
        </select>

        {/* Employee Type */}
        <select
          value={employeeTypeId}
          onChange={(e) => onEmployeeTypeChange(e.target.value)}
          className={`h-9 min-w-[140px] rounded-md border px-3 text-sm focus:outline-none ${
            employeeTypeId
              ? "border-[#8D1231] bg-red-50 text-[#8D1231]"
              : "border-gray-300 bg-white text-gray-600"
          }`}
        >
          <option value="">Tipe Karyawan</option>
          {employeeTypes.map((et) => (
            <option key={et.id} value={et.id}>
              {et.name}
            </option>
          ))}
        </select>

        {/* Start Date */}
        <div className="relative">
          <input
            ref={startDateRef}
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className={`h-9 w-[130px] rounded-md border px-3 pr-8 text-sm appearance-none [&::-webkit-calendar-picker-indicator]:hidden ${
              startDate
                ? "border-[#8D1231] bg-red-50 text-[#8D1231]"
                : "border-gray-300"
            }`}
          />
          <Calendar
            size={14}
            className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-[#8D1231]"
            onClick={() => startDateRef.current?.showPicker()}
          />
        </div>

        <span className="text-gray-400 text-sm">-</span>

        {/* End Date */}
        <div className="relative">
          <input
            ref={endDateRef}
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className={`h-9 w-[130px] rounded-md border px-3 pr-8 text-sm appearance-none [&::-webkit-calendar-picker-indicator]:hidden ${
              endDate
                ? "border-[#8D1231] bg-red-50 text-[#8D1231]"
                : "border-gray-300"
            }`}
          />
          <Calendar
            size={14}
            className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-[#8D1231]"
            onClick={() => endDateRef.current?.showPicker()}
          />
        </div>

        {/* Reset Button */}
        <button
          onClick={onReset}
          title="Reset Filter"
          className={`flex h-9 w-9 items-center justify-center rounded-md border transition ${
            isFilterActive
              ? "border-[#8D1231] bg-[#8D1231] text-white hover:bg-[#73122E]"
              : "border-gray-300 text-gray-500 hover:bg-gray-50"
          }`}
        >
          <RotateCcw size={16} />
        </button>
      </div>

      {/* Actions (Export PDF, etc.) */}
      {actions && <div className="ml-auto flex shrink-0">{actions}</div>}
    </div>
  );
}
