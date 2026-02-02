"use client";

import { useState, useCallback, useEffect } from "react";
import stockService from "@/lib/services/stock.service";
import toast from "react-hot-toast";

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface UseTransferIncomingProps {
  programType: "FWC" | "VOUCHER";
  stationId?: string;
}

export const useTransferIncoming = ({
  programType,
  stationId,
}: UseTransferIncomingProps) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });

  const [status, setStatus] = useState<string>("PENDING");
  const [search, setSearch] = useState("");

  const fetchTransfers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await stockService.getTransfers({
        page: pagination.page,
        limit: pagination.limit,
        status: status === "all" ? undefined : status,
        programType,
        stationId, // This targets the 'toStationId' or 'stationId' in backend depending on logic
        search: search || undefined,
      });

      setData(result.items);
      setPagination(result.pagination);
    } catch (error: any) {
      toast.error(error.message || "Gagal mengambil data transfer");
    } finally {
      setLoading(false);
    }
  }, [
    pagination.page,
    pagination.limit,
    status,
    programType,
    stationId,
    search,
  ]);

  useEffect(() => {
    fetchTransfers();
  }, [fetchTransfers]);

  return {
    data,
    loading,
    pagination,
    setPagination,
    filters: {
      status,
      setStatus,
      search,
      setSearch,
    },
    refresh: fetchTransfers,
  };
};
