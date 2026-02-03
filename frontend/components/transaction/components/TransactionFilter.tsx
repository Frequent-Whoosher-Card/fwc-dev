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
     FETCH FILTER DATA (category & type by program: FWC vs Voucher)
  ====================== */
  useEffect(() => {
    if (activeTab !== "fwc" && activeTab !== "voucher") {
      setCategories([]);
      setTypes([]);
      return;
    }

    const programType = activeTab === "voucher" ? "VOUCHER" : "FWC";

    const fetchFilters = async () => {
      try {
        const [typeRes, categoryRes, stationRes, employeeTypesRes] = await Promise.all([
          axios.get("/card/types/", { params: { programType } }),
          axios.get("/card/category/", { params: { programType } }),
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
  }, [activeTab]);

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

  const selectClass =
    "h-9 min-w-[140px] rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:border-[#8D1231] focus:outline-none focus:ring-1 focus:ring-[#8D1231]";

  /* ======================
     RENDER
  ====================== */
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        {/* Filter dropdowns - satu grup rapi */}
        <select
          value={cardCategoryId ?? ""}
          onChange={(e) => onCardCategoryChange(e.target.value || undefined)}
          className={selectClass}
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

        <select
          value={cardTypeId ?? ""}
          onChange={(e) => onCardTypeChange(e.target.value || undefined)}
          className={selectClass}
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

        <select
          value={employeeTypeId ?? ""}
          onChange={(e) => onEmployeeTypeChange(e.target.value || undefined)}
          className={selectClass}
        >
          <option value="">All Tipe Karyawan</option>
          {employeeTypes.map((et) => (
            <option key={et.id} value={et.id}>
              {et.name}
            </option>
          ))}
        </select>

        {/* Station - style sama dengan select lain */}
        <div ref={stationRef} className="relative">
          <button
            type="button"
            onClick={() => setOpenStation((v) => !v)}
            className="flex h-9 min-w-[140px] items-center justify-between rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:border-[#8D1231] focus:outline-none focus:ring-1 focus:ring-[#8D1231]"
          >
            <span className="truncate">{selectedStation}</span>
            <ChevronDown size={16} className="shrink-0 text-gray-500" />
          </button>

          {openStation && (
            <div className="absolute left-0 top-full z-30 mt-1 min-w-[180px] rounded-md border border-gray-200 bg-white py-1 shadow-lg">
              <button
                onClick={() => {
                  onStationChange(undefined);
                  setOpenStation(false);
                }}
                className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
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
                  className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                >
                  {s.stationName}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Start & End date - satu grup, rapi */}
        {role !== "petugas" && (
          <>
            <div className="flex h-9 items-center gap-2">
              <span className="text-sm font-medium text-gray-600">Start</span>
              <div className="relative">
                <input
                  ref={purchasedRef}
                  type="date"
                  value={purchasedDate ?? ""}
                  onChange={(e) => onPurchasedDateChange(e.target.value || undefined)}
                  className="h-9 w-[140px] rounded-md border border-gray-300 bg-white px-3 pr-8 text-sm text-gray-700 [&::-webkit-calendar-picker-indicator]:hidden focus:border-[#8D1231] focus:outline-none focus:ring-1 focus:ring-[#8D1231]"
                />
                <Calendar
                  size={16}
                  className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500 hover:text-[#8D1231]"
                  onClick={() => purchasedRef.current?.showPicker()}
                />
              </div>
            </div>
            <div className="flex h-9 items-center gap-2">
              <span className="text-sm font-medium text-gray-600">End</span>
              <div className="relative">
                <input
                  ref={shiftRef}
                  type="date"
                  value={shiftDate ?? ""}
                  onChange={(e) => onShiftDateChange(e.target.value || undefined)}
                  className="h-9 w-[140px] rounded-md border border-gray-300 bg-white px-3 pr-8 text-sm text-gray-700 [&::-webkit-calendar-picker-indicator]:hidden focus:border-[#8D1231] focus:outline-none focus:ring-1 focus:ring-[#8D1231]"
                />
                <Calendar
                  size={16}
                  className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500 hover:text-[#8D1231]"
                  onClick={() => shiftRef.current?.showPicker()}
                />
              </div>
            </div>
          </>
        )}

        {/* Pemisah visual sebelum action */}
        <div className="h-6 w-px bg-gray-200" aria-hidden />

        {/* Reset + Laporan */}
        <div className="flex items-center gap-2">
          <button
            onClick={onReset}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border transition-colors ${
              isFilterActive
                ? "border-[#8D1231] bg-[#8D1231] text-white hover:bg-[#73122E]"
                : "border-gray-300 text-gray-500 hover:bg-gray-50"
            }`}
            title="Reset filter"
          >
            <RotateCcw size={16} />
          </button>
          <button
            onClick={onExportPDF}
            className="flex h-9 items-center gap-2 rounded-md border border-[#8D1231] bg-[#8D1231] px-4 text-sm font-medium text-white transition-colors hover:bg-[#73122E]"
          >
            <Download size={16} />
            Laporan Transaksi
          </button>
          <button
            onClick={onExportShiftPDF}
            className="flex h-9 items-center gap-2 rounded-md border border-teal-700 bg-teal-700 px-4 text-sm font-medium text-white transition-colors hover:bg-teal-800"
          >
            <Download size={16} />
            Laporan Shift
          </button>
        </div>
      </div>
    </div>
  );
}
