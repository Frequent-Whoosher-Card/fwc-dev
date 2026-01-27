"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import stockService, {
  StockInItem,
  StockPaginationMeta,
} from "@/lib/services/stock.service";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useAuthClient } from "./useAuthClient";

interface UseStockInProps {
  programType: "FWC" | "VOUCHER";
}

export const useStockIn = ({ programType }: UseStockInProps) => {
  const auth = useAuthClient();
  const [data, setData] = useState<StockInItem[]>([]);
  const [pagination, setPagination] = useState<StockPaginationMeta>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(false);

  // filters
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [category, setCategory] = useState("all");
  const [type, setType] = useState("all");

  // delete
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedSerial, setSelectedSerial] = useState<string>("");

  const fetchStockIn = useCallback(async () => {
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

      const { items, pagination: paging } = await stockService.getStockInList({
        ...params,
        programType,
        categoryName: category !== "all" ? category : undefined,
        typeName: type !== "all" ? type : undefined,
      });

      setData(items);
      setPagination(paging);
    } catch (err: any) {
      toast.error(err?.message || "Gagal mengambil data stock-in");
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
    programType,
  ]);

  useEffect(() => {
    fetchStockIn();
  }, [fetchStockIn]);

  const filteredData = data; // Backend does the filtering now

  const handleDelete = async () => {
    if (!selectedId) return;

    try {
      await stockService.deleteStockIn(selectedId, programType);
      toast.success("Stock berhasil dihapus");
      setOpenDelete(false);
      setSelectedId(null);
      fetchStockIn();
    } catch {
      toast.error("Gagal menghapus stock");
    }
  };

  const handleExportPDF = async () => {
    try {
      const doc = new jsPDF("p", "mm", "a4");
      const title = `Laporan Stock In ${programType} (Vendor ke Office)`;
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(title, pageWidth / 2, 15, { align: "center" });

      // Filter Info
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      let filterY = 22;
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

      if (filtersArr.length > 0) {
        doc.text(`Filter: ${filtersArr.join(" | ")}`, 14, filterY);
        filterY += 6;
      }

      // User & Time Info
      doc.setFontSize(9);
      doc.setTextColor(100);
      const exportTime = new Date().toLocaleString("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
      });
      doc.text(
        `Export oleh: ${auth?.name || auth?.username || "Admin"} | Waktu: ${exportTime}`,
        14,
        filterY,
      );
      filterY += 4;
      doc.setTextColor(0);

      doc.line(14, filterY, pageWidth - 14, filterY);

      const { items: allData } = await stockService.getStockInList({
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
      });

      if (allData.length === 0) {
        toast.error("Tidak ada data untuk diexport");
        return;
      }

      autoTable(doc, {
        startY: filterY + 4,
        head: [["No", "Tanggal", "Category", "Type", "Stock Masuk"]],
        body: allData.map((item: any, index: number) => [
          index + 1,
          new Date(item.tanggal)
            .toLocaleDateString("id-ID")
            .replace(/\//g, "-"),
          item.category ?? "-",
          item.type ?? "-",
          item.stock.toLocaleString(),
        ]),
        styles: {
          font: "helvetica",
          fontSize: 10,
          cellPadding: 3,
          halign: "center",
        },
        headStyles: {
          fillColor: [141, 18, 49],
          textColor: 255,
          fontStyle: "bold",
          halign: "center",
        },
        columnStyles: {
          0: { cellWidth: 10 },
        },
      });

      doc.save(`laporan-stock-in-${programType.toLowerCase()}.pdf`);
    } catch (err) {
      toast.error("Gagal export PDF");
      console.error(err);
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
    },
    deleteModal: {
      openDelete,
      setOpenDelete,
      selectedId,
      setSelectedId,
      selectedSerial,
      setSelectedSerial,
      handleDelete,
    },
    handleExportPDF,
    refresh: fetchStockIn,
  };
};
