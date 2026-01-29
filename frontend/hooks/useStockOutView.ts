"use client";

import { useState, useEffect, useCallback } from "react";
import stockService, { StockOutDetail } from "@/lib/services/stock.service";
import toast from "react-hot-toast";

export const useStockOutView = (id: string) => {
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
      const item = await stockService.getStockOutById(id);
      setData(item);
    } catch (err) {
      toast.error("Gagal mengambil detail stock out");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  return {
    data,
    loading,
    refresh: fetchDetail,
  };
};
