"use client";

import { RotateCcw, Calendar, Download, ChevronDown } from "lucide-react";
import { useRef, useState } from "react";

/* ======================
   TYPES
====================== */
interface StationItem {
  id: string;
  stationCode: string;
  stationName: string;
  location?: string | null;
}

interface Props {
  type: "ALL" | "KAI";
  stationId?: string;
  purchasedDate?: string;
  shiftDate?: string;

  stations: StationItem[];

  onTypeChange: (v: "ALL" | "KAI") => void;
  onStationChange: (v?: string) => void;
  onPurchasedDateChange: (v?: string) => void;
  onShiftDateChange: (v?: string) => void;
  onReset: () => void;
  onExportPDF: () => void;
}

export default function TransactionFilter({
  type,
  stationId,
  purchasedDate,
  shiftDate,
  stations,
  onTypeChange,
  onStationChange,
  onPurchasedDateChange,
  onShiftDateChange,
  onReset,
  onExportPDF,
}: Props) {
  const purchasedRef = useRef<HTMLInputElement>(null);
  const shiftRef = useRef<HTMLInputElement>(null);

  const [openStation, setOpenStation] = useState(false);

  const selectedStation =
    stations.find((s) => s.id === stationId)?.stationName || "All Station";

  return (
    <div className="flex items-center gap-3 rounded-xl border bg-white px-4 py-3">
      {/* TYPE */}
      <div className="flex items-center gap-2">
        {["ALL", "KAI"].map((t) => (
          <button
            key={t}
            onClick={() => onTypeChange(t as "ALL" | "KAI")}
            className={`
              h-9 rounded-md px-4 text-sm transition
              ${
                type === t
                  ? "bg-[#8D1231] text-white"
                  : "border bg-white text-gray-700 hover:bg-[#FAF3F5]"
              }
            `}
          >
            {t === "ALL" ? "All" : "NIPKAI"}
          </button>
        ))}
      </div>

      {/* STATION – FULL MAROON DROPDOWN */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpenStation((v) => !v)}
          className="
            flex h-9 w-[160px] items-center justify-between
            rounded-md border border-[#8D1231]
            bg-[#8D1231] px-3 text-sm text-white
            hover:bg-[#73122E]
          "
        >
          <span className="truncate">{selectedStation}</span>
          <ChevronDown size={16} />
        </button>

        {openStation && (
          <div
            className="
              absolute z-20 mt-1 w-full
              rounded-md border border-[#8D1231]
              bg-[#8D1231]
              shadow-lg
            "
          >
            <button
              onClick={() => {
                onStationChange(undefined);
                setOpenStation(false);
              }}
              className="
                block w-full px-3 py-2 text-left text-sm text-white
                hover:bg-[#73122E]
              "
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
                className={`
                  block w-full px-3 py-2 text-left text-sm text-white
                  hover:bg-[#73122E]
                  ${stationId === s.id ? "bg-[#73122E]" : ""}
                `}
              >
                {s.stationName}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* PURCHASE DATE */}
      <div className="flex items-center gap-1">
        <span className="text-sm text-gray-600">Purchased Date</span>
        <div className="relative">
          <input
            ref={purchasedRef}
            type="date"
            value={purchasedDate ?? ""}
            onChange={(e) =>
              onPurchasedDateChange(e.target.value || undefined)
            }
            className="
              h-9 w-[170px] rounded-md border px-3 pr-9 text-sm
              focus:border-[#8D1231] focus:ring-1 focus:ring-[#8D1231]
              appearance-none [&::-webkit-calendar-picker-indicator]:hidden
            "
          />
          <button
            onClick={() => purchasedRef.current?.showPicker()}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8D1231]"
          >
            <Calendar size={16} />
          </button>
        </div>
      </div>

      {/* SHIFT DATE */}
      <div className="flex items-center gap-1">
        <span className="text-sm text-gray-600">Shift Date</span>
        <div className="relative">
          <input
            ref={shiftRef}
            type="date"
            value={shiftDate ?? ""}
            onChange={(e) => onShiftDateChange(e.target.value || undefined)}
            className="
              h-9 w-[170px] rounded-md border px-3 pr-9 text-sm
              focus:border-[#8D1231] focus:ring-1 focus:ring-[#8D1231]
              appearance-none [&::-webkit-calendar-picker-indicator]:hidden
            "
          />
          <button
            onClick={() => shiftRef.current?.showPicker()}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8D1231]"
          >
            <Calendar size={16} />
          </button>
        </div>
      </div>

      {/* RESET */}
      <button
        onClick={onReset}
        className="
          flex h-9 w-9 items-center justify-center
          rounded-md border text-[#8D1231]
          hover:bg-[#FAF3F5]
        "
      >
        <RotateCcw size={16} />
      </button>

      {/* PDF */}
      <div className="ml-auto">
        <button
          onClick={onExportPDF}
          className="
            flex h-9 items-center gap-2
            rounded-md border border-[#8D1231]
            px-4 text-sm text-[#8D1231]
            hover:bg-[#FAF3F5]
          "
        >
          <Download size={16} />
          PDF
        </button>
      </div>
    </div>
  );
}