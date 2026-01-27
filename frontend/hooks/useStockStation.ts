"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import axios from "@/lib/axios";

export interface StationRow {
  stationName: string;
  cardCategory: string;
  cardType: string;
  cardBeredar: number;
  aktif: number;
  nonAktif: number;
  total: number;
  cardBelumTerjual: number;
}

interface Filters {
  station: string;
  category: string;
  type: string;
}

export const useStockStation = (filters: Filters, programType?: string) => {
  const [rows, setRows] = useState<StationRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStation = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { programType: programType ?? "" };

      if (filters.station !== "all") params.stationName = filters.station;
      if (filters.category !== "all") params.categoryName = filters.category;
      if (filters.type !== "all") params.typeName = filters.type;

      const res = await axios.get("/inventory/station-monitor", {
        params,
      });

      setRows(res.data?.data ?? []);
    } catch (err) {
      console.error("FETCH STATION ERROR:", err);
    } finally {
      setLoading(false);
    }
  }, [filters.station, filters.category, filters.type, programType]);

  useEffect(() => {
    fetchStation();
  }, [fetchStation]);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => {
        acc.cardBeredar += r.cardBeredar;
        acc.aktif += r.aktif;
        acc.nonAktif += r.nonAktif;
        acc.total += r.total;
        acc.cardBelumTerjual += r.cardBelumTerjual;
        return acc;
      },
      {
        cardBeredar: 0,
        aktif: 0,
        nonAktif: 0,
        total: 0,
        cardBelumTerjual: 0,
      },
    );
  }, [rows]);

  return { rows, loading, totals, refresh: fetchStation };
};
