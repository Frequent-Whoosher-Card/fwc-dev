"use client";

import { RotateCcw, Calendar, Download } from "lucide-react";
import { useMemo, useRef, useState, useEffect } from "react";
import axios from "@/lib/axios";
import { getEmployeeTypes } from "@/lib/services/employee-type.service";
import { MultiSelect } from "@/components/ui/multi-select";

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
  stationIds?: string[];
  purchasedDate?: string;
  shiftDate?: string;
  cardCategoryIds?: string[];
  cardTypeIds?: string[];
  employeeTypeIds?: string[];

  onStationChange: (v?: string[]) => void;
  onPurchasedDateChange: (v?: string) => void;
  onShiftDateChange: (v?: string) => void;
  onCardCategoryChange: (v?: string[]) => void;
  onCardTypeChange: (v?: string[]) => void;
  onEmployeeTypeChange: (v?: string[]) => void;

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

  stationIds = [],
  purchasedDate,
  shiftDate,
  cardCategoryIds = [],
  cardTypeIds = [],
  employeeTypeIds = [],

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
     HELPERS
  ====================== */
  const isFilterActive =
    (stationIds && stationIds.length > 0) ||
    !!purchasedDate ||
    !!shiftDate ||
    (cardCategoryIds && cardCategoryIds.length > 0) ||
    (cardTypeIds && cardTypeIds.length > 0) ||
    (employeeTypeIds && employeeTypeIds.length > 0);

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
  // Convert to MultiSelect options format
  const categoryOptions = useMemo(
    () =>
      categories.map((c) => ({
        id: c.id,
        name: c.categoryName,
        code: c.id,
      })),
    [categories]
  );

  const typeOptions = useMemo(
    () =>
      safeTypes.map((t) => ({
        id: t.id,
        name: t.typeName,
        code: t.id,
      })),
    [safeTypes]
  );

  const stationOptions = useMemo(
    () =>
      stations.map((s) => ({
        id: s.id,
        name: s.stationName,
        code: s.id,
      })),
    [stations]
  );

  const employeeTypeOptions = useMemo(
    () =>
      employeeTypes.map((et) => ({
        id: et.id,
        name: et.name,
        code: et.id,
      })),
    [employeeTypes]
  );

  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        {/* Filter dengan MultiSelect (checkbox) */}
        <MultiSelect
          value={cardCategoryIds || []}
          onChange={(val) => onCardCategoryChange(val.length > 0 ? val : undefined)}
          options={categoryOptions}
          placeholder={activeTab === "fwc" ? "All Card Category" : "All Voucher Category"}
          className="w-full sm:w-36"
        />

        <MultiSelect
          value={cardTypeIds || []}
          onChange={(val) => onCardTypeChange(val.length > 0 ? val : undefined)}
          options={typeOptions}
          placeholder={activeTab === "fwc" ? "All Card Type" : "All Voucher Type"}
          className="w-full sm:w-36"
        />

        <MultiSelect
          value={employeeTypeIds || []}
          onChange={(val) => onEmployeeTypeChange(val.length > 0 ? val : undefined)}
          options={employeeTypeOptions}
          placeholder="All Tipe Karyawan"
          className="w-full sm:w-36"
        />

        <MultiSelect
          value={stationIds || []}
          onChange={(val) => onStationChange(val.length > 0 ? val : undefined)}
          options={stationOptions}
          placeholder="All Station"
          className="w-full sm:w-36"
        />

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
