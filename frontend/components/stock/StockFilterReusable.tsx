"use client";

import { useState, useEffect, useRef } from "react";
import {
  Calendar,
  FileDown,
  Plus,
  Search,
  RefreshCcw,
  ArrowLeftRight,
} from "lucide-react";
import axios from "@/lib/axios";
import { ThemedSelect } from "@/components/ui/ThemedSelect";

interface Option {
  id: string;
  name: string;
  code: string;
}

export interface StockFilterValues {
  status?: string;
  category?: string;
  type?: string;
  station?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

interface StockFilterReusableProps {
  values: StockFilterValues;
  onFilterChange: (newValues: Partial<StockFilterValues>) => void;
  onReset?: () => void;
  onExportPDF?: () => void;
  onAdd?: () => void;
  showFields?: {
    status?: boolean;
    category?: boolean;
    type?: boolean;
    station?: boolean;
    search?: boolean;
    dateRange?: boolean;
    exportPDF?: boolean;
    add?: boolean;
  };
  statusOptions?: string[];
  addLabel?: string;
  programType?: "FWC" | "VOUCHER";
}

export function StockFilterReusable({
  values,
  onFilterChange,
  onReset,
  onExportPDF,
  onAdd,
  showFields = {
    category: true,
    type: true,
    dateRange: true,
  },
  statusOptions = [],
  addLabel = "Tambah",
  programType,
}: StockFilterReusableProps) {
  const [categories, setCategories] = useState<Option[]>([]);
  const [types, setTypes] = useState<Option[]>([]);
  const [stations, setStations] = useState<Option[]>([]);

  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const promises = [];
        if (showFields.category)
          promises.push(
            axios.get("/card/category", { params: { programType } }),
          );
        if (showFields.type)
          promises.push(axios.get("/card/types", { params: { programType } }));
        if (showFields.station)
          promises.push(
            axios.get("/station/", { params: { page: 1, limit: 1000 } }),
          );

        const results = await Promise.all(promises);
        let idx = 0;

        if (showFields.category) {
          const data = results[idx++]?.data?.data || [];
          setCategories(
            data.map((c: any) => ({
              id: c.id,
              name: c.categoryName,
              code: c.categoryName,
            })),
          );
        }
        if (showFields.type) {
          const data = results[idx++]?.data?.data || [];
          setTypes(
            data.map((t: any) => ({
              id: t.id,
              name: t.typeName,
              code: t.typeName,
            })),
          );
        }
        if (showFields.station) {
          const data = results[idx++]?.data?.data?.items || [];
          setStations(
            data.map((s: any) => ({
              id: s.id,
              name: s.stationName,
              code: s.stationName,
            })),
          );
        }
      } catch (err) {
        console.error("Failed to fetch filter options", err);
      }
    };

    fetchData();
  }, [
    showFields.category,
    showFields.type,
    showFields.station,
    programType ?? "",
  ]);

  const handleValueChange = (field: keyof StockFilterValues, value: string) => {
    onFilterChange({ [field]: value });
  };

  const selectClass =
    "w-full sm:w-auto rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#8D1231] focus:ring-1 focus:ring-[#8D1231] outline-none transition-all";
  const inputClass =
    "w-full sm:w-48 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#8D1231] focus:ring-1 focus:ring-[#8D1231] outline-none transition-all";
  const dateInputWrapper = "relative w-full sm:w-auto flex items-center gap-2";
  const dateInputClass =
    "w-full sm:w-36 rounded-md border border-gray-300 bg-white px-3 py-1.5 pr-9 text-sm focus:border-[#8D1231] outline-none appearance-none [&::-webkit-calendar-picker-indicator]:opacity-0";

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-col xl:flex-row xl:items-end xl:flex-wrap justify-between gap-4 w-full">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* STATUS */}
          {showFields.status && (
            <ThemedSelect
              value={values.status}
              onChange={(val) => handleValueChange("status", val)}
              options={statusOptions.map((st) => ({
                id: st,
                name: st.replace(/_/g, " "),
                code: st,
              }))}
              placeholder="All Status"
            />
          )}

          {/* CATEGORY */}
          {showFields.category && (
            <ThemedSelect
              value={values.category}
              onChange={(val) => handleValueChange("category", val)}
              options={categories}
              placeholder="All Category"
            />
          )}

          {/* TYPE */}
          {showFields.type && (
            <ThemedSelect
              value={values.type}
              onChange={(val) => handleValueChange("type", val)}
              options={types}
              placeholder="All Type"
            />
          )}

          {/* STATION */}
          {showFields.station && (
            <ThemedSelect
              value={values.station}
              onChange={(val) => handleValueChange("station", val)}
              options={stations}
              placeholder="All Station"
            />
          )}

          {/* SEARCH */}
          {showFields.search && (
            <div className="relative w-full sm:w-auto">
              <input
                placeholder="Search serial..."
                value={values.search}
                onChange={(e) => handleValueChange("search", e.target.value)}
                className={`${inputClass} pl-9`}
              />
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={16}
              />
            </div>
          )}

          {/* DATE RANGE */}
          {showFields.dateRange && (
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className={dateInputWrapper}>
                <span className="text-xs text-gray-500 uppercase font-semibold sm:hidden">
                  Dari
                </span>
                <input
                  ref={startDateRef}
                  type="date"
                  value={values.startDate}
                  onChange={(e) =>
                    handleValueChange("startDate", e.target.value)
                  }
                  className={dateInputClass}
                />
                <button
                  type="button"
                  onClick={() => startDateRef.current?.showPicker?.()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8D1231]"
                >
                  <Calendar size={16} />
                </button>
              </div>

              <span className="hidden sm:block text-gray-400">/</span>

              <div className={dateInputWrapper}>
                <span className="text-xs text-gray-500 uppercase font-semibold sm:hidden">
                  Sampai
                </span>
                <input
                  ref={endDateRef}
                  type="date"
                  value={values.endDate}
                  onChange={(e) => handleValueChange("endDate", e.target.value)}
                  className={dateInputClass}
                />
                <button
                  type="button"
                  onClick={() => endDateRef.current?.showPicker?.()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8D1231]"
                >
                  <Calendar size={16} />
                </button>
              </div>
            </div>
          )}

          {/* RESET */}
          {onReset && (
            <button
              onClick={onReset}
              className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              title="Reset Filters"
            >
              <RefreshCcw size={16} />
              <span className="sm:hidden">Reset</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* EXPORT */}
          {showFields.exportPDF && onExportPDF && (
            <button
              onClick={onExportPDF}
              className="flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <FileDown size={16} />
              PDF
            </button>
          )}

          {/* ADD */}
          {showFields.add && onAdd && (
            <button
              onClick={onAdd}
              className="flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-md bg-[#8D1231] px-4 py-2 text-sm font-medium text-white hover:bg-[#a6153a] transition-colors"
            >
              {addLabel.toLowerCase().includes("transfer") ? (
                <ArrowLeftRight size={16} />
              ) : (
                <Plus size={16} />
              )}
              {addLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
