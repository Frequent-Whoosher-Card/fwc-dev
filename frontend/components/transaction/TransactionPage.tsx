"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getPurchases } from "@/lib/services/purchase.service";
import TransactionToolbar from "./components/TransactionToolbar";
import TransactionFilter from "./components/TransactionFilter";
import TransactionTableFWC from "./components/TransactionTableFWC";
import TransactionTableVoucher from "./components/TransactionTableVoucher";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import html2canvas from "html2canvas";

/* ======================
   TYPES
====================== */
interface FWCPurchase {
  id: string;
  purchaseDate: string;
  shiftDate?: string | null;
  price: number;
  edcReferenceNumber: string;
  card: any;
  member: any;
  operator: any;
  station: any;
}

interface Pagination {
  page: number;
  limit: number;
  totalPages: number;
  total: number;
}

type TabType = "fwc" | "voucher" | "";

interface TransactionPageProps {
  role: "superadmin" | "admin" | "supervisor" | "petugas";
}

/* ======================
   HELPERS
====================== */
const formatDateID = (date?: string) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("id-ID");
};

export default function TransactionPage({ role }: TransactionPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const basePath = `/dashboard/${role}`;
  const transactionPath = role === "admin" ? "transaction" : "transaksi";

  /* =====================
     TAB STATE
  ===================== */
  const [activeTab, setActiveTab] = useState<TabType>("");

  /* =====================
     FILTER STATE
  ===================== */
  const [search, setSearch] = useState("");
  const [stationId, setStationId] = useState<string | undefined>();
  const [purchasedDate, setPurchasedDate] = useState<string | undefined>();
  const [shiftDate, setShiftDate] = useState<string | undefined>();
  const [cardCategoryId, setCardCategoryId] = useState<string | undefined>();
  const [cardTypeId, setCardTypeId] = useState<string | undefined>();
  const [employeeTypeId, setEmployeeTypeId] = useState<string | undefined>();

  /* =====================
     DATA STATE (DIPISAH!)
  ===================== */
  const [fwcData, setFWCData] = useState<FWCPurchase[]>([]);
  const [voucherData, setVoucherData] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    totalPages: 1,
    total: 0,
  });

  /* =====================
     EXPORT MODAL STATE
  ===================== */
  const [showExportModal, setShowExportModal] = useState(false);
  const [keteranganGangguan, setKeteranganGangguan] = useState("");
  const [exportFormat, setExportFormat] = useState<"pdf" | "excel" | "csv" | "image">("pdf");
  const [exportItems, setExportItems] = useState<any[]>([]);

  /* =====================
     RESET FILTER
  ===================== */
  const resetFilter = () => {
    setStationId(undefined);
    setPurchasedDate(undefined);
    setShiftDate(undefined);
    setCardCategoryId(undefined);
    setCardTypeId(undefined);
    setEmployeeTypeId(undefined);
    setPagination((p) => ({ ...p, page: 1 }));
  };

  /* =====================
     FETCH DATA (CORE)
  ===================== */
  const fetchData = async () => {
    if (!activeTab) return;

    setLoading(true);

    const params = {
      page: pagination.page,
      limit: pagination.limit,
      search,
      stationId,
      startDate: purchasedDate,
      endDate: shiftDate,
      categoryId: cardCategoryId,
      typeId: cardTypeId,
      employeeTypeId,
    };

    try {
      if (activeTab === "fwc") {
        const res = await getPurchases({
          ...params,
          transactionType: "fwc",
        });
        if (res.success && res.data) {
          setFWCData(res.data.items);
          setPagination(res.data.pagination);
        }
      }

      if (activeTab === "voucher") {
        const res = await getPurchases({
          ...params,
          transactionType: "voucher",
        });
        if (res.success && res.data) {
          setVoucherData(res.data.items);
          setPagination(res.data.pagination);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  /* =====================
     RESET CATEGORY & TYPE WHEN TAB CHANGES (FWC vs Voucher punya list beda)
  ===================== */
  useEffect(() => {
    setCardCategoryId(undefined);
    setCardTypeId(undefined);
  }, [activeTab]);

  /* =====================
     EFFECT
  ===================== */
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeTab,
    search,
    stationId,
    purchasedDate,
    shiftDate,
    cardCategoryId,
    cardTypeId,
    employeeTypeId,
    pagination.page,
    searchParams.get("refresh"),
  ]);

  /* =====================
     HANDLERS
  ===================== */
  const handleAddPurchased = () => {
    if (activeTab === "voucher") {
      router.push(`${basePath}/${transactionPath}/voucher/create`);
    } else {
      router.push(`${basePath}/${transactionPath}/create`);
    }
  };

  const handleAddMember = () => {
    const programType = activeTab === "voucher" ? "voucher" : "fwc";
    router.push(`${basePath}/membership/create?programType=${programType}`);
  };

  const handleExportPDF = async () => {
    if (activeTab === "voucher") {
      alert("Export voucher belum tersedia");
      return;
    }

    const res = await getPurchases({
      search,
      stationId,
      startDate: purchasedDate,
      endDate: shiftDate,
      categoryId: cardCategoryId,
      typeId: cardTypeId,
      limit: 1000,
    });

    if (!res.success || !res.data?.items?.length) {
      alert("Data kosong");
      return;
    }

    const items = res.data.items;

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Laporan Transaksi", pageWidth / 2, margin, { align: "center" });

    const tableData = items.map((item: any, idx: number) => [
      idx + 1,
      item.member?.name || "-",
      item.member?.identityNumber ? `FWC${item.member.identityNumber}` : "-",
      item.card.cardProduct.category.categoryName,
      item.card.cardProduct.type.typeName,
      item.card.serialNumber,
      item.edcReferenceNumber ? `EDC${item.edcReferenceNumber}` : "-",
      `Rp ${Number(item.price).toLocaleString("id-ID")}`,
      formatDateID(item.purchaseDate),
      formatDateID(item.shiftDate ?? item.purchaseDate),
      item.operator.fullName,
      item.station.stationName,
    ]);

    autoTable(doc, {
      head: [
        [
          "No",
          "Customer Name",
          "Identity Number",
          "Card Category",
          "Card Type",
          "Serial Number",
          "Reference EDC",
          "FWC Price",
          "Purchase Date",
          "Shift Date",
          "Operator Name",
          "Station",
        ],
      ],
      body: tableData,
      startY: margin + 8,
      styles: {
        fontSize: 7,
        cellPadding: 2,
        lineWidth: 0.2,
        lineColor: [200, 200, 200],
      },
      headStyles: {
        fillColor: [141, 18, 49],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: "bold",
        halign: "center",
      },
      theme: "grid",
    });

    const today = new Date();
    const dateStr = today.toISOString().split("T")[0].replace(/-/g, "");
    doc.save(`Transaction_Report_FWC_${dateStr}.pdf`);
  };

  const handleExportShiftPDF = async () => {
    if (activeTab === "voucher") {
      alert("Export voucher belum tersedia");
      return;
    }

    // Fetch data first
    const token = localStorage.getItem("fwc_token");
    if (!token) {
      alert("Session expired. Silakan login kembali.");
      return;
    }

    const res = await getPurchases({
      search,
      stationId,
      startDate: purchasedDate,
      endDate: shiftDate,
      categoryId: cardCategoryId,
      typeId: cardTypeId,
      limit: 1000,
    });

    const items = res.success && res.data?.items ? res.data.items : [];
    
    if (!items || items.length === 0) {
      alert("Tidak ada data untuk diekspor");
      return;
    }

    // Store items for export
    setExportItems(items);

    // Show modal
    setShowExportModal(true);
  };

  const generateShiftPDF = async () => {
    // Close modal
    setShowExportModal(false);

    // Get token
    const token = localStorage.getItem("fwc_token");
    if (!token) {
      alert("Session expired. Silakan login kembali.");
      return;
    }

    // Fetch all card products to get all category-type combinations
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const productsRes = await fetch(`${API_URL}/card/product`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!productsRes.ok) {
      alert("Gagal mengambil data card products");
      return;
    }
    const productsData = await productsRes.json();
    const allProducts = productsData.data || [];

    // Initialize combinations from FWC products only
    const fwcCombinations: any = {};

    allProducts.forEach((product: any) => {
      const programType = product.programType || "FWC";
      
      // Only include FWC products (including null as FWC)
      if (programType !== "FWC") return;
      
      const category = product.category?.categoryName || "-";
      const type = product.type?.typeName || "-";
      const key = `${category}|${type}`;

      if (!fwcCombinations[key]) {
        fwcCombinations[key] = {
          category,
          type,
          serialStart: "-",
          serialEnd: "-",
          count: 0,
          nominal: 0,
        };
      }
    });

    const res = await getPurchases({
      search,
      stationId,
      startDate: purchasedDate,
      endDate: shiftDate,
      categoryId: cardCategoryId,
      typeId: cardTypeId,
      limit: 1000,
    });

    const items = res.success && res.data?.items ? res.data.items : [];

    // Merge transaction data into combinations (FWC only)
    items.forEach((item: any) => {
      const programType = item.card?.cardProduct?.programType || "FWC";
      
      // Only process FWC transactions
      if (programType !== "FWC") return;
      
      const category = item.card?.cardProduct?.category?.categoryName || "-";
      const type = item.card?.cardProduct?.type?.typeName || "-";
      const nominal = item.price || 0;
      const key = `${category}|${type}`;

      if (!fwcCombinations[key]) {
        fwcCombinations[key] = {
          category,
          type,
          serialStart: "-",
          serialEnd: "-",
          count: 0,
          nominal: 0,
        };
      }

      const combo = fwcCombinations[key];
      
      if (combo.count === 0) {
        combo.serialStart = item.card?.serialNumber || "-";
      }

      combo.count += 1;
      combo.nominal += nominal;
      combo.serialEnd = item.card?.serialNumber || "-";
    });

    // Convert to table data with row numbers
    const fwcTableData: any[] = Object.values(fwcCombinations).map(
      (combo: any, index: number) => [
        index + 1,
        combo.category,
        combo.type,
        combo.serialStart,
        combo.serialEnd,
        combo.count,
        combo.count > 0
          ? `Rp ${combo.nominal.toLocaleString("id-ID")}`
          : "Rp 0",
      ],
    );

    // Calculate totals
    const fwcTotalCount = (Object.values(fwcCombinations) as any[]).reduce(
      (sum: number, combo: any) => sum + (combo.count || 0),
      0,
    ) as number;
    const fwcTotalNominal = (Object.values(fwcCombinations) as any[]).reduce(
      (sum: number, combo: any) => sum + (combo.nominal || 0),
      0,
    ) as number;

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("LAPORAN TRANSAKSI HARIAN", pageWidth / 2, margin, {
      align: "center",
    });

    // Get info from first item
    const operatorName = items[0]?.operator?.fullName || "-";
    const purchaseDateStr = items[0]?.purchaseDate 
      ? formatDateID(items[0].purchaseDate) 
      : purchasedDate 
        ? formatDateID(purchasedDate) 
        : "-";
    const shiftDateStr = items[0]?.shiftDate 
      ? formatDateID(items[0].shiftDate) 
      : shiftDate 
        ? formatDateID(shiftDate) 
        : "-";

    // Info box
    const boxY = margin + 6;
    const boxHeight = 10;
    
    // Draw box
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(margin, boxY, pageWidth - (margin * 2), boxHeight, 1, 1, "FD");
    
    // Info content
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    
    const col1X = margin + 3;
    const col2X = margin + 70;
    const col3X = margin + 140;
    let textY = boxY + 6.5;
    
    // Row 1
    doc.setFont("helvetica", "bold");
    doc.text("Petugas:", col1X, textY);
    doc.setFont("helvetica", "normal");
    doc.text(operatorName, col1X + 20, textY);
    
    doc.setFont("helvetica", "bold");
    doc.text("Tanggal:", col2X, textY);
    doc.setFont("helvetica", "normal");
    doc.text(purchaseDateStr, col2X + 20, textY);
    
    doc.setFont("helvetica", "bold");
    doc.text("Shift:", col3X, textY);
    doc.setFont("helvetica", "normal");
    doc.text(shiftDateStr, col3X + 15, textY);

    let currentY = boxY + boxHeight + 3;

    // FWC Table
    autoTable(doc, {
        head: [
          [
            "No",
            "Kategori",
            "Type",
            "Serial Start",
            "Serial End",
            "Jumlah",
            "Nominal",
          ],
        ],
        body: fwcTableData,
        foot: [
          [
            {
              content: "Total FWC",
              colSpan: 5,
              styles: { fontStyle: "bold", halign: "center" },
            },
            {
              content: fwcTotalCount.toString(),
              styles: { fontStyle: "bold", halign: "center" },
            },
            {
              content: `Rp ${new Intl.NumberFormat("id-ID").format(fwcTotalNominal)}`,
              styles: { fontStyle: "bold", halign: "center" },
            },
          ],
        ],
        startY: currentY,
        styles: {
          fontSize: 7,
          cellPadding: 2,
          lineWidth: 0.2,
          lineColor: [200, 200, 200],
        },
        headStyles: {
          fillColor: [141, 18, 49],
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: "bold",
          halign: "center",
        },
        footStyles: {
          fillColor: [240, 240, 240],
          textColor: [0, 0, 0],
          fontSize: 8,
          lineWidth: 0.2,
          lineColor: [200, 200, 200],
        },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 25 },
          2: { cellWidth: 25 },
          3: { cellWidth: 28 },
          4: { cellWidth: 28 },
          5: { cellWidth: 22 },
          6: { cellWidth: "auto" },
        },
        theme: "grid",
      });

    let finalY = (doc as any).lastAutoTable.finalY + 10;

    // Keterangan Gangguan Section
    if (keteranganGangguan) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("Keterangan Kejadian Gangguan:", margin, finalY);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      const lines = doc.splitTextToSize(keteranganGangguan, pageWidth - (margin * 2));
      doc.text(lines, margin, finalY + 5);
      
      finalY += 5 + (lines.length * 4) + 5;
    }

    // Signature section
    doc.setFontSize(9);

    const signCol1X = margin;
    const signCol2X = pageWidth - margin - 50;
    const signBoxWidth = 50;

    doc.text("PSAC", signCol1X + signBoxWidth / 2, finalY, { align: "center" });
    doc.text("SPV", signCol2X + signBoxWidth / 2, finalY, { align: "center" });

    doc.line(signCol1X, finalY + 30, signCol1X + signBoxWidth, finalY + 30);
    doc.line(signCol2X, finalY + 30, signCol2X + signBoxWidth, finalY + 30);

    doc.text(operatorName, signCol1X + signBoxWidth / 2, finalY + 35, { align: "center" });

    const today = new Date();
    const dateStr = today.toISOString().split("T")[0].replace(/-/g, "");
    doc.save(`Shift_Report_FWC_${dateStr}.pdf`);
    setKeteranganGangguan("");
  };

  /* =====================
     EXCEL EXPORT FUNCTION
  ===================== */
  const generateExcelReport = async (items: any[]) => {
    if (!items || items.length === 0) {
      alert("Tidak ada data untuk diekspor");
      return;
    }

    // Fetch all card products
    const token = localStorage.getItem("fwc_token");
    if (!token) {
      alert("Session expired. Silakan login kembali.");
      return;
    }

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const productsRes = await fetch(`${API_URL}/card/product`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    if (!productsRes.ok) {
      alert("Gagal mengambil data card products");
      return;
    }
    
    const productsData = await productsRes.json();
    const allProducts = productsData.data || [];

    // Initialize from FWC products only
    const fwcCombinations: any = {};

    allProducts.forEach((product: any) => {
      const programType = product.programType || "FWC";
      
      // Only include FWC products
      if (programType !== "FWC") return;

      const category = product.category?.categoryName || "Unknown";
      const type = product.type?.typeName || "Unknown";
      const key = `${category}-${type}`;

      if (!fwcCombinations[key]) {
        fwcCombinations[key] = {
          category,
          type,
          serialStart: "-",
          serialEnd: "-",
          count: 0,
          nominal: 0,
        };
      }
    });

    // Merge with actual transaction data (FWC only)
    items.forEach((item: any) => {
      if (!item.card?.cardProduct) return;

      const programType = item.card.cardProduct.programType || "FWC";
      
      // Only process FWC
      if (programType !== "FWC") return;

      const category = item.card.cardProduct.category?.categoryName || "Unknown";
      const type = item.card.cardProduct.type?.typeName || "Unknown";
      const key = `${category}-${type}`;
      const nominal = item.price || 0;

      if (fwcCombinations[key]) {
        const combo = fwcCombinations[key];
        if (combo.count === 0) {
          combo.serialStart = item.card.serialNumber;
          combo.serialEnd = item.card.serialNumber;
        } else {
          if (item.card.serialNumber < combo.serialStart) combo.serialStart = item.card.serialNumber;
          if (item.card.serialNumber > combo.serialEnd) combo.serialEnd = item.card.serialNumber;
        }
        combo.count += 1;
        combo.nominal += nominal;
      }
    });

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "FWC System";
    workbook.created = new Date();

    // Get info
    const operatorName = items[0]?.operator?.fullName || "-";
    const purchaseDateStr = items[0]?.purchaseDate 
      ? formatDateID(items[0].purchaseDate) 
      : purchasedDate 
        ? formatDateID(purchasedDate) 
        : "-";
    const shiftDateStr = items[0]?.shiftDate 
      ? formatDateID(items[0].shiftDate) 
      : shiftDate 
        ? formatDateID(shiftDate) 
        : "-";

    // Create worksheet
    const worksheet = workbook.addWorksheet("Laporan Transaksi");

    // Title
    worksheet.mergeCells("A1:G1");
    const titleCell = worksheet.getCell("A1");
    titleCell.value = "LAPORAN TRANSAKSI HARIAN";
    titleCell.font = { bold: true, size: 14 };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getRow(1).height = 25;

    // Info header
    worksheet.mergeCells("A2:G2");
    const infoCell = worksheet.getCell("A2");
    infoCell.value = `Petugas: ${operatorName}  |  Tanggal: ${purchaseDateStr}  |  Shift: ${shiftDateStr}`;
    infoCell.font = { size: 11 };
    infoCell.alignment = { horizontal: "center", vertical: "middle" };
    infoCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF5F5F5" },
    };
    worksheet.getRow(2).height = 20;

    let currentRow = 4;

    // FWC Table
    const fwcTableData = Object.values(fwcCombinations);
    
    // FWC Header
    const fwcHeaderRow = worksheet.getRow(currentRow);
      fwcHeaderRow.values = ["No", "Kategori", "Type", "Serial Start", "Serial End", "Jumlah", "Nominal"];
      fwcHeaderRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
      fwcHeaderRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF8D1231" },
      };
      fwcHeaderRow.alignment = { horizontal: "center", vertical: "middle" };
      fwcHeaderRow.height = 20;
      currentRow++;

      // FWC Data
      fwcTableData.forEach((combo: any, index: number) => {
        const dataRow = worksheet.getRow(currentRow);
        dataRow.values = [
          index + 1,
          combo.category,
          combo.type,
          combo.serialStart,
          combo.serialEnd,
          combo.count,
          combo.nominal,
        ];
        dataRow.alignment = { horizontal: "center", vertical: "middle" };
        currentRow++;
      });

      // FWC Total
      const fwcTotalCount = fwcTableData.reduce((sum: number, combo: any) => sum + combo.count, 0) as number;
      const fwcTotalNominal = fwcTableData.reduce((sum: number, combo: any) => sum + combo.nominal, 0) as number;
      
      const fwcTotalRow = worksheet.getRow(currentRow);
      worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
      fwcTotalRow.getCell(1).value = "Total FWC";
      fwcTotalRow.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
      fwcTotalRow.getCell(6).value = fwcTotalCount;
      fwcTotalRow.getCell(7).value = fwcTotalNominal;
      fwcTotalRow.font = { bold: true };
      fwcTotalRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF0F0F0" },
      };
      fwcTotalRow.alignment = { horizontal: "center", vertical: "middle" };
      currentRow += 2;

    // Keterangan Gangguan
    if (keteranganGangguan) {
      currentRow++;
      const keteranganLabelRow = worksheet.getRow(currentRow);
      keteranganLabelRow.getCell(1).value = "Keterangan Kejadian Gangguan:";
      keteranganLabelRow.getCell(1).font = { bold: true, size: 11 };
      currentRow++;

      worksheet.mergeCells(`A${currentRow}:G${currentRow + 2}`);
      const keteranganCell = worksheet.getCell(`A${currentRow}`);
      keteranganCell.value = keteranganGangguan;
      keteranganCell.alignment = { horizontal: "left", vertical: "top", wrapText: true };
      worksheet.getRow(currentRow).height = 50;
      currentRow += 3;
    }

    // Signatures
    currentRow += 2;
    const signRow = worksheet.getRow(currentRow);
    signRow.getCell(2).value = "PSAC";
    signRow.getCell(2).alignment = { horizontal: "center" };
    signRow.getCell(6).value = "SPV";
    signRow.getCell(6).alignment = { horizontal: "center" };

    // Set column widths
    worksheet.getColumn(1).width = 8;
    worksheet.getColumn(2).width = 20;
    worksheet.getColumn(3).width = 20;
    worksheet.getColumn(4).width = 20;
    worksheet.getColumn(5).width = 20;
    worksheet.getColumn(6).width = 12;
    worksheet.getColumn(7).width = 18;

    // Generate file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { 
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0].replace(/-/g, "");
    link.download = `Shift_Report_FWC_${dateStr}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
    setKeteranganGangguan("");
  };

  /* =====================
     CSV EXPORT FUNCTION
  ===================== */
  const generateCSVReport = async (items: any[]) => {
    if (!items || items.length === 0) {
      alert("Tidak ada data untuk diekspor");
      return;
    }

    // Fetch all card products
    const token = localStorage.getItem("fwc_token");
    if (!token) {
      alert("Session expired. Silakan login kembali.");
      return;
    }

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const productsRes = await fetch(`${API_URL}/card/product`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    if (!productsRes.ok) {
      alert("Gagal mengambil data card products");
      return;
    }
    
    const productsData = await productsRes.json();
    const allProducts = productsData.data || [];

    // Initialize all combinations
    const fwcCombinations: any = {};
    const voucherCombinations: any = {};

    allProducts.forEach((product: any) => {
      const programType = product.programType || "FWC";
      const category = product.category?.categoryName || "Unknown";
      const type = product.type?.typeName || "Unknown";
      const key = `${category}-${type}`;

      if (programType === "FWC" || programType === null) {
        if (!fwcCombinations[key]) {
          fwcCombinations[key] = {
            category,
            type,
            serialStart: "-",
            serialEnd: "-",
            count: 0,
            nominal: 0,
          };
        }
      } else if (programType === "VOUCHER") {
        if (!voucherCombinations[key]) {
          voucherCombinations[key] = {
            category,
            type,
            serialStart: "-",
            serialEnd: "-",
            count: 0,
            nominal: 0,
          };
        }
      }
    });

    // Merge with actual transaction data
    items.forEach((item: any) => {
      if (!item.card?.cardProduct) return;

      const programType = item.card.cardProduct.programType || "FWC";
      const category = item.card.cardProduct.category?.categoryName || "Unknown";
      const type = item.card.cardProduct.type?.typeName || "Unknown";
      const key = `${category}-${type}`;
      const nominal = item.price || 0;

      const targetCombinations = (programType === "FWC" || programType === null) ? fwcCombinations : voucherCombinations;

      if (targetCombinations[key]) {
        const combo = targetCombinations[key];
        if (combo.count === 0) {
          combo.serialStart = item.card.serialNumber;
          combo.serialEnd = item.card.serialNumber;
        } else {
          if (item.card.serialNumber < combo.serialStart) combo.serialStart = item.card.serialNumber;
          if (item.card.serialNumber > combo.serialEnd) combo.serialEnd = item.card.serialNumber;
        }
        combo.count += 1;
        combo.nominal += nominal;
      }
    });

    // Get info
    const operatorName = items[0]?.operator?.fullName || "-";
    const purchaseDateStr = items[0]?.purchaseDate 
      ? formatDateID(items[0].purchaseDate) 
      : purchasedDate 
        ? formatDateID(purchasedDate) 
        : "-";
    const shiftDateStr = items[0]?.shiftDate 
      ? formatDateID(items[0].shiftDate) 
      : shiftDate 
        ? formatDateID(shiftDate) 
        : "-";

    // Build CSV string
    let csv = "LAPORAN TRANSAKSI HARIAN\n";
    csv += `Petugas: ${operatorName}, Tanggal: ${purchaseDateStr}, Shift: ${shiftDateStr}\n\n`;

    // FWC Table
    const fwcTableData = Object.values(fwcCombinations);
    csv += "No,Kategori,Type,Serial Start,Serial End,Jumlah,Nominal\n";
    
    fwcTableData.forEach((combo: any, index: number) => {
      csv += `${index + 1},${combo.category},${combo.type},${combo.serialStart},${combo.serialEnd},${combo.count},${combo.nominal}\n`;
    });

    const fwcTotalCount = fwcTableData.reduce((sum: number, combo: any) => sum + combo.count, 0);
    const fwcTotalNominal = fwcTableData.reduce((sum: number, combo: any) => sum + combo.nominal, 0);
    csv += `,,,,Total FWC,${fwcTotalCount},${fwcTotalNominal}\n\n`;

    // Keterangan Gangguan
    if (keteranganGangguan) {
      csv += `\nKeterangan Kejadian Gangguan:\n"${keteranganGangguan}"\n`;
    }

    // Download
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0].replace(/-/g, "");
    link.download = `Shift_Report_FWC_${dateStr}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setKeteranganGangguan("");
  };

  /* =====================
     IMAGE EXPORT FUNCTION
  ===================== */
  const generateImageReport = async (items: any[]) => {
    if (!items || items.length === 0) {
      alert("Tidak ada data untuk diekspor");
      return;
    }

    // Fetch all card products
    const token = localStorage.getItem("fwc_token");
    if (!token) {
      alert("Session expired. Silakan login kembali.");
      return;
    }

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const productsRes = await fetch(`${API_URL}/card/product`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    if (!productsRes.ok) {
      alert("Gagal mengambil data card products");
      return;
    }
    
    const productsData = await productsRes.json();
    const allProducts = productsData.data || [];

    // Initialize from FWC products only
    const fwcCombinations: any = {};

    allProducts.forEach((product: any) => {
      const programType = product.programType || "FWC";
      
      // Only include FWC products
      if (programType !== "FWC") return;

      const category = product.category?.categoryName || "Unknown";
      const type = product.type?.typeName || "Unknown";
      const key = `${category}-${type}`;

      if (!fwcCombinations[key]) {
        fwcCombinations[key] = {
          category,
          type,
          serialStart: "-",
          serialEnd: "-",
          count: 0,
          nominal: 0,
        };
      }
    });

    // Merge with actual transaction data (FWC only)
    items.forEach((item: any) => {
      if (!item.card?.cardProduct) return;

      const programType = item.card.cardProduct.programType || "FWC";
      
      // Only process FWC
      if (programType !== "FWC") return;

      const category = item.card.cardProduct.category?.categoryName || "Unknown";
      const type = item.card.cardProduct.type?.typeName || "Unknown";
      const key = `${category}-${type}`;
      const nominal = item.price || 0;

      if (fwcCombinations[key]) {
        const combo = fwcCombinations[key];
        if (combo.count === 0) {
          combo.serialStart = item.card.serialNumber;
          combo.serialEnd = item.card.serialNumber;
        } else {
          if (item.card.serialNumber < combo.serialStart) combo.serialStart = item.card.serialNumber;
          if (item.card.serialNumber > combo.serialEnd) combo.serialEnd = item.card.serialNumber;
        }
        combo.count += 1;
        combo.nominal += nominal;
      }
    });

    // Get info
    const operatorName = items[0]?.operator?.fullName || "-";
    const purchaseDateStr = items[0]?.purchaseDate 
      ? formatDateID(items[0].purchaseDate) 
      : purchasedDate 
        ? formatDateID(purchasedDate) 
        : "-";
    const shiftDateStr = items[0]?.shiftDate 
      ? formatDateID(items[0].shiftDate) 
      : shiftDate 
        ? formatDateID(shiftDate) 
        : "-";

    // Helper function to escape HTML
    const escapeHtml = (text: string) => {
      const div = document.createElement("div");
      div.textContent = text;
      return div.innerHTML;
    };

    // Create completely isolated container - visible but overlayed
    const container = document.createElement("div");
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      z-index: 9999;
      pointer-events: none;
      opacity: 0;
    `;
    document.body.appendChild(container);

    // Create temporary HTML structure with complete inline styles
    const tempDiv = document.createElement("div");
    // Use cssText for complete style override
    tempDiv.style.cssText = `
      background-color: rgb(255, 255, 255);
      padding: 40px;
      font-family: Arial, sans-serif;
      width: 1200px;
      color: rgb(0, 0, 0);
      font-size: 14px;
      line-height: 1.5;
      min-height: 500px;
    `;
    container.appendChild(tempDiv);

    // Build HTML content with explicit rgb colors only
    let html = `
      <div style="margin-bottom: 20px; color: rgb(0, 0, 0);">
        <h2 style="text-align: center; margin: 0; font-size: 24px; color: rgb(141, 18, 49); font-family: Arial, sans-serif;">LAPORAN TRANSAKSI HARIAN</h2>
        <div style="background: rgb(245, 245, 245); padding: 15px; margin-top: 15px; border-radius: 5px; text-align: center; color: rgb(0, 0, 0); font-family: Arial, sans-serif;">
          <strong style="color: rgb(0, 0, 0);">Petugas:</strong> ${operatorName} &nbsp;|&nbsp; 
          <strong style="color: rgb(0, 0, 0);">Tanggal:</strong> ${purchaseDateStr} &nbsp;|&nbsp; 
          <strong style="color: rgb(0, 0, 0);">Shift:</strong> ${shiftDateStr}
        </div>
      </div>
    `;

    // FWC Table
    const fwcTableData = Object.values(fwcCombinations);
    html += `
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
        <thead>
          <tr style="background: rgb(141, 18, 49); color: rgb(255, 255, 255);">
            <th style="border: 1px solid rgb(221, 221, 221); padding: 12px; text-align: center;">No</th>
            <th style="border: 1px solid rgb(221, 221, 221); padding: 12px; text-align: center;">Kategori</th>
            <th style="border: 1px solid rgb(221, 221, 221); padding: 12px; text-align: center;">Type</th>
            <th style="border: 1px solid rgb(221, 221, 221); padding: 12px; text-align: center;">Serial Start</th>
            <th style="border: 1px solid rgb(221, 221, 221); padding: 12px; text-align: center;">Serial End</th>
            <th style="border: 1px solid rgb(221, 221, 221); padding: 12px; text-align: center;">Jumlah</th>
            <th style="border: 1px solid rgb(221, 221, 221); padding: 12px; text-align: center;">Nominal</th>
          </tr>
        </thead>
        <tbody>
    `;

    fwcTableData.forEach((combo: any, index: number) => {
      html += `
        <tr>
          <td style="border: 1px solid rgb(221, 221, 221); padding: 10px; text-align: center; color: rgb(0, 0, 0);">${index + 1}</td>
          <td style="border: 1px solid rgb(221, 221, 221); padding: 10px; text-align: center; color: rgb(0, 0, 0);">${combo.category}</td>
          <td style="border: 1px solid rgb(221, 221, 221); padding: 10px; text-align: center; color: rgb(0, 0, 0);">${combo.type}</td>
          <td style="border: 1px solid rgb(221, 221, 221); padding: 10px; text-align: center; color: rgb(0, 0, 0);">${combo.serialStart}</td>
          <td style="border: 1px solid rgb(221, 221, 221); padding: 10px; text-align: center; color: rgb(0, 0, 0);">${combo.serialEnd}</td>
          <td style="border: 1px solid rgb(221, 221, 221); padding: 10px; text-align: center; color: rgb(0, 0, 0);">${combo.count}</td>
          <td style="border: 1px solid rgb(221, 221, 221); padding: 10px; text-align: center; color: rgb(0, 0, 0);">Rp ${new Intl.NumberFormat("id-ID").format(combo.nominal)}</td>
        </tr>
      `;
    });

    const fwcTotalCount = fwcTableData.reduce((sum: number, combo: any) => sum + combo.count, 0) as number;
    const fwcTotalNominal = fwcTableData.reduce((sum: number, combo: any) => sum + combo.nominal, 0) as number;

    html += `
        <tr style="background: rgb(240, 240, 240); font-weight: bold;">
          <td colspan="5" style="border: 1px solid rgb(221, 221, 221); padding: 10px; text-align: center; color: rgb(0, 0, 0);">Total FWC</td>
          <td style="border: 1px solid rgb(221, 221, 221); padding: 10px; text-align: center; color: rgb(0, 0, 0);">${fwcTotalCount}</td>
          <td style="border: 1px solid rgb(221, 221, 221); padding: 10px; text-align: center; color: rgb(0, 0, 0);">Rp ${new Intl.NumberFormat("id-ID").format(fwcTotalNominal)}</td>
        </tr>
        </tbody>
      </table>
    `;

    // Keterangan Gangguan
    if (keteranganGangguan) {
      html += `
        <div style="margin-top: 20px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 10px 0; color: rgb(0, 0, 0); font-family: Arial, sans-serif;">Keterangan Kejadian Gangguan:</h3>
          <p style="background: rgb(249, 249, 249); padding: 15px; border: 1px solid rgb(221, 221, 221); border-radius: 5px; margin: 0; color: rgb(0, 0, 0); font-family: Arial, sans-serif;">${escapeHtml(keteranganGangguan)}</p>
        </div>
      `;
    }

    // Signatures
    html += `
      <div style="margin-top: 50px; display: flex; justify-content: space-between;">
        <div style="text-align: center; width: 200px;">
          <div style="margin-bottom: 60px; color: rgb(0, 0, 0); font-family: Arial, sans-serif;">PSAC</div>
          <div style="border-top: 1px solid rgb(0, 0, 0);"></div>
        </div>
        <div style="text-align: center; width: 200px;">
          <div style="margin-bottom: 60px; color: rgb(0, 0, 0); font-family: Arial, sans-serif;">SPV</div>
          <div style="border-top: 1px solid rgb(0, 0, 0);"></div>
        </div>
      </div>
    `;

    tempDiv.innerHTML = html;

    // Wait for DOM to render
    await new Promise(resolve => setTimeout(resolve, 100));

    // Render to canvas with aggressive color stripping
    try {
      const canvas = await html2canvas(tempDiv, {
        backgroundColor: "#ffffff",
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        foreignObjectRendering: false,
        width: 1200,
        height: tempDiv.scrollHeight,
        windowWidth: 1200,
        windowHeight: tempDiv.scrollHeight,
        onclone: (clonedDoc) => {
          // Strip all computed styles that might contain lab() colors
          const allElements = clonedDoc.querySelectorAll('*');
          allElements.forEach((el: any) => {
            if (el.style) {
              // Force override any color property with rgb
              const computedStyle = window.getComputedStyle(el);
              
              // Override color properties
              if (computedStyle.color && computedStyle.color.includes('lab')) {
                el.style.setProperty('color', 'rgb(0, 0, 0)', 'important');
              }
              if (computedStyle.backgroundColor && computedStyle.backgroundColor.includes('lab')) {
                el.style.setProperty('background-color', 'rgb(255, 255, 255)', 'important');
              }
              if (computedStyle.borderColor && computedStyle.borderColor.includes('lab')) {
                el.style.setProperty('border-color', 'rgb(221, 221, 221)', 'important');
              }
              
              // Remove any color function usage
              ['color', 'background-color', 'border-color', 'outline-color'].forEach(prop => {
                const value = el.style.getPropertyValue(prop);
                if (value && (value.includes('lab(') || value.includes('lch(') || value.includes('oklab('))) {
                  el.style.setProperty(prop, 'rgb(0, 0, 0)', 'important');
                }
              });
            }
          });
        },
      });

      // Convert to blob and download using Promise
      await new Promise<void>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            try {
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              const today = new Date();
              const dateStr = today.toISOString().split("T")[0].replace(/-/g, "");
              link.download = `Shift_Report_FWC_${dateStr}.png`;
              link.click();
              
              // Cleanup after short delay
              setTimeout(() => {
                URL.revokeObjectURL(url);
              }, 100);
              
              resolve();
            } catch (err) {
              reject(err);
            }
          } else {
            reject(new Error("Failed to create blob"));
          }
        }, "image/png");
      });

      // Cleanup
      document.body.removeChild(container);
      setKeteranganGangguan("");
    } catch (error) {
      console.error("Error generating image:", error);
      
      // Cleanup on error
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
      
      // More detailed error message
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      alert(`Gagal menghasilkan gambar: ${errorMessage}`);
      setKeteranganGangguan("");
    }
  };

  /* =====================
     RENDER
  ===================== */
  return (
    <div className="space-y-6">
      <TransactionToolbar
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPagination((p) => ({ ...p, page: 1 }));
        }}
        onAdd={handleAddPurchased}
        onAddMember={handleAddMember}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          resetFilter();
        }}
      />

      {activeTab && (
        <>
          <TransactionFilter
            activeTab={activeTab}
            onTabChange={(tab) => {
              setActiveTab(tab);
              resetFilter();
            }}
            role={role}
            stationId={stationId}
            purchasedDate={purchasedDate}
            shiftDate={shiftDate}
            cardCategoryId={cardCategoryId}
            cardTypeId={cardTypeId}
            employeeTypeId={employeeTypeId}
            onStationChange={(v) => {
              setStationId(v);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            onPurchasedDateChange={(v) => {
              setPurchasedDate(v);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            onShiftDateChange={(v) => {
              setShiftDate(v);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            onCardCategoryChange={(v) => {
              setCardCategoryId(v);
              setCardTypeId(undefined);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            onCardTypeChange={(v) => {
              setCardTypeId(v);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            onEmployeeTypeChange={(v) => {
              setEmployeeTypeId(v);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            onReset={resetFilter}
            onExportPDF={handleExportPDF}
            onExportShiftPDF={handleExportShiftPDF}
          />

          {activeTab === "fwc" ? (
            <TransactionTableFWC
              data={fwcData}
              loading={loading}
              pagination={pagination}
              onPageChange={(page) => setPagination((p) => ({ ...p, page }))}
              onEdit={(id) =>
                router.push(`${basePath}/${transactionPath}/edit/${id}`)
              }
              onDelete={() => fetchData()}
              canEdit
              canDelete={true}
            />
          ) : (
            <TransactionTableVoucher
              data={voucherData}
              loading={loading}
              pagination={pagination}
              onPageChange={(page) => setPagination((p) => ({ ...p, page }))}
              onDelete={() => fetchData()}
              canDelete={true}
            />
          )}
        </>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Export Shift Report</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Format Export
              </label>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as "pdf" | "excel" | "csv" | "image")}
              >
                <option value="pdf">PDF</option>
                <option value="excel">Excel (.xlsx)</option>
                <option value="csv">CSV</option>
                <option value="image">Image (.png)</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Keterangan Kejadian Gangguan (Opsional)
              </label>
              <textarea
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
                rows={4}
                value={keteranganGangguan}
                onChange={(e) => setKeteranganGangguan(e.target.value)}
                placeholder="Masukkan keterangan jika ada kejadian gangguan..."
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowExportModal(false);
                  setKeteranganGangguan("");
                }}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  switch (exportFormat) {
                    case "pdf":
                      generateShiftPDF();
                      break;
                    case "excel":
                      generateExcelReport(exportItems);
                      break;
                    case "csv":
                      generateCSVReport(exportItems);
                      break;
                    case "image":
                      generateImageReport(exportItems);
                      break;
                  }
                  setShowExportModal(false);
                }}
                className="px-4 py-2 text-sm bg-red-900 text-white hover:bg-red-800 rounded-md"
              >
                Export {exportFormat.toUpperCase()}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
