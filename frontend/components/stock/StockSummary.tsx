"use client";

import { useStockSummary } from "@/hooks/useStockSummary";

const safeNumber = (value?: number) => (value ?? 0).toLocaleString();

export function StockSummary({ programType }: { programType?: string }) {
  const { summary, loading } = useStockSummary(programType);

  const getStockStatus = (label: string, value: number) => {
    if (label !== "Stock In") return null;

    if (value > 200) {
      return {
        color: "bg-green-100 text-green-800 border-green-200",
        message: "Stock Aman",
      };
    } else if (value >= 100 && value <= 200) {
      return {
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        message: "Stock Peringatan",
      };
    } else {
      return {
        color: "bg-red-100 text-red-800 border-red-200",
        message: "Stock Menipis Segera Generate Kartu",
      };
    }
  };

  const items = [
    { label: "All Stock", value: summary.totalCards },
    { label: "Stock In", value: summary.totalIn },
    { label: "Stock Out", value: summary.totalOut },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {items.map((item) => {
        const status = getStockStatus(item.label, item.value || 0);

        return (
          <div
            key={item.label}
            className={`rounded-lg border p-4 shadow-sm transition-colors ${
              status ? status.color : "bg-white border-gray-200 text-black"
            }`}
          >
            <p
              className={`text-sm ${status ? "text-current" : "text-gray-500"}`}
            >
              {item.label}
            </p>
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-2xl font-semibold">
                {loading ? "…" : safeNumber(item.value)}
              </p>
              {status && !loading && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-right italic">
                  {status.message}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
