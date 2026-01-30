import { useEffect, useState } from "react";
import { Calendar, RotateCcw } from "lucide-react";
import { RefObject } from "react";
import { getEmployeeTypes } from "@/lib/services/employee-type.service";

interface EmployeeTypeItem {
  id: string;
  code: string;
  name: string;
}

interface MembershipFilterProps {
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
}

export default function MembershipFilter({
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
    <div className="flex items-center gap-2 rounded-lg border bg-white px-4 py-3">
      {/* All Button */}
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

      {/* NIPKAI Button */}
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

      {/* Gender Dropdown */}
      <select
        value={gender}
        onChange={(e) => onGenderChange(e.target.value as "all" | "L" | "P")}
        className="h-9 rounded-md border px-3 text-sm border-[#8D1231] bg-[#8D1231] text-white focus:outline-none"
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
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">Start</span>
        <div className="relative">
          <input
            ref={startDateRef}
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className={`h-9 w-[160px] rounded-md border px-3 pr-9 text-sm appearance-none [&::-webkit-calendar-picker-indicator]:hidden ${
              startDate
                ? "border-[#8D1231] bg-red-50 text-[#8D1231]"
                : "border-gray-300"
            }`}
          />
          <Calendar
            size={16}
            className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-[#8D1231]"
            onClick={() => startDateRef.current?.showPicker()}
          />
        </div>
      </div>

      {/* End Date */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">End</span>
        <div className="relative">
          <input
            ref={endDateRef}
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className={`h-9 w-[160px] rounded-md border px-3 pr-9 text-sm appearance-none [&::-webkit-calendar-picker-indicator]:hidden ${
              endDate
                ? "border-[#8D1231] bg-red-50 text-[#8D1231]"
                : "border-gray-300"
            }`}
          />
          <Calendar
            size={16}
            className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-[#8D1231]"
            onClick={() => endDateRef.current?.showPicker()}
          />
        </div>
      </div>

      {/* Reset Button */}
      <button
        onClick={onReset}
        className={`flex h-9 w-9 items-center justify-center rounded-md border transition ${
          isFilterActive
            ? "border-[#8D1231] bg-[#8D1231] text-white hover:bg-[#73122E]"
            : "border-gray-300 text-gray-500"
        }`}
      >
        <RotateCcw size={16} />
      </button>
    </div>
  );
}
