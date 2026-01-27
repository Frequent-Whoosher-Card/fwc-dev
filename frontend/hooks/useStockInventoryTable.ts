"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import axios from "@/lib/axios";

export interface StockRow {
  categoryId: string;
  categoryName: string;
  typeId: string;
  typeName: string;
  totalOffice: number;
  totalBeredar: number;
  totalAktif: number;
  totalNonAktif: number;
  totalBelumTerjual: number;
}

interface Filters {
  station: string;
  category: string;
  type: string;
  startDate: string;
  endDate: string;
}

export const useStockInventoryTable = (filters: Filters) => {
  const [rows, setRows] = useState<StockRow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};

      if (filters.station !== "all") params.stationName = filters.station;
      if (filters.category !== "all") params.categoryName = filters.category;
      if (filters.type !== "all") params.typeName = filters.type;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const res = await axios.get("/inventory/category-type-summary", {
        params,
      });

      const raw = res.data?.data ?? [];

      setRows(
        raw.map((item: any) => ({
          categoryId: item.categoryId,
          categoryName: item.categoryName ?? "-",
          typeId: item.typeId,
          typeName: item.typeName ?? "-",
          totalOffice: Number(item.totalOffice ?? 0),
          totalBeredar: Number(item.totalBeredar ?? 0),
          totalAktif: Number(item.totalAktif ?? 0),
          totalNonAktif: Number(item.totalNonAktif ?? 0),
          totalBelumTerjual: Number(item.totalBelumTerjual ?? 0),
        })),
      );
    } catch (err) {
      console.error("FETCH SUMMARY ERROR:", err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [
    filters.station,
    filters.category,
    filters.type,
    filters.startDate,
    filters.endDate,
  ]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        acc.totalOffice += row.totalOffice;
        acc.totalBeredar += row.totalBeredar;
        acc.totalAktif += row.totalAktif;
        acc.totalNonAktif += row.totalNonAktif;
        acc.totalBelumTerjual += row.totalBelumTerjual;
        return acc;
      },
      {
        totalOffice: 0,
        totalBeredar: 0,
        totalAktif: 0,
        totalNonAktif: 0,
        totalBelumTerjual: 0,
      },
    );
  }, [rows]);

  return { rows, loading, totals, refresh: fetchSummary };
};
