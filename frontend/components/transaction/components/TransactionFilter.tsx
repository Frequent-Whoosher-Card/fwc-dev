"use client";

import { RotateCcw, Calendar, Download, ChevronDown } from "lucide-react";
import { useMemo, useRef, useState, useEffect } from "react";
import axios from "@/lib/axios";
import { getEmployeeTypes } from "@/lib/services/employee-type.service";

/* ======================
   TYPES
====================== */
interface StationItem {
  id: string;
  stationName: string;
}

interface CategoryItem {
  id: string;
  categoryName: string;
}

interface TypeItem {
  id: string;
  typeName: string;
}

interface EmployeeTypeItem {
  id: string;
  code: string;
  name: string;
}

type TabType = "fwc" | "voucher";

interface Props {
  /* TAB */
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;

  /* ROLE */
  role?: "superadmin" | "admin" | "supervisor" | "petugas";

  /* FILTER */
  stationId?: string;
  purchasedDate?: string;
  shiftDate?: string;
  cardCategoryId?: string;
  cardTypeId?: string;
  employeeTypeId?: string;

  onStationChange: (v?: string) => void;
  onPurchasedDateChange: (v?: string) => void;
  onShiftDateChange: (v?: string) => void;
  onCardCategoryChange: (v?: string) => void;
  onCardTypeChange: (v?: string) => void;
  onEmployeeTypeChange: (v?: string) => void;

  onReset: () => void;
  onExportPDF: () => void;
  onExportShiftPDF: () => void;
}

/* ======================
   COMPONENT
====================== */
export default function TransactionFilter({
  activeTab,
  onTabChange,

  role,

  stationId,
  purchasedDate,
  shiftDate,
  cardCategoryId,
  cardTypeId,
  employeeTypeId,

  onStationChange,
  onPurchasedDateChange,
  onShiftDateChange,
  onCardCategoryChange,
  onCardTypeChange,
  onEmployeeTypeChange,

  onReset,
  onExportPDF,
  onExportShiftPDF,
}: Props) {
  const purchasedRef = useRef<HTMLInputElement>(null);
  const shiftRef = useRef<HTMLInputElement>(null);
  const stationRef = useRef<HTMLDivElement>(null);

  const [openStation, setOpenStation] = useState(false);
  const [stations, setStations] = useState<StationItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [types, setTypes] = useState<TypeItem[]>([]);
  const [employeeTypes, setEmployeeTypes] = useState<EmployeeTypeItem[]>([]);

  /* ======================
     FETCH FILTER DATA
  ====================== */
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [typeRes, categoryRes, stationRes, employeeTypesRes] = await Promise.all([
          axios.get("/card/types/"),
          axios.get("/card/category/"),
          axios.get("/station/?page=&limit=&search="),
          getEmployeeTypes({ limit: 200 }),
        ]);

        setTypes(typeRes.data?.data ?? []);
        setCategories(categoryRes.data?.data ?? []);
        setStations(stationRes.data?.data?.items ?? []);
        setEmployeeTypes(employeeTypesRes.data ?? []);
      } catch (err) {
        console.error("Failed load filter data:", err);
      }
    };

    fetchFilters();
  }, []);

  /* ======================
     CLOSE STATION DROPDOWN
  ====================== */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        stationRef.current &&
        !stationRef.current.contains(e.target as Node)
      ) {
        setOpenStation(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ======================
     HELPERS
  ====================== */
  const selectedStation =
    stations.find((s) => s.id === stationId)?.stationName || "All Station";

  const isFilterActive =
    !!stationId ||
    !!purchasedDate ||
    !!shiftDate ||
    !!cardCategoryId ||
    !!cardTypeId ||
    !!employeeTypeId;

  const safeTypes = useMemo(
    () =>
      types.filter(
        (t) => typeof t.typeName === "string" && t.typeName.trim() !== "",
      ),
    [types],
  );

  /* ======================
     RENDER
  ====================== */
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center rounded-xl border bg-white px-4 py-3">
      {/* CATEGORY */}
      <select
        value={cardCategoryId ?? ""}
        onChange={(e) => onCardCategoryChange(e.target.value || undefined)}
        className="h-9 w-full sm:w-auto sm:min-w-[180px] rounded-md border px-3 text-sm bg-white text-gray-700 border-gray-300
        focus:bg-[#8D1231] focus:text-white focus:border-[#8D1231]"
      >
        <option value="">
          {activeTab === "fwc" ? "All Card Category" : "All Voucher Category"}
        </option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.categoryName}
          </option>
        ))}
      </select>

      {/* TYPE */}
      <select
        value={cardTypeId ?? ""}
        onChange={(e) => onCardTypeChange(e.target.value || undefined)}
        className="h-9 w-full sm:w-auto sm:min-w-[160px] rounded-md border px-3 text-sm bg-white text-gray-700 border-gray-300
        focus:bg-[#8D1231] focus:text-white focus:border-[#8D1231]"
      >
        <option value="">
          {activeTab === "fwc" ? "All Card Type" : "All Voucher Type"}
        </option>
        {safeTypes.map((t) => (
          <option key={t.id} value={t.id}>
            {t.typeName}
          </option>
        ))}
      </select>

      {/* EMPLOYEE TYPE */}
      <select
        value={employeeTypeId ?? ""}
        onChange={(e) => onEmployeeTypeChange(e.target.value || undefined)}
        className="h-9 w-full sm:w-auto sm:min-w-[160px] rounded-md border px-3 text-sm bg-white text-gray-700 border-gray-300
        focus:bg-[#8D1231] focus:text-white focus:border-[#8D1231]"
      >
        <option value="">All Tipe Karyawan</option>
        {employeeTypes.map((et) => (
          <option key={et.id} value={et.id}>
            {et.name}
          </option>
        ))}
      </select>

      {/* STATION */}
      <div ref={stationRef} className="relative w-full sm:w-auto">
        <button
          type="button"
          onClick={() => setOpenStation((v) => !v)}
          className="flex h-9 w-full sm:w-[160px] items-center justify-between rounded-md bg-[#8D1231] px-3 text-sm text-white"
        >
          <span className="truncate">{selectedStation}</span>
          <ChevronDown size={16} />
        </button>

        {openStation && (
          <div className="absolute z-30 mt-1 w-full rounded-md bg-[#8D1231] shadow-lg">
            <button
              onClick={() => {
                onStationChange(undefined);
                setOpenStation(false);
              }}
              className="block w-full px-3 py-2 text-left text-sm text-white hover:bg-[#73122E]"
            >
              All Station
            </button>

            {stations.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  onStationChange(s.id);
                  setOpenStation(false);
                }}
                className="block w-full px-3 py-2 text-left text-sm text-white hover:bg-[#73122E]"
              >
                {s.stationName}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* PURCHASE DATE - Hidden for petugas */}
      {role !== "petugas" && (
        <div className="relative w-full sm:w-auto">
          <input
            ref={purchasedRef}
            type="date"
            value={purchasedDate ?? ""}
            onChange={(e) => onPurchasedDateChange(e.target.value || undefined)}
            className="h-9 w-full sm:w-[160px] rounded-md border px-3 pr-9 text-sm
            [&::-webkit-calendar-picker-indicator]:hidden"
          />
          <Calendar
            size={16}
            className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-[#8D1231]"
            onClick={() => purchasedRef.current?.showPicker()}
          />
        </div>
      )}

      {/* SHIFT DATE - Hidden for petugas */}
      {role !== "petugas" && (
        <div className="relative w-full sm:w-auto">
          <input
            ref={shiftRef}
            type="date"
            value={shiftDate ?? ""}
            onChange={(e) => onShiftDateChange(e.target.value || undefined)}
            className="h-9 w-full sm:w-[160px] rounded-md border px-3 pr-9 text-sm
            [&::-webkit-calendar-picker-indicator]:hidden"
          />
          <Calendar
            size={16}
            className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-[#8D1231]"
            onClick={() => shiftRef.current?.showPicker()}
          />
        </div>
      )}

      {/* RESET + PDF */}
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <button
          onClick={onReset}
          className={`h-9 w-9 rounded-md border flex items-center justify-center shrink-0
          ${
            isFilterActive
              ? "bg-[#8D1231] text-white"
              : "border-gray-300 text-gray-400"
          }`}
        >
          <RotateCcw size={16} />
        </button>

        <button
          onClick={onExportPDF}
          className="h-9 flex-1 sm:flex-none sm:px-4 rounded-md bg-[#8D1231] text-white flex items-center justify-center gap-2 hover:bg-[#73122E]"
        >
          <Download size={16} />
          <span className="text-sm">PDF</span>
        </button>

        <button
          onClick={onExportShiftPDF}
          className="h-9 flex-1 sm:flex-none sm:px-4 rounded-md bg-[#0F766E] text-white flex items-center justify-center gap-2 hover:bg-[#0D5F58]"
        >
          <Download size={16} />
          <span className="text-sm">Shift</span>
        </button>
      </div>
    </div>
  );
}
