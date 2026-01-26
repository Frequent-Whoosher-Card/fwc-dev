"use client";

import { useState } from "react";
import { StockSummary } from "./StockSummary";
import { StockTable } from "./StockTable";
import { StockStation } from "./StockStation";
import { StockFilterReusable } from "./StockFilterReusable";
import SwitchTab, { SwitchTabItem } from "@/components/SwitchTab";

type StockMode = "all" | "station";

interface BaseStockSummaryProps {
  programType: "FWC" | "VOUCHER";
}

export default function BaseStockSummary({
  programType,
}: BaseStockSummaryProps) {
  const [mode, setMode] = useState<StockMode>("all");

  const tabs: SwitchTabItem[] = [
    { label: "FWC", path: "/dashboard/superadmin/stock/fwc" },
    { label: "Voucher", path: "/dashboard/superadmin/stock/voucher" },
  ];

  const [filters, setFilters] = useState({
    station: "all",
    category: "all",
    type: "all",
    startDate: "",
    endDate: "",
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold whitespace-nowrap">
          Dashboard Stock
        </h2>
        <SwitchTab items={tabs} />
      </div>

      {/* SUMMARY */}
      <StockSummary />

      {/* FILTER & MODE SWITCH */}
      <div className="flex flex-col gap-4">
        <div className="flex rounded-md border overflow-hidden w-fit">
          <button
            className={`px-4 py-2 text-sm transition-colors ${mode === "all" ? "bg-[#8D1231] text-white" : "bg-white hover:bg-gray-50"}`}
            onClick={() => {
              setMode("all");
              setFilters((f) => ({ ...f, station: "all" }));
            }}
          >
            All Stock
          </button>
          <button
            className={`px-4 py-2 text-sm transition-colors ${mode === "station" ? "bg-[#8D1231] text-white" : "bg-white hover:bg-gray-50"}`}
            onClick={() => setMode("station")}
          >
            By Station
          </button>
        </div>

        <StockFilterReusable
          values={filters}
          onFilterChange={(newValues) => {
            setFilters((prev) => ({ ...prev, ...newValues }));
          }}
          onReset={() => {
            setFilters({
              station: "all",
              category: "all",
              type: "all",
              startDate: "",
              endDate: "",
            });
          }}
          showFields={{
            category: true,
            type: true,
            station: mode === "station",
            dateRange: true,
          }}
        />
      </div>

      {/* TABLE SWITCH */}
      {mode === "all" && <StockTable filters={filters} />}

      {mode === "station" && <StockStation filters={filters} />}
    </div>
  );
}
