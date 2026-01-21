"use client";

import { RotateCcw, Calendar, Download, ChevronDown } from "lucide-react";
import { useMemo, useRef, useState, useEffect } from "react";
import axios from "@/lib/axios";

/* ======================
   TYPES
====================== */
interface StationItem {
  id: string;
  stationName: string;
}

interface CardCategoryItem {
  id: string;
  categoryName: string;
}

interface CardTypeItem {
  id: string;
  typeName: string;
}

interface Props {
  stationId?: string;
  purchasedDate?: string;
  shiftDate?: string;
  cardCategoryId?: string;
  cardTypeId?: string;

  onStationChange: (v?: string) => void;
  onPurchasedDateChange: (v?: string) => void;
  onShiftDateChange: (v?: string) => void;
  onCardCategoryChange: (v?: string) => void;
  onCardTypeChange: (v?: string) => void;

  onReset: () => void;
  onExportPDF: () => void;
}

export default function TransactionFilter({
  stationId,
  purchasedDate,
  shiftDate,
  cardCategoryId,
  cardTypeId,
  onStationChange,
  onPurchasedDateChange,
  onShiftDateChange,
  onCardCategoryChange,
  onCardTypeChange,
  onReset,
  onExportPDF,
}: Props) {
  const purchasedRef = useRef<HTMLInputElement>(null);
  const shiftRef = useRef<HTMLInputElement>(null);
  const stationRef = useRef<HTMLDivElement>(null);

  const [openStation, setOpenStation] = useState(false);

  const [stations, setStations] = useState<StationItem[]>([]);
  const [cardCategories, setCardCategories] = useState<CardCategoryItem[]>([]);
  const [cardTypes, setCardTypes] = useState<CardTypeItem[]>([]);

  /* ======================
     FETCH FILTER DATA
  ====================== */
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [typeRes, categoryRes, stationRes] = await Promise.all([
          axios.get("/card/types/"),
          axios.get("/card/category/"),
          axios.get("/station/?page=&limit=&search="),
        ]);

        // CARD TYPE
        setCardTypes(
          Array.isArray(typeRes.data?.data) ? typeRes.data.data : [],
        );

        // CARD CATEGORY
        setCardCategories(
          Array.isArray(categoryRes.data?.data) ? categoryRes.data.data : [],
        );

        // STATION (PAGINATED RESPONSE)
        const stationData = stationRes.data?.data;
        setStations(Array.isArray(stationData?.items) ? stationData.items : []);
      } catch (error) {
        console.error("Failed to load filter data:", error);
      }
    };

    fetchFilters();
  }, []);

  /* ======================
     CLOSE STATION ON OUTSIDE CLICK
  ====================== */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        stationRef.current &&
        !stationRef.current.contains(e.target as Node)
      ) {
        setOpenStation(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ======================
     SELECTED STATION LABEL
  ====================== */
  const selectedStation = useMemo(() => {
    if (!Array.isArray(stations)) return "All Station";
    return (
      stations.find((s) => s.id === stationId)?.stationName || "All Station"
    );
  }, [stations, stationId]);

  /* ======================
     HELPER
  ====================== */
  const isFilterActive =
    !!stationId ||
    !!purchasedDate ||
    !!shiftDate ||
    !!cardCategoryId ||
    !!cardTypeId;

  /* ======================
     SANITIZE CARD TYPES
  ====================== */
  const safeCardTypes = useMemo(() => {
    return cardTypes.filter(
      (t) => typeof t.typeName === "string" && t.typeName.trim() !== "",
    );
  }, [cardTypes]);

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-white px-4 py-3">
      {/* CARD CATEGORY */}
      <select
        value={cardCategoryId ?? ""}
        onChange={(e) => onCardCategoryChange(e.target.value || undefined)}
        className="
    h-9 rounded-md border px-3 text-sm
    bg-white text-gray-700 border-gray-300

    focus:bg-[#8D1231]
    focus:text-white
    focus:border-[#8D1231]
    focus:outline-none

    transition-colors
  "
      >
        <option value="">All Category</option>
        {cardCategories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.categoryName}
          </option>
        ))}
      </select>

      {/* CARD TYPE */}
      <select
        value={cardTypeId ?? ""}
        onChange={(e) => onCardTypeChange(e.target.value || undefined)}
        className="
    h-9 rounded-md border px-3 text-sm
    bg-white text-gray-700 border-gray-300

    focus:bg-[#8D1231]
    focus:text-white
    focus:border-[#8D1231]
    focus:outline-none

    transition-colors
  "
      >
        <option value="">All Type</option>
        {safeCardTypes.map((t) => (
          <option key={t.id} value={t.id}>
            {t.typeName}
          </option>
        ))}
      </select>

      {/* STATION */}
      <div ref={stationRef} className="relative">
        <button
          type="button"
          onClick={() => setOpenStation((v) => !v)}
          className="flex h-9 w-[160px] items-center justify-between rounded-md bg-[#8D1231] px-3 text-sm text-white"
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

      {/* PURCHASE DATE */}
      <div className="relative">
        <input
          ref={purchasedRef}
          type="date"
          value={purchasedDate ?? ""}
          onChange={(e) => onPurchasedDateChange(e.target.value || undefined)}
          className={`
      h-9 w-[160px] rounded-md border px-3 pr-9 text-sm
      appearance-none
      [&::-webkit-calendar-picker-indicator]:hidden
    `}
        />

        <Calendar
          size={16}
          className="
      absolute right-2 top-1/2 -translate-y-1/2
      cursor-pointer text-[#8D1231]
    "
          onClick={() => purchasedRef.current?.showPicker()}
        />
      </div>

      {/* SHIFT DATE */}
      <div className="relative">
        <input
          ref={shiftRef}
          type="date"
          value={shiftDate ?? ""}
          onChange={(e) => onShiftDateChange(e.target.value || undefined)}
          className={`
      h-9 w-[160px] rounded-md border px-3 pr-9 text-sm
      appearance-none
      [&::-webkit-calendar-picker-indicator]:hidden
    `}
        />

        <Calendar
          size={16}
          className="
      absolute right-2 top-1/2 -translate-y-1/2
      cursor-pointer text-[#8D1231]
    "
          onClick={() => shiftRef.current?.showPicker()}
        />
      </div>

      {/* RESET */}
      <button
        onClick={() => {
          setOpenStation(false);
          onReset();
        }}
        className={`
    flex h-9 w-9 items-center justify-center rounded-md border transition-colors
    ${
      isFilterActive
        ? "border-[#8D1231] bg-[#8D1231] text-white hover:bg-[#73122E]"
        : "border-gray-300 text-gray-400 cursor-default"
    }
  `}
        title="Reset Filter"
      >
        <RotateCcw size={16} />
      </button>

      {/* EXPORT */}
      <div className="ml-auto">
        <button
          onClick={onExportPDF}
          className="
      flex h-9 items-center gap-2
      rounded-md px-4 text-sm
      border border-[#8D1231]
      bg-[#8D1231] text-white
      hover:bg-[#73122E]
      transition-colors
    "
        >
          <Download size={16} />
          PDF
        </button>
      </div>
    </div>
  );
}
