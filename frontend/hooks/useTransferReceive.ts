"use client";

import { useState, useCallback, useEffect } from "react";
import stockService from "@/lib/services/stock.service";
import toast from "react-hot-toast";

export const useTransferReceive = (id: string) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const result = await stockService.getTransferById(id);
      setData(result);
    } catch (error: any) {
      toast.error(error.message || "Gagal mengambil detail transfer");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const confirmReceive = async () => {
    setSubmitting(true);
    try {
      await stockService.receiveTransfer(id);
      toast.success("Transfer berhasil diterima");
      return true;
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Gagal menerima transfer",
      );
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return {
    data,
    loading,
    submitting,
    confirmReceive,
    refresh: fetchDetail,
  };
};
