"use client";

import { useState, useCallback, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";
import CardGenerateService from "@/lib/services/card.generate";

export type CardStatus =
  | "ON_REQUEST"
  | "IN_OFFICE"
  | "IN_TRANSIT"
  | "IN_STATION"
  | "LOST"
  | "DAMAGED"
  | "SOLD_ACTIVE"
  | "SOLD_INACTIVE";

export interface AllCardItem {
  id: string;
  serialNumber: string;
  status: CardStatus;
  date: string;
  expiredDate: string | null;
  cardCategoryName: string;
  cardTypeName: string;
  stationName: string;
  previousStationName: string;
  note: string;
  isDiscount?: boolean;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface UseAllCardsProps {
  programType: "FWC" | "VOUCHER";
}

export const useAllCards = ({ programType }: UseAllCardsProps) => {
  const [data, setData] = useState<AllCardItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });

  // Filters
  const [status, setStatus] = useState<"all" | CardStatus>("all");
  const [statusOptions, setStatusOptions] = useState<CardStatus[]>([]);
  const [category, setCategory] = useState("");
  const [type, setType] = useState("");
  const [station, setStation] = useState("");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchAllCard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/cards", {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          status: status === "all" ? undefined : status,
          categoryName: category && category !== "all" ? category : undefined,
          typeName: type && type !== "all" ? type : undefined,
          stationName: station && station !== "all" ? station : undefined,
          search: search || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          programType,
        },
      });

      const { items, pagination: paging } = res.data.data;

      let products: any[] = [];
      if (programType === "VOUCHER") {
        products = await CardGenerateService.getProducts("VOUCHER");
      }

      const mapped: AllCardItem[] = items.map((item: any) => ({
        id: item.id,
        serialNumber: item.serialNumber,
        status: item.status,
        date: item.purchaseDate || item.createdAt,
        expiredDate: item.expiredDate || null,
        cardCategoryName: item.cardProduct?.category?.categoryName ?? "-",
        cardTypeName: item.cardProduct?.type?.typeName ?? "-",
        stationName: item.station?.stationName ?? "-",
        previousStationName: item.previousStation?.stationName ?? "-",
        note: item.notes ?? "-",
        isDiscount:
          programType === "VOUCHER"
            ? products.find((p: any) => p.id === item.cardProductId)?.isDiscount
            : undefined,
      }));

      setData(mapped);
      setPagination(paging);
    } catch (err: any) {
      toast.error(err.message || "Gagal mengambil data All Card");
    } finally {
      setLoading(false);
    }
  }, [
    pagination.page,
    pagination.limit,
    status,
    category,
    type,
    station,
    search,
    startDate,
    endDate,
    programType,
  ]);

  useEffect(() => {
    fetchAllCard();
  }, [fetchAllCard]);

  // Fetch status options for filter
  useEffect(() => {
    axiosInstance
      .get("/cards", { params: { page: 1, limit: 100000, programType } })
      .then((res) => {
        const items = res.data?.data?.items ?? [];
        const unique = Array.from(
          new Set(items.map((i: any) => i.status as CardStatus)),
        ) as CardStatus[];
        setStatusOptions(unique);
      })
      .catch(() => {});
  }, [programType]);

  const handleExportPDF = () => {
    toast("Export PDF (coming soon)");
  };

  return {
    data,
    loading,
    pagination,
    setPagination,
    statusOptions,
    filters: {
      status,
      setStatus,
      category,
      setCategory,
      type,
      setType,
      station,
      setStation,
      search,
      setSearch,
      startDate,
      setStartDate,
      endDate,
      setEndDate,
    },
    handleExportPDF,
    refresh: fetchAllCard,
  };
};
