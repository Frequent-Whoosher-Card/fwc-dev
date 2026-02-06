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
import { initPDFReport } from "@/lib/utils/pdf-export";

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
  const [category, setCategory] = useState<string[]>([]);
  const [type, setType] = useState<string[]>([]);

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
        categoryName: category.length > 0 ? category.join(",") : undefined,
        typeName: type.length > 0 ? type.join(",") : undefined,
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
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus stock");
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
      if (category.length > 0)
        filtersArr.push(`Kategori: ${category.join(", ")}`);
      if (type.length > 0) filtersArr.push(`Tipe: ${type.join(", ")}`);

      const { doc, startY } = await initPDFReport({
        title: `Laporan Stock In ${programType} (Vendor ke Office)`,
        filters: filtersArr,
        userName: auth?.name || auth?.username || "Admin",
        programType,
      });

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
        categoryName: category.length > 0 ? category.join(",") : undefined,
        typeName: type.length > 0 ? type.join(",") : undefined,
      });

      if (!allData || !Array.isArray(allData) || allData.length === 0) {
        toast.error("Tidak ada data untuk diexport");
        return;
      }

      autoTable(doc, {
        startY: startY,
        margin: { left: 15, right: 15 },
        head: [
          [
            "No",
            "Tanggal",
            "Category",
            "Type",
            "Stock Masuk",
            "Serial Number",
            "Vendor",
            "VCR Settle",
            "Costs",
          ],
        ],
        body: allData.map((item: any, index: number) => {
          let serialDisplay = "-";
          if (
            item.sentSerialNumbers &&
            Array.isArray(item.sentSerialNumbers) &&
            item.sentSerialNumbers.length > 0
          ) {
            const first = item.sentSerialNumbers[0];
            const last =
              item.sentSerialNumbers[item.sentSerialNumbers.length - 1];
            serialDisplay = first === last ? first : `${first} - ${last}`;
          }

          return [
            index + 1,
            new Date(item.tanggal)
              .toLocaleDateString("id-ID")
              .replace(/\//g, "-"),
            item.category ?? "-",
            item.type ?? "-",
            item.stock?.toLocaleString() ?? "0",
            serialDisplay,
            item.vendorName ?? "-",
            item.vcrSettle ?? "-",
            item.costs
              ? `Rp ${Number(item.costs).toLocaleString("id-ID")}`
              : "-",
          ];
        }),
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
          0: { cellWidth: 12 },
        },
      });

      doc.save(`laporan-stock-in-${programType.toLowerCase()}.pdf`);
    } catch (err: any) {
      console.error("PDF Export Error (Stock In):", err);
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
