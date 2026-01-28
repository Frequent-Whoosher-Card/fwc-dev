"use client";

import { useStockSummary } from "@/hooks/useStockSummary";

const safeNumber = (value?: number) => (value ?? 0).toLocaleString();

export function StockSummary({ programType }: { programType?: string }) {
  const { summary, loading } = useStockSummary(programType);

  const items = [
    { label: "All Card", value: summary.totalCards },
    { label: "Stock In", value: summary.totalIn },
    { label: "Stock Out", value: summary.totalOut },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-lg border bg-white p-4 shadow-sm"
        >
          <p className="text-sm text-gray-500">{item.label}</p>
          <p className="text-2xl font-semibold">
            {loading ? "…" : safeNumber(item.value)}
          </p>
        </div>
      ))}
    </div>
  );
}
