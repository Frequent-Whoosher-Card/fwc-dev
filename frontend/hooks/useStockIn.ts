"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import stockService, {
  StockInItem,
  StockPaginationMeta,
} from "@/lib/services/stock.service";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface UseStockInProps {
  programType: "FWC" | "VOUCHER";
}

export const useStockIn = ({ programType }: UseStockInProps) => {
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
      });

      // Frontend Filtering for FWC Mix Issue (No Backend Mod Constraint)
      // Because FWC endpoint returns mixed data, we filter by category's programType.
      // We need to fetch categories to check which ID belongs to which program.
      // Optimization: Fetch categories once or use cached logic ?
      // For now, fetch to ensure correctness.
      if (programType === "FWC") {
        const categories = await stockService.getCategories();
        const validCategoryIds = new Set(
          categories
            .filter((c: any) => c.programType === "FWC")
            .map((c: any) => c.id),
        );

        const filteredItems = items.filter((item) =>
          validCategoryIds.has(item.categoryId),
        );
        setData(filteredItems);
      } else {
        setData(items);
      }
      setPagination(paging);
    } catch (err: any) {
      toast.error(err?.message || "Gagal mengambil data stock-in");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, fromDate, toDate, programType]);

  useEffect(() => {
    fetchStockIn();
  }, [fetchStockIn]);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const categoryMatch = category === "all" || item.category === category;
      const typeMatch = type === "all" || item.type === type;
      return categoryMatch && typeMatch;
    });
  }, [data, category, type]);

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
      const { items: allData } = await stockService.getStockInList({
        page: 1,
        limit: 100000,
        programType,
      });

      if (allData.length === 0) {
        toast.error("Tidak ada data untuk diexport");
        return;
      }

      const doc = new jsPDF("p", "mm", "a4");
      const title = `Laporan Stock In ${programType} (Vendor ke Office)`;
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(title, pageWidth / 2, 18, { align: "center" });
      doc.line(14, 22, pageWidth - 14, 22);

      autoTable(doc, {
        startY: 26,
        head: [["No", "Tanggal", "Category", "Type", "Stock Masuk"]],
        body: allData.map((item: any, index: number) => [
          index + 1,
          new Date(item.movementAt)
            .toLocaleDateString("id-ID")
            .replace(/\//g, "-"),
          item.cardCategory?.name ?? "-",
          item.cardType?.name ?? "-",
          item.quantity.toLocaleString(),
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
