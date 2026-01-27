"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "@/lib/axios";

interface SummaryData {
  totalCards: number;
  totalIn: number;
  totalOut: number;
}

export const useStockSummary = () => {
  const [summary, setSummary] = useState<SummaryData>({
    totalCards: 0,
    totalIn: 0,
    totalOut: 0,
  });

  const [loading, setLoading] = useState(true);

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get("/inventory/total-summary");
      const data = res.data?.data;

      if (data) {
        setSummary({
          totalCards: Number(data.totalCards || 0),
          totalIn: Number(data.totalIn || 0),
          totalOut: Number(data.totalOut || 0),
        });
      }
    } catch (err) {
      console.error("FETCH TOTAL SUMMARY ERROR:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return { summary, loading, refresh: fetchSummary };
};
