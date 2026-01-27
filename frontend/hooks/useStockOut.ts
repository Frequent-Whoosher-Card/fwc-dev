"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import stockService, {
  StockOutItem,
  StockPaginationMeta,
} from "@/lib/services/stock.service";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export type StockOutStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

interface UseStockOutProps {
  programType: "FWC" | "VOUCHER";
}

export const useStockOut = ({ programType }: UseStockOutProps) => {
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
      });
      setData(items);
      setPagination(paging);
    } catch (error: any) {
      toast.error(error.message || "Gagal mengambil data stock out");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, fromDate, toDate, programType]);

  useEffect(() => {
    fetchStockOut();
  }, [fetchStockOut]);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const categoryMatch =
        category === "all" || item.cardCategory.name === category;
      const typeMatch = type === "all" || item.cardType.name === type;
      const stationMatch = station === "all" || item.stationName === station;

      return categoryMatch && typeMatch && stationMatch;
    });
  }, [data, category, type, station]);

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
      const { items: allData } = await stockService.getStockOutList({
        page: 1,
        limit: 100000,
        programType,
      });

      if (allData.length === 0) {
        toast.error("Tidak ada data untuk diexport");
        return;
      }

      const doc = new jsPDF("p", "mm", "a4");
      const title = `Laporan Stock Out ${programType} (Admin ke Stasiun)`;
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(title, pageWidth / 2, 18, { align: "center" });
      doc.line(14, 22, pageWidth - 14, 22);

      autoTable(doc, {
        startY: 26,
        head: [
          [
            "No",
            "Tanggal",
            "Card Category",
            "Card Type",
            "Batch",
            "Nota Dinas",
            "BAST",
            "Stasiun",
            "Serial Number",
            "Status",
            "Note",
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
          item.notaDinas ?? "-",
          item.bast ?? "-",
          item.stationName ?? "-",
          item.sentSerialNumbers?.length > 0
            ? `${item.sentSerialNumbers[0]} - ${item.sentSerialNumbers[item.sentSerialNumbers.length - 1]}`
            : "-",
          item.status ?? "-",
          item.note ?? "-",
        ]),
        styles: {
          font: "helvetica",
          fontSize: 9,
          cellPadding: 3,
          halign: "center",
        },
        headStyles: {
          fillColor: [141, 18, 49],
          textColor: 255,
          fontStyle: "bold",
          halign: "center",
        },
        columnStyles: { 0: { cellWidth: 10 }, 10: { halign: "left" } },
      });

      doc.save(`laporan-stock-out-${programType.toLowerCase()}.pdf`);
    } catch (err) {
      toast.error("Gagal export PDF");
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
