import { useEffect, useState, useCallback } from "react";
import {
  getCombinedSummary,
  InventoryParams,
  CombinedSummaryResponse,
} from "@/lib/services/inventory.service";

export const useStockSummary = (
  programType?: "FWC" | "VOUCHER",
  filters?: InventoryParams,
) => {
  const [summary, setSummary] = useState<
    CombinedSummaryResponse["totalSummary"]
  >({
    totalStock: 0,
    totalInOffice: 0,
    totalInStation: 0,
    totalInTransfer: 0,
    totalSold: 0,
    totalDamaged: 0,
  });

  const [loading, setLoading] = useState(true);

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getCombinedSummary({
        programType,
        ...filters,
      });
      const data = res.data?.totalSummary;

      if (data) {
        setSummary({
          totalStock: Number(data.totalStock || 0),
          totalInOffice: Number(data.totalInOffice || 0),
          totalInStation: Number(data.totalInStation || 0),
          totalInTransfer: Number(data.totalInTransfer || 0),
          totalSold: Number(data.totalSold || 0),
          totalDamaged: Number(data.totalDamaged || 0),
        });
      }
    } catch (err) {
      console.error("FETCH TOTAL SUMMARY ERROR:", err);
    } finally {
      setLoading(false);
    }
  }, [programType, JSON.stringify(filters)]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return { summary, loading, refresh: fetchSummary };
};
