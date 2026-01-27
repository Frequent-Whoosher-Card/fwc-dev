"use client";

import { useState, useEffect, useCallback } from "react";
import stockService, { StockInDetail } from "@/lib/services/stock.service";
import toast from "react-hot-toast";

export const useStockInView = (id: string) => {
  const [data, setData] = useState<StockInDetail>({
    id: "",
    movementAt: "",
    quantity: 0,
    cardCategory: { name: "-" },
    cardType: { name: "-" },
    serialItems: [],
  });

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const movement = await stockService.getStockInById(id);
      setData(movement);
    } catch (err) {
      toast.error("Gagal mengambil detail stock");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const updateStatusBatch = async (serials: string[], status: string) => {
    if (serials.length === 0) {
      toast.error("Pilih minimal satu serial number");
      return;
    }

    try {
      setUpdating(true);
      const updates = serials.map((serial) => ({
        serialNumber: serial,
        status,
      }));

      await stockService.updateStockInStatusBatch(id, updates);

      toast.success(`Serial number berhasil di-${status.toLowerCase()}`);

      // Update UI
      setData((prev) => ({
        ...prev,
        serialItems: prev.serialItems.map((item) =>
          serials.includes(item.serialNumber) ? { ...item, status } : item,
        ),
      }));
      return true;
    } catch (err: any) {
      toast.error(err?.message || "Gagal update status");
      return false;
    } finally {
      setUpdating(false);
    }
  };

  return {
    data,
    loading,
    updating,
    updateStatusBatch,
    refresh: fetchDetail,
  };
};
