"use client";

import { useState, useEffect, useCallback } from "react";
import stockService, { StockOutDetail } from "@/lib/services/stock.service";
import toast from "react-hot-toast";

export const useStockOutView = (
  id: string,
  programType: "FWC" | "VOUCHER" = "FWC",
) => {
  const [data, setData] = useState<StockOutDetail>({
    id: "",
    movementAt: "",
    status: "-",
    quantity: 0,
    stationName: "-",
    note: "-",
    createdByName: "-",
    cardCategory: { name: "-" },
    cardType: { name: "-" },
    sentSerialNumbers: [],
    receivedSerialNumbers: [],
    lostSerialNumbers: [],
    damagedSerialNumbers: [],
  });

  const [loading, setLoading] = useState(true);

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const item = await stockService.getStockOutById(id, programType);
      setData(item);
    } catch (err: any) {
      toast.error(err.message || "Gagal mengambil detail stock out");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id, programType]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  return {
    data,
    loading,
    refresh: fetchDetail,
  };
};
