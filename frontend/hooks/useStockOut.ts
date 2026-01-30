"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import stockService, {
  StockOutItem,
  StockPaginationMeta,
} from "@/lib/services/stock.service";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useAuthClient } from "./useAuthClient";
import { initPDFReport } from "@/lib/utils/pdf-export";

export type StockOutStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

interface UseStockOutProps {
  programType: "FWC" | "VOUCHER";
}

export const useStockOut = ({ programType }: UseStockOutProps) => {
  const auth = useAuthClient();
  const [data, setData] = useState<StockOutItem[]>([]);
  const [pagination, setPagination] = useState<StockPaginationMeta>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(false);

  // Filters
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [category, setCategory] = useState("all");
  const [type, setType] = useState("all");
  const [station, setStation] = useState("all");

  // Delete State
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetchStockOut = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (fromDate) {
        const start = new Date(fromDate);
        start.setHours(0, 0, 0, 0);
        params.startDate = start.toISOString();
      }

      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        params.endDate = end.toISOString();
      }

      const { items, pagination: paging } = await stockService.getStockOutList({
        ...params,
        programType,
        categoryName: category !== "all" ? category : undefined,
        typeName: type !== "all" ? type : undefined,
        stationName: station !== "all" ? station : undefined,
      });
      setData(items);
      setPagination(paging);
    } catch (error: any) {
      toast.error(error.message || "Gagal mengambil data stock out");
    } finally {
      setLoading(false);
    }
  }, [
    pagination.page,
    pagination.limit,
    fromDate,
    toDate,
    category,
    type,
    station,
    programType,
  ]);

  useEffect(() => {
    fetchStockOut();
  }, [fetchStockOut]);

  const filteredData = data; // Backend does the filtering now

  const handleDelete = async () => {
    if (!selectedId) return;

    try {
      await stockService.deleteStockOut(selectedId, programType);
      toast.success("Aksi berhasil dilakukan");
      setOpenDelete(false);
      setSelectedId(null);
      fetchStockOut();
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan");
    }
  };

  const handleExportPDF = async () => {
    try {
      const filtersArr = [];
      if (fromDate || toDate) {
        const start = fromDate
          ? fromDate.split("-").reverse().join("-")
          : "...";
        const end = toDate ? toDate.split("-").reverse().join("-") : "...";
        filtersArr.push(`Periode: ${start} s/d ${end}`);
      }
      if (category !== "all") filtersArr.push(`Kategori: ${category}`);
      if (type !== "all") filtersArr.push(`Tipe: ${type}`);
      if (station !== "all") filtersArr.push(`Stasiun: ${station}`);

      const { doc, startY } = await initPDFReport({
        title: `Laporan Stock Out ${programType} (Admin ke Stasiun)`,
        filters: filtersArr,
        userName: auth?.name || auth?.username || "Admin",
        programType,
      });

      const { items: allData } = await stockService.getStockOutList({
        page: 1,
        limit: 100000,
        programType,
        startDate: fromDate
          ? new Date(fromDate + "T00:00:00Z").toISOString()
          : undefined,
        endDate: toDate
          ? new Date(toDate + "T23:59:59Z").toISOString()
          : undefined,
        categoryName: category !== "all" ? category : undefined,
        typeName: type !== "all" ? type : undefined,
        stationName: station !== "all" ? station : undefined,
      });

      if (!allData || !Array.isArray(allData) || allData.length === 0) {
        toast.error("Tidak ada data untuk diexport");
        return;
      }

      autoTable(doc, {
        startY: startY,
        head: [
          [
            "No",
            "Tanggal",
            "Card Category",
            "Card Type",
            "Batch",
            "Stasiun",
            "Nota Dinas",
            "BAST",
            "Qty",
            "Serial Number",
            "Status",
          ],
        ],
        body: allData.map((item: any, index: number) => [
          index + 1,
          new Date(item.movementAt)
            .toLocaleDateString("id-ID")
            .replace(/\//g, "-"),
          item.cardCategory?.name ?? "-",
          item.cardType?.name ?? "-",
          item.batchId ?? "-",
          item.stationName ?? "-",
          item.notaDinas ?? "-",
          item.bast ?? "-",
          item.quantity ?? 0,
          item.sentSerialNumbers?.length > 0
            ? `${item.sentSerialNumbers[0]} - ${item.sentSerialNumbers[item.sentSerialNumbers.length - 1]}`
            : "-",
          item.status ?? "-",
        ]),
        styles: {
          font: "helvetica",
          fontSize: 7,
          cellPadding: 2,
          halign: "center",
        },
        headStyles: {
          fillColor: [141, 18, 49],
          textColor: 255,
          fontStyle: "bold",
          halign: "center",
        },
        columnStyles: {
          0: { cellWidth: 8 },
          9: { cellWidth: 35 },
        },
      });

      doc.save(`laporan-stock-out-${programType.toLowerCase()}.pdf`);
    } catch (err: any) {
      console.error("PDF Export Error (Stock Out):", err);
      toast.error(err.message || "Gagal export PDF");
    }
  };

  return {
    data: filteredData,
    pagination,
    setPagination,
    loading,
    filters: {
      fromDate,
      setFromDate,
      toDate,
      setToDate,
      category,
      setCategory,
      type,
      setType,
      station,
      setStation,
    },
    deleteModal: {
      openDelete,
      setOpenDelete,
      selectedId,
      setSelectedId,
      handleDelete,
    },
    handleExportPDF,
    refresh: fetchStockOut,
  };
};
