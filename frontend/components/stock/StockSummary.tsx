import { useStockSummary } from "@/hooks/useStockSummary";
import { InventoryParams } from "@/lib/services/inventory.service";

const safeNumber = (value?: number) => (value ?? 0).toLocaleString();

interface StockSummaryProps {
  programType?: "FWC" | "VOUCHER";
  filters?: InventoryParams;
}

export function StockSummary({ programType, filters }: StockSummaryProps) {
  const { summary, loading } = useStockSummary(programType, filters);

  const getStockStatus = (label: string, value: number) => {
    // Customize status logic if needed, e.g. based on low stock threshold
    return null; // Disabled status color for detailed breakdown for now unless requested
  };

  const items = [
    {
      label: "Total Stock",
      value: summary.totalStock,
      color: "bg-blue-50 text-blue-900 border-blue-200",
    },
    {
      label: "In Office",
      value: summary.totalInOffice,
      color: "bg-gray-50 text-gray-900 border-gray-200",
    },
    {
      label: "In Station",
      value: summary.totalInStation,
      color: "bg-indigo-50 text-indigo-900 border-indigo-200",
    },
    {
      label: "In Transit",
      value: summary.totalInTransfer,
      color: "bg-orange-50 text-orange-900 border-orange-200",
    },
    {
      label: "Sold / Active",
      value: summary.totalSold,
      color: "bg-green-50 text-green-900 border-green-200",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {items.map((item) => {
        return (
          <div
            key={item.label}
            className={`rounded-lg border p-4 shadow-sm transition-colors ${item.color}`}
          >
            <p className="text-sm font-medium opacity-80 mb-1">{item.label}</p>
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-2xl font-bold">
                {loading ? "…" : safeNumber(item.value)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
