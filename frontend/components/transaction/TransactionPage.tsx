"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getPurchases } from "@/lib/services/purchase.service";
import TransactionToolbar from "./components/TransactionToolbar";
import TransactionFilter from "./components/TransactionFilter";
import TransactionTableFWC from "./components/TransactionTableFWC";
import TransactionTableVoucher from "./components/TransactionTableVoucher";
import DeletedPurchaseTable, {
  type DeletedPurchaseItem,
} from "./components/DeletedPurchaseTable";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import html2canvas from "html2canvas";
import axios from "@/lib/axios";

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
  const [stationIds, setStationIds] = useState<string[] | undefined>();
  const [purchasedDate, setPurchasedDate] = useState<string | undefined>();
  const [shiftDate, setShiftDate] = useState<string | undefined>();
  const [cardCategoryIds, setCardCategoryIds] = useState<string[] | undefined>();
  const [cardTypeIds, setCardTypeIds] = useState<string[] | undefined>();
  const [employeeTypeIds, setEmployeeTypeIds] = useState<string[] | undefined>();

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

  /* Laporan Transaksi export modal */
  const [showTransactionExportModal, setShowTransactionExportModal] = useState(false);
  const [transactionExportFormat, setTransactionExportFormat] = useState<"pdf" | "excel" | "csv" | "image">("pdf");
  const [transactionExportItems, setTransactionExportItems] = useState<any[]>([]);

  /* Riwayat Penghapusan (deleted purchases) */
  const [deletedPurchases, setDeletedPurchases] = useState<DeletedPurchaseItem[]>([]);
  const [isLoadingDeleted, setIsLoadingDeleted] = useState(false);
  const [deletedPage, setDeletedPage] = useState(1);
  const [deletedPagination, setDeletedPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  /* =====================
     RESET FILTER
  ===================== */
  const resetFilter = () => {
    setStationIds(undefined);
    setPurchasedDate(undefined);
    setShiftDate(undefined);
    setCardCategoryIds(undefined);
    setCardTypeIds(undefined);
    setEmployeeTypeIds(undefined);
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
      stationIds,
      startDate: purchasedDate,
      endDate: shiftDate,
      categoryIds: cardCategoryIds,
      typeIds: cardTypeIds,
      employeeTypeIds,
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

  /** Load riwayat penghapusan (deleted purchases) - filter by active tab (FWC/Voucher) */
  const loadDeletedPurchases = async () => {
    if (!activeTab || (activeTab !== "fwc" && activeTab !== "voucher")) return;
    setIsLoadingDeleted(true);
    try {
      const res = await getPurchases({
        page: deletedPage,
        limit: 10,
        search,
        stationIds,
        startDate: purchasedDate,
        endDate: shiftDate,
        categoryIds: cardCategoryIds,
        typeIds: cardTypeIds,
        employeeTypeIds,
        transactionType: activeTab,
        isDeleted: true,
      });
      if (res.success && res.data) {
        setDeletedPurchases((res.data.items as DeletedPurchaseItem[]) || []);
        setDeletedPagination(res.data.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 1,
        });
      } else {
        setDeletedPurchases([]);
        setDeletedPagination({ page: 1, limit: 10, total: 0, totalPages: 1 });
      }
    } catch {
      setDeletedPurchases([]);
      setDeletedPagination({ page: 1, limit: 10, total: 0, totalPages: 1 });
    } finally {
      setIsLoadingDeleted(false);
    }
  };

  /* =====================
     INITIALIZE TAB FROM URL QUERY PARAMETER
  ===================== */
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if ((tabParam === "fwc" || tabParam === "voucher") && activeTab !== tabParam) {
      setActiveTab(tabParam);
    }
  }, [searchParams, activeTab]);

  /* =====================
     RESET CATEGORY & TYPE WHEN TAB CHANGES (FWC vs Voucher punya list beda)
  ===================== */
  useEffect(() => {
    setCardCategoryIds(undefined);
    setCardTypeIds(undefined);
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
    stationIds,
    purchasedDate,
    shiftDate,
    cardCategoryIds,
    cardTypeIds,
    employeeTypeIds,
    pagination.page,
    searchParams.get("refresh"),
  ]);

  /* Reset deleted list page when tab/filters change */
  useEffect(() => {
    if (!activeTab || (activeTab !== "fwc" && activeTab !== "voucher")) return;
    setDeletedPage(1);
  }, [
    activeTab,
    search,
    stationIds,
    purchasedDate,
    shiftDate,
    cardCategoryIds,
    cardTypeIds,
    employeeTypeIds,
  ]);

  /* Load riwayat penghapusan when tab, deletedPage, or filters change */
  useEffect(() => {
    if (!activeTab || (activeTab !== "fwc" && activeTab !== "voucher")) return;
    loadDeletedPurchases();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeTab,
    deletedPage,
    search,
    stationIds,
    purchasedDate,
    shiftDate,
    cardCategoryIds,
    cardTypeIds,
    employeeTypeIds,
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

  /** Open Laporan Transaksi export modal (fetch data first) - data sesuai tab: FWC atau Voucher */
  const openTransactionExportModal = async () => {
    const res = await getPurchases({
      search,
      stationIds,
      startDate: purchasedDate,
      endDate: shiftDate,
      categoryIds: cardCategoryIds,
      typeIds: cardTypeIds,
      employeeTypeIds,
      transactionType: activeTab === "voucher" ? "voucher" : "fwc",
      limit: 1000,
    });

    if (!res.success || !res.data?.items?.length) {
      alert("Data kosong");
      return;
    }

    setTransactionExportItems(res.data.items);
    setShowTransactionExportModal(true);
  };

  /** Generate Laporan Transaksi PDF from items */
  const generateTransactionPDF = (items: any[]) => {
    const isVoucher = activeTab === "voucher";
    
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(isVoucher ? "Laporan Transaksi Voucher" : "Laporan Transaksi", pageWidth / 2, margin, { align: "center" });

    let tableData: any[];
    let headers: string[];

    if (isVoucher) {
      // Format untuk Voucher
      tableData = items.map((item: any, idx: number) => {
        const isBulkPurchase = item.programType === "VOUCHER" && item.bulkPurchaseItems && item.bulkPurchaseItems.length > 0;
        const quantity = isBulkPurchase ? (item.bulkPurchaseItemsCount ?? item.bulkPurchaseItems?.length ?? 0) : 1;
        const firstSerial = isBulkPurchase && item.bulkPurchaseItems?.[0]?.card?.serialNumber 
          ? item.bulkPurchaseItems[0].card.serialNumber 
          : item.card?.serialNumber ?? "-";
        const serialRange = item.firstSerialNumber && item.lastSerialNumber
          ? `${item.firstSerialNumber} - ${item.lastSerialNumber}`
          : item.card?.serialNumber ?? "-";
        const serialWithQuantity = isBulkPurchase ? `${firstSerial} (${quantity})` : firstSerial;
        
        return [
          idx + 1,
          item.member?.name || "-",
          item.member?.identityNumber ?? "-",
          item.member?.companyName ?? "-",
          isBulkPurchase
            ? item.bulkPurchaseItems?.[0]?.card?.cardProduct?.category?.categoryName ?? "-"
            : item.card?.cardProduct?.category?.categoryName ?? "-",
          isBulkPurchase
            ? item.bulkPurchaseItems?.[0]?.card?.cardProduct?.type?.typeName ?? "-"
            : item.card?.cardProduct?.type?.typeName ?? "-",
          serialWithQuantity,
          serialRange,
          item.edcReferenceNumber ? `EDC${item.edcReferenceNumber}` : "-",
          `Rp ${Number(item.price || 0).toLocaleString("id-ID")}`,
          formatDateID(item.purchaseDate),
          formatDateID(item.shiftDate ?? item.purchaseDate),
          item.operator?.fullName ?? "-",
          item.station?.stationName ?? "-",
          item.employeeType?.name ?? "-",
        ];
      });

      headers = [
        "No",
        "Customer Name",
        "Identity Number",
        "Perusahaan",
        "Voucher Category",
        "Voucher Type",
        "Serial Number Awal / Quantity",
        "Serial Number Awal - Serial Number Akhir",
        "Reference EDC",
        "Voucher Price",
        "Purchase Date",
        "Shift Date",
        "Operator Name",
        "Station",
        "Tipe Karyawan",
      ];
    } else {
      // Format untuk FWC
      tableData = items.map((item: any, idx: number) => [
        idx + 1,
        item.member?.name || "-",
        item.member?.identityNumber ? `FWC${item.member.identityNumber}` : "-",
        item.card?.cardProduct?.category?.categoryName ?? "-",
        item.card?.cardProduct?.type?.typeName ?? "-",
        item.card?.serialNumber ?? "-",
        item.edcReferenceNumber ? `EDC${item.edcReferenceNumber}` : "-",
        `Rp ${Number(item.price || 0).toLocaleString("id-ID")}`,
        formatDateID(item.purchaseDate),
        formatDateID(item.shiftDate ?? item.purchaseDate),
        item.operator?.fullName ?? "-",
        item.station?.stationName ?? "-",
      ]);

      headers = [
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
      ];
    }

    autoTable(doc, {
      head: [headers],
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
    const filename = isVoucher ? `Transaction_Report_Voucher_${dateStr}.pdf` : `Transaction_Report_FWC_${dateStr}.pdf`;
    doc.save(filename);
  };

  /** Generate Laporan Transaksi Excel from items */
  const generateTransactionExcel = (items: any[]) => {
    const isVoucher = activeTab === "voucher";
    
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "FWC System";
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet(isVoucher ? "Laporan Transaksi Voucher" : "Laporan Transaksi");

    let headers: string[];
    let columnWidths: { width: number }[];

    if (isVoucher) {
      headers = [
        "No",
        "Customer Name",
        "Identity Number",
        "Perusahaan",
        "Voucher Category",
        "Voucher Type",
        "Serial Number Awal / Quantity",
        "Serial Number Awal - Serial Number Akhir",
        "Reference EDC",
        "Voucher Price",
        "Purchase Date",
        "Shift Date",
        "Operator Name",
        "Station",
        "Tipe Karyawan",
      ];
      columnWidths = [
        { width: 6 },
        { width: 22 },
        { width: 18 },
        { width: 18 },
        { width: 18 },
        { width: 18 },
        { width: 25 },
        { width: 35 },
        { width: 16 },
        { width: 14 },
        { width: 14 },
        { width: 12 },
        { width: 18 },
        { width: 18 },
        { width: 18 },
      ];
    } else {
      headers = [
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
      ];
      columnWidths = [
        { width: 6 },
        { width: 22 },
        { width: 18 },
        { width: 18 },
        { width: 18 },
        { width: 18 },
        { width: 16 },
        { width: 14 },
        { width: 14 },
        { width: 12 },
        { width: 18 },
        { width: 18 },
      ];
    }

    const headerRow = worksheet.getRow(1);
    headerRow.values = headers;
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF8D1231" },
    };
    headerRow.alignment = { horizontal: "center", vertical: "middle" };
    headerRow.height = 20;

    items.forEach((item: any, idx: number) => {
      const row = worksheet.getRow(idx + 2);
      
      if (isVoucher) {
        const isBulkPurchase = item.programType === "VOUCHER" && item.bulkPurchaseItems && item.bulkPurchaseItems.length > 0;
        const quantity = isBulkPurchase ? (item.bulkPurchaseItemsCount ?? item.bulkPurchaseItems?.length ?? 0) : 1;
        const firstSerial = isBulkPurchase && item.bulkPurchaseItems?.[0]?.card?.serialNumber 
          ? item.bulkPurchaseItems[0].card.serialNumber 
          : item.card?.serialNumber ?? "-";
        const serialRange = item.firstSerialNumber && item.lastSerialNumber
          ? `${item.firstSerialNumber} - ${item.lastSerialNumber}`
          : item.card?.serialNumber ?? "-";
        const serialWithQuantity = isBulkPurchase ? `${firstSerial} (${quantity})` : firstSerial;
        
        row.values = [
          idx + 1,
          item.member?.name || "-",
          item.member?.identityNumber ?? "-",
          item.member?.companyName ?? "-",
          isBulkPurchase
            ? item.bulkPurchaseItems?.[0]?.card?.cardProduct?.category?.categoryName ?? "-"
            : item.card?.cardProduct?.category?.categoryName ?? "-",
          isBulkPurchase
            ? item.bulkPurchaseItems?.[0]?.card?.cardProduct?.type?.typeName ?? "-"
            : item.card?.cardProduct?.type?.typeName ?? "-",
          serialWithQuantity,
          serialRange,
          item.edcReferenceNumber ? `EDC${item.edcReferenceNumber}` : "-",
          Number(item.price || 0),
          formatDateID(item.purchaseDate),
          formatDateID(item.shiftDate ?? item.purchaseDate),
          item.operator?.fullName ?? "-",
          item.station?.stationName ?? "-",
          item.employeeType?.name ?? "-",
        ];
      } else {
        row.values = [
          idx + 1,
          item.member?.name || "-",
          item.member?.identityNumber ? `FWC${item.member.identityNumber}` : "-",
          item.card?.cardProduct?.category?.categoryName ?? "-",
          item.card?.cardProduct?.type?.typeName ?? "-",
          item.card?.serialNumber ?? "-",
          item.edcReferenceNumber ? `EDC${item.edcReferenceNumber}` : "-",
          Number(item.price || 0),
          formatDateID(item.purchaseDate),
          formatDateID(item.shiftDate ?? item.purchaseDate),
          item.operator?.fullName ?? "-",
          item.station?.stationName ?? "-",
        ];
      }
      row.alignment = { horizontal: "left", vertical: "middle" };
    });

    worksheet.columns = columnWidths;

    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const dateStr = new Date().toISOString().split("T")[0].replace(/-/g, "");
      const filename = isVoucher ? `Transaction_Report_Voucher_${dateStr}.xlsx` : `Transaction_Report_FWC_${dateStr}.xlsx`;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    });
  };

  /** Generate Laporan Transaksi CSV from items */
  const generateTransactionCSV = (items: any[]) => {
    const isVoucher = activeTab === "voucher";
    
    let headers: string[];
    
    if (isVoucher) {
      headers = [
        "No",
        "Customer Name",
        "Identity Number",
        "Perusahaan",
        "Voucher Category",
        "Voucher Type",
        "Serial Number Awal / Quantity",
        "Serial Number Awal - Serial Number Akhir",
        "Reference EDC",
        "Voucher Price",
        "Purchase Date",
        "Shift Date",
        "Operator Name",
        "Station",
        "Tipe Karyawan",
      ];
    } else {
      headers = [
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
      ];
    }
    
    const escapeCsv = (v: string | number) => {
      const s = String(v ?? "");
      if (/[,"\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    let csv = headers.map(escapeCsv).join(",") + "\n";
    items.forEach((item: any, idx: number) => {
      let row: any[];
      
      if (isVoucher) {
        const isBulkPurchase = item.programType === "VOUCHER" && item.bulkPurchaseItems && item.bulkPurchaseItems.length > 0;
        const quantity = isBulkPurchase ? (item.bulkPurchaseItemsCount ?? item.bulkPurchaseItems?.length ?? 0) : 1;
        const firstSerial = isBulkPurchase && item.bulkPurchaseItems?.[0]?.card?.serialNumber 
          ? item.bulkPurchaseItems[0].card.serialNumber 
          : item.card?.serialNumber ?? "-";
        const serialRange = item.firstSerialNumber && item.lastSerialNumber
          ? `${item.firstSerialNumber} - ${item.lastSerialNumber}`
          : item.card?.serialNumber ?? "-";
        const serialWithQuantity = isBulkPurchase ? `${firstSerial} (${quantity})` : firstSerial;
        
        row = [
          idx + 1,
          item.member?.name || "-",
          item.member?.identityNumber ?? "-",
          item.member?.companyName ?? "-",
          isBulkPurchase
            ? item.bulkPurchaseItems?.[0]?.card?.cardProduct?.category?.categoryName ?? "-"
            : item.card?.cardProduct?.category?.categoryName ?? "-",
          isBulkPurchase
            ? item.bulkPurchaseItems?.[0]?.card?.cardProduct?.type?.typeName ?? "-"
            : item.card?.cardProduct?.type?.typeName ?? "-",
          serialWithQuantity,
          serialRange,
          item.edcReferenceNumber ? `EDC${item.edcReferenceNumber}` : "-",
          Number(item.price || 0),
          formatDateID(item.purchaseDate),
          formatDateID(item.shiftDate ?? item.purchaseDate),
          item.operator?.fullName ?? "-",
          item.station?.stationName ?? "-",
          item.employeeType?.name ?? "-",
        ];
      } else {
        row = [
          idx + 1,
          item.member?.name || "-",
          item.member?.identityNumber ? `FWC${item.member.identityNumber}` : "-",
          item.card?.cardProduct?.category?.categoryName ?? "-",
          item.card?.cardProduct?.type?.typeName ?? "-",
          item.card?.serialNumber ?? "-",
          item.edcReferenceNumber ? `EDC${item.edcReferenceNumber}` : "-",
          Number(item.price || 0),
          formatDateID(item.purchaseDate),
          formatDateID(item.shiftDate ?? item.purchaseDate),
          item.operator?.fullName ?? "-",
          item.station?.stationName ?? "-",
        ];
      }
      csv += row.map(escapeCsv).join(",") + "\n";
    });
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const dateStr = new Date().toISOString().split("T")[0].replace(/-/g, "");
    const filename = isVoucher ? `Transaction_Report_Voucher_${dateStr}.csv` : `Transaction_Report_FWC_${dateStr}.csv`;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  /** Generate Laporan Transaksi Image from items - render in iframe to avoid lab() color from main page */
  const generateTransactionImage = async (items: any[]) => {
    const isVoucher = activeTab === "voucher";
    
    const escapeHtml = (text: string) => {
      const div = document.createElement("div");
      div.textContent = text;
      return div.innerHTML;
    };

    let rowsHtml = "";
    let headersHtml = "";
    
    if (isVoucher) {
      headersHtml = `
        <th style="border:1px solid rgb(221,221,221);padding:10px;text-align:center;">No</th>
        <th style="border:1px solid rgb(221,221,221);padding:10px;text-align:center;">Customer Name</th>
        <th style="border:1px solid rgb(221,221,221);padding:10px;text-align:center;">Identity Number</th>
        <th style="border:1px solid rgb(221,221,221);padding:10px;text-align:center;">Perusahaan</th>
        <th style="border:1px solid rgb(221,221,221);padding:10px;text-align:center;">Voucher Category</th>
        <th style="border:1px solid rgb(221,221,221);padding:10px;text-align:center;">Voucher Type</th>
        <th style="border:1px solid rgb(221,221,221);padding:10px;text-align:center;">Serial Number Awal / Quantity</th>
        <th style="border:1px solid rgb(221,221,221);padding:10px;text-align:center;">Serial Number Awal - Serial Number Akhir</th>
        <th style="border:1px solid rgb(221,221,221);padding:10px;text-align:center;">Reference EDC</th>
        <th style="border:1px solid rgb(221,221,221);padding:10px;text-align:center;">Voucher Price</th>
        <th style="border:1px solid rgb(221,221,221);padding:10px;text-align:center;">Purchase Date</th>
        <th style="border:1px solid rgb(221,221,221);padding:10px;text-align:center;">Shift Date</th>
        <th style="border:1px solid rgb(221,221,221);padding:10px;text-align:center;">Operator</th>
        <th style="border:1px solid rgb(221,221,221);padding:10px;text-align:center;">Station</th>
        <th style="border:1px solid rgb(221,221,221);padding:10px;text-align:center;">Tipe Karyawan</th>
      `;
      
      items.forEach((item: any, idx: number) => {
        const isBulkPurchase = item.programType === "VOUCHER" && item.bulkPurchaseItems && item.bulkPurchaseItems.length > 0;
        const quantity = isBulkPurchase ? (item.bulkPurchaseItemsCount ?? item.bulkPurchaseItems?.length ?? 0) : 1;
        const firstSerial = isBulkPurchase && item.bulkPurchaseItems?.[0]?.card?.serialNumber 
          ? item.bulkPurchaseItems[0].card.serialNumber 
          : item.card?.serialNumber ?? "-";
        const serialRange = item.firstSerialNumber && item.lastSerialNumber
          ? `${item.firstSerialNumber} - ${item.lastSerialNumber}`
          : item.card?.serialNumber ?? "-";
        const serialWithQuantity = isBulkPurchase ? `${firstSerial} (${quantity})` : firstSerial;
        
        rowsHtml += `
          <tr>
            <td style="border: 1px solid rgb(221, 221, 221); padding: 8px; text-align: center; color: rgb(0, 0, 0);">${idx + 1}</td>
            <td style="border: 1px solid rgb(221, 221, 221); padding: 8px; color: rgb(0, 0, 0);">${escapeHtml(item.member?.name || "-")}</td>
            <td style="border: 1px solid rgb(221, 221, 221); padding: 8px; color: rgb(0, 0, 0);">${escapeHtml(item.member?.identityNumber ?? "-")}</td>
            <td style="border: 1px solid rgb(221, 221, 221); padding: 8px; color: rgb(0, 0, 0);">${escapeHtml(item.member?.companyName ?? "-")}</td>
            <td style="border: 1px solid rgb(221, 221, 221); padding: 8px; color: rgb(0, 0, 0);">${escapeHtml(isBulkPurchase ? (item.bulkPurchaseItems?.[0]?.card?.cardProduct?.category?.categoryName ?? "-") : (item.card?.cardProduct?.category?.categoryName ?? "-"))}</td>
            <td style="border: 1px solid rgb(221, 221, 221); padding: 8px; color: rgb(0, 0, 0);">${escapeHtml(isBulkPurchase ? (item.bulkPurchaseItems?.[0]?.card?.cardProduct?.type?.typeName ?? "-") : (item.card?.cardProduct?.type?.typeName ?? "-"))}</td>
            <td style="border: 1px solid rgb(221, 221, 221); padding: 8px; color: rgb(0, 0, 0);">${escapeHtml(serialWithQuantity)}</td>
            <td style="border: 1px solid rgb(221, 221, 221); padding: 8px; color: rgb(0, 0, 0);">${escapeHtml(serialRange)}</td>
            <td style="border: 1px solid rgb(221, 221, 221); padding: 8px; color: rgb(0, 0, 0);">${escapeHtml(item.edcReferenceNumber ? `EDC${item.edcReferenceNumber}` : "-")}</td>
            <td style="border: 1px solid rgb(221, 221, 221); padding: 8px; color: rgb(0, 0, 0);">Rp ${Number(item.price || 0).toLocaleString("id-ID")}</td>
            <td style="border: 1px solid rgb(221, 221, 221); padding: 8px; color: rgb(0, 0, 0);">${formatDateID(item.purchaseDate)}</td>
            <td style="border: 1px solid rgb(221, 221, 221); padding: 8px; color: rgb(0, 0, 0);">${formatDateID(item.shiftDate ?? item.purchaseDate)}</td>
            <td style="border: 1px solid rgb(221, 221, 221); padding: 8px; color: rgb(0, 0, 0);">${escapeHtml(item.operator?.fullName ?? "-")}</td>
            <td style="border: 1px solid rgb(221, 221, 221); padding: 8px; color: rgb(0, 0, 0);">${escapeHtml(item.station?.stationName ?? "-")}</td>
            <td style="border: 1px solid rgb(221, 221, 221); padding: 8px; color: rgb(0, 0, 0);">${escapeHtml(item.employeeType?.name ?? "-")}</td>
          </tr>
        `;
      });
    } else {
      headersHtml = `
        <th style="border:1px solid rgb(221,221,221);padding:10px;text-align:center;">No</th>
        <th style="border:1px solid rgb(221,221,221);padding:10px;text-align:center;">Customer Name</th>
        <th style="border:1px solid rgb(221,221,221);padding:10px;text-align:center;">Identity Number</th>
        <th style="border:1px solid rgb(221,221,221);padding:10px;text-align:center;">Card Category</th>
        <th style="border:1px solid rgb(221,221,221);padding:10px;text-align:center;">Card Type</th>
        <th style="border:1px solid rgb(221,221,221);padding:10px;text-align:center;">Serial Number</th>
        <th style="border:1px solid rgb(221,221,221);padding:10px;text-align:center;">Reference EDC</th>
        <th style="border:1px solid rgb(221,221,221);padding:10px;text-align:center;">FWC Price</th>
        <th style="border:1px solid rgb(221,221,221);padding:10px;text-align:center;">Purchase Date</th>
        <th style="border:1px solid rgb(221,221,221);padding:10px;text-align:center;">Shift Date</th>
        <th style="border:1px solid rgb(221,221,221);padding:10px;text-align:center;">Operator</th>
        <th style="border:1px solid rgb(221,221,221);padding:10px;text-align:center;">Station</th>
      `;
      
      items.forEach((item: any, idx: number) => {
        rowsHtml += `
          <tr>
            <td style="border: 1px solid rgb(221, 221, 221); padding: 8px; text-align: center; color: rgb(0, 0, 0);">${idx + 1}</td>
            <td style="border: 1px solid rgb(221, 221, 221); padding: 8px; color: rgb(0, 0, 0);">${escapeHtml(item.member?.name || "-")}</td>
            <td style="border: 1px solid rgb(221, 221, 221); padding: 8px; color: rgb(0, 0, 0);">${escapeHtml(item.member?.identityNumber ? `FWC${item.member.identityNumber}` : "-")}</td>
            <td style="border: 1px solid rgb(221, 221, 221); padding: 8px; color: rgb(0, 0, 0);">${escapeHtml(item.card?.cardProduct?.category?.categoryName ?? "-")}</td>
            <td style="border: 1px solid rgb(221, 221, 221); padding: 8px; color: rgb(0, 0, 0);">${escapeHtml(item.card?.cardProduct?.type?.typeName ?? "-")}</td>
            <td style="border: 1px solid rgb(221, 221, 221); padding: 8px; color: rgb(0, 0, 0);">${escapeHtml(item.card?.serialNumber ?? "-")}</td>
            <td style="border: 1px solid rgb(221, 221, 221); padding: 8px; color: rgb(0, 0, 0);">${escapeHtml(item.edcReferenceNumber ? `EDC${item.edcReferenceNumber}` : "-")}</td>
            <td style="border: 1px solid rgb(221, 221, 221); padding: 8px; color: rgb(0, 0, 0);">Rp ${Number(item.price || 0).toLocaleString("id-ID")}</td>
            <td style="border: 1px solid rgb(221, 221, 221); padding: 8px; color: rgb(0, 0, 0);">${formatDateID(item.purchaseDate)}</td>
            <td style="border: 1px solid rgb(221, 221, 221); padding: 8px; color: rgb(0, 0, 0);">${formatDateID(item.shiftDate ?? item.purchaseDate)}</td>
            <td style="border: 1px solid rgb(221, 221, 221); padding: 8px; color: rgb(0, 0, 0);">${escapeHtml(item.operator?.fullName ?? "-")}</td>
            <td style="border: 1px solid rgb(221, 221, 221); padding: 8px; color: rgb(0, 0, 0);">${escapeHtml(item.station?.stationName ?? "-")}</td>
          </tr>
        `;
      });
    }

    const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:40px;background-color:rgb(255,255,255);color:rgb(0,0,0);font-family:Arial,sans-serif;font-size:14px;">
      <h2 style="text-align:center;margin:0 0 20px 0;font-size:24px;color:rgb(141,18,49);">${isVoucher ? "Laporan Transaksi Voucher" : "Laporan Transaksi"}</h2>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="background-color:rgb(141,18,49);color:rgb(255,255,255);">
            ${headersHtml}
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </body></html>`;

    const iframe = document.createElement("iframe");
    iframe.setAttribute("style", "position:fixed;left:-99999px;top:0;width:1200px;height:800px;border:0;visibility:hidden;");
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) {
      document.body.removeChild(iframe);
      alert("Gagal menghasilkan gambar");
      return;
    }

    iframeDoc.open();
    iframeDoc.write(fullHtml);
    iframeDoc.close();

    const iframeBody = iframeDoc.body;
    await new Promise((r) => setTimeout(r, 150));

    try {
      const canvas = await html2canvas(iframeBody, {
        backgroundColor: "#ffffff",
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        foreignObjectRendering: false,
        width: 1200,
        height: Math.max(iframeBody.scrollHeight, 400),
        windowWidth: 1200,
        windowHeight: Math.max(iframeBody.scrollHeight, 400),
      });
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          const dateStr = new Date().toISOString().split("T")[0].replace(/-/g, "");
          const filename = isVoucher ? `Transaction_Report_Voucher_${dateStr}.png` : `Transaction_Report_FWC_${dateStr}.png`;
          link.download = filename;
          link.click();
          URL.revokeObjectURL(url);
        }
      }, "image/png");
    } catch (err) {
      console.error("Error generating transaction image:", err);
      alert("Gagal menghasilkan gambar");
    } finally {
      document.body.removeChild(iframe);
    }
  };

  const handleExportShiftPDF = async () => {
    // Fetch data first - sesuai dengan activeTab (FWC atau Voucher)
    const token = localStorage.getItem("fwc_token");
    if (!token) {
      alert("Session expired. Silakan login kembali.");
      return;
    }

    const transactionType = activeTab === "voucher" ? "voucher" : "fwc";
    const res = await getPurchases({
      search,
      stationIds,
      startDate: purchasedDate,
      endDate: shiftDate,
      categoryIds: cardCategoryIds,
      typeIds: cardTypeIds,
      employeeTypeIds,
      transactionType,
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
    const isVoucher = activeTab === "voucher";
    
    // Close modal
    setShowExportModal(false);

    // Get token
    const token = localStorage.getItem("fwc_token");
    if (!token) {
      alert("Session expired. Silakan login kembali.");
      return;
    }

    // Fetch all card products to get all category-type combinations
    // Use axios instance which automatically includes token via interceptor
    let allProducts: any[] = [];
    try {
      const productsRes = await axios.get("/card/product");
      allProducts = productsRes.data?.data || [];
    } catch (error) {
      console.error("Error fetching card products:", error);
      alert("Gagal mengambil data card products");
      return;
    }

    // Initialize combinations based on program type
    const combinations: any = {};

    allProducts.forEach((product: any) => {
      const programType = product.programType || "FWC";
      
      // Filter by program type
      if (isVoucher && programType !== "VOUCHER") return;
      if (!isVoucher && programType !== "FWC") return;
      
      const category = product.category?.categoryName || "-";
      const type = product.type?.typeName || "-";
      const key = `${category}|${type}`;

      if (!combinations[key]) {
        combinations[key] = {
          category,
          type,
          serialStart: "-",
          serialEnd: "-",
          count: 0,
          nominal: 0,
        };
      }
    });

    const transactionType = isVoucher ? "voucher" : "fwc";
    const res = await getPurchases({
      search,
      stationIds,
      startDate: purchasedDate,
      endDate: shiftDate,
      categoryIds: cardCategoryIds,
      typeIds: cardTypeIds,
      employeeTypeIds,
      transactionType,
      limit: 1000,
    });

    const items = res.success && res.data?.items ? res.data.items : [];

    // Merge transaction data into combinations
    items.forEach((item: any) => {
      const programType = item.programType || (item.card?.cardProduct?.programType || "FWC");
      
      // Filter by program type
      if (isVoucher && programType !== "VOUCHER") return;
      if (!isVoucher && programType !== "FWC") return;
      
      // For voucher, handle bulk purchases
      let category: string;
      let type: string;
      let serialStart: string = "-";
      let serialEnd: string = "-";
      let count: number = 0;
      
      if (isVoucher) {
        const isBulkPurchase = item.bulkPurchaseItems && item.bulkPurchaseItems.length > 0;
        
        if (isBulkPurchase) {
          category = item.bulkPurchaseItems[0]?.card?.cardProduct?.category?.categoryName || "-";
          type = item.bulkPurchaseItems[0]?.card?.cardProduct?.type?.typeName || "-";
          count = item.bulkPurchaseItemsCount ?? item.bulkPurchaseItems?.length ?? 0;
          
          // Use firstSerialNumber and lastSerialNumber if available, otherwise calculate from bulkPurchaseItems
          if (item.firstSerialNumber && item.lastSerialNumber) {
            serialStart = item.firstSerialNumber;
            serialEnd = item.lastSerialNumber;
          } else if (item.bulkPurchaseItems && item.bulkPurchaseItems.length > 0) {
            const serials = item.bulkPurchaseItems
              .map((bi: any) => bi.card?.serialNumber)
              .filter((s: string) => s)
              .sort();
            if (serials.length > 0) {
              serialStart = serials[0];
              serialEnd = serials[serials.length - 1];
            }
          }
        } else {
          category = item.card?.cardProduct?.category?.categoryName || "-";
          type = item.card?.cardProduct?.type?.typeName || "-";
          count = 1;
          serialStart = item.card?.serialNumber || "-";
          serialEnd = item.card?.serialNumber || "-";
        }
      } else {
        // FWC logic
        category = item.card?.cardProduct?.category?.categoryName || "-";
        type = item.card?.cardProduct?.type?.typeName || "-";
        count = 1;
        serialStart = item.card?.serialNumber || "-";
        serialEnd = item.card?.serialNumber || "-";
      }
      
      const nominal = item.price || 0;
      const key = `${category}|${type}`;

      if (!combinations[key]) {
        combinations[key] = {
          category,
          type,
          serialStart: "-",
          serialEnd: "-",
          count: 0,
          nominal: 0,
        };
      }

      const combo = combinations[key];
      
      // Update serialStart and serialEnd
      if (serialStart !== "-") {
        if (combo.serialStart === "-" || serialStart < combo.serialStart) {
          combo.serialStart = serialStart;
        }
      }
      if (serialEnd !== "-") {
        if (combo.serialEnd === "-" || serialEnd > combo.serialEnd) {
          combo.serialEnd = serialEnd;
        }
      }

      combo.count += count;
      combo.nominal += nominal;
    });

    // Convert to table data with row numbers
    const tableData: any[] = Object.values(combinations).map(
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
    const totalCount = (Object.values(combinations) as any[]).reduce(
      (sum: number, combo: any) => sum + (combo.count || 0),
      0,
    ) as number;
    const totalNominal = (Object.values(combinations) as any[]).reduce(
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
    doc.text(isVoucher ? "LAPORAN TRANSAKSI HARIAN VOUCHER" : "LAPORAN TRANSAKSI HARIAN", pageWidth / 2, margin, {
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

    // Table
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
        body: tableData,
        foot: [
          [
            {
              content: isVoucher ? "Total Voucher" : "Total FWC",
              colSpan: 5,
              styles: { fontStyle: "bold", halign: "center" },
            },
            {
              content: totalCount.toString(),
              styles: { fontStyle: "bold", halign: "center" },
            },
            {
              content: `Rp ${new Intl.NumberFormat("id-ID").format(totalNominal)}`,
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
    const filename = isVoucher ? `Shift_Report_Voucher_${dateStr}.pdf` : `Shift_Report_FWC_${dateStr}.pdf`;
    doc.save(filename);
    setKeteranganGangguan("");
  };

  /* =====================
     EXCEL EXPORT FUNCTION
  ===================== */
  const generateExcelReport = async (items: any[]) => {
    const isVoucher = activeTab === "voucher";
    
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

    // Use axios instance which automatically includes token via interceptor
    let allProducts: any[] = [];
    try {
      const productsRes = await axios.get("/card/product");
      allProducts = productsRes.data?.data || [];
    } catch (error) {
      console.error("Error fetching card products:", error);
      alert("Gagal mengambil data card products");
      return;
    }

    // Initialize combinations based on program type
    const combinations: any = {};

    allProducts.forEach((product: any) => {
      const programType = product.programType || "FWC";
      
      // Filter by program type
      if (isVoucher && programType !== "VOUCHER") return;
      if (!isVoucher && programType !== "FWC") return;

      const category = product.category?.categoryName || "Unknown";
      const type = product.type?.typeName || "Unknown";
      const key = `${category}-${type}`;

      if (!combinations[key]) {
        combinations[key] = {
          category,
          type,
          serialStart: "-",
          serialEnd: "-",
          count: 0,
          nominal: 0,
        };
      }
    });

    // Merge with actual transaction data
    items.forEach((item: any) => {
      const programType = item.programType || (item.card?.cardProduct?.programType || "FWC");
      
      // Filter by program type
      if (isVoucher && programType !== "VOUCHER") return;
      if (!isVoucher && programType !== "FWC") return;

      // For voucher, handle bulk purchases
      let category: string;
      let type: string;
      let serialStart: string = "-";
      let serialEnd: string = "-";
      let count: number = 0;
      
      if (isVoucher) {
        const isBulkPurchase = item.bulkPurchaseItems && item.bulkPurchaseItems.length > 0;
        
        if (isBulkPurchase) {
          category = item.bulkPurchaseItems[0]?.card?.cardProduct?.category?.categoryName || "Unknown";
          type = item.bulkPurchaseItems[0]?.card?.cardProduct?.type?.typeName || "Unknown";
          count = item.bulkPurchaseItemsCount ?? item.bulkPurchaseItems?.length ?? 0;
          
          // Use firstSerialNumber and lastSerialNumber if available
          if (item.firstSerialNumber && item.lastSerialNumber) {
            serialStart = item.firstSerialNumber;
            serialEnd = item.lastSerialNumber;
          } else if (item.bulkPurchaseItems && item.bulkPurchaseItems.length > 0) {
            const serials = item.bulkPurchaseItems
              .map((bi: any) => bi.card?.serialNumber)
              .filter((s: string) => s)
              .sort();
            if (serials.length > 0) {
              serialStart = serials[0];
              serialEnd = serials[serials.length - 1];
            }
          }
        } else {
          category = item.card?.cardProduct?.category?.categoryName || "Unknown";
          type = item.card?.cardProduct?.type?.typeName || "Unknown";
          count = 1;
          serialStart = item.card?.serialNumber || "-";
          serialEnd = item.card?.serialNumber || "-";
        }
      } else {
        // FWC logic
        if (!item.card?.cardProduct) return;
        category = item.card.cardProduct.category?.categoryName || "Unknown";
        type = item.card.cardProduct.type?.typeName || "Unknown";
        count = 1;
        serialStart = item.card.serialNumber || "-";
        serialEnd = item.card.serialNumber || "-";
      }
      
      const key = `${category}-${type}`;
      const nominal = item.price || 0;

      if (combinations[key]) {
        const combo = combinations[key];
        
        // Update serialStart and serialEnd
        if (serialStart !== "-") {
          if (combo.serialStart === "-" || serialStart < combo.serialStart) {
            combo.serialStart = serialStart;
          }
        }
        if (serialEnd !== "-") {
          if (combo.serialEnd === "-" || serialEnd > combo.serialEnd) {
            combo.serialEnd = serialEnd;
          }
        }
        
        combo.count += count;
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
    const worksheet = workbook.addWorksheet(isVoucher ? "Laporan Transaksi Voucher" : "Laporan Transaksi");

    // Title
    worksheet.mergeCells("A1:G1");
    const titleCell = worksheet.getCell("A1");
    titleCell.value = isVoucher ? "LAPORAN TRANSAKSI HARIAN VOUCHER" : "LAPORAN TRANSAKSI HARIAN";
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

    // Table
    const tableData = Object.values(combinations);
    
    // Header
    const headerRow = worksheet.getRow(currentRow);
      headerRow.values = ["No", "Kategori", "Type", "Serial Start", "Serial End", "Jumlah", "Nominal"];
      headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF8D1231" },
      };
      headerRow.alignment = { horizontal: "center", vertical: "middle" };
      headerRow.height = 20;
      currentRow++;

      // Data
      tableData.forEach((combo: any, index: number) => {
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

      // Total
      const totalCount = tableData.reduce((sum: number, combo: any) => sum + combo.count, 0) as number;
      const totalNominal = tableData.reduce((sum: number, combo: any) => sum + combo.nominal, 0) as number;
      
      const totalRow = worksheet.getRow(currentRow);
      worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
      totalRow.getCell(1).value = isVoucher ? "Total Voucher" : "Total FWC";
      totalRow.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
      totalRow.getCell(6).value = totalCount;
      totalRow.getCell(7).value = totalNominal;
      totalRow.font = { bold: true };
      totalRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF0F0F0" },
      };
      totalRow.alignment = { horizontal: "center", vertical: "middle" };
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
    const filename = isVoucher ? `Shift_Report_Voucher_${dateStr}.xlsx` : `Shift_Report_FWC_${dateStr}.xlsx`;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    setKeteranganGangguan("");
  };

  /* =====================
     CSV EXPORT FUNCTION
  ===================== */
  const generateCSVReport = async (items: any[]) => {
    const isVoucher = activeTab === "voucher";
    
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

    // Use axios instance which automatically includes token via interceptor
    let allProducts: any[] = [];
    try {
      const productsRes = await axios.get("/card/product");
      allProducts = productsRes.data?.data || [];
    } catch (error) {
      console.error("Error fetching card products:", error);
      alert("Gagal mengambil data card products");
      return;
    }

    // Initialize combinations based on program type
    const combinations: any = {};

    allProducts.forEach((product: any) => {
      const programType = product.programType || "FWC";
      
      // Filter by program type
      if (isVoucher && programType !== "VOUCHER") return;
      if (!isVoucher && programType !== "FWC") return;
      
      const category = product.category?.categoryName || "Unknown";
      const type = product.type?.typeName || "Unknown";
      const key = `${category}-${type}`;

      if (!combinations[key]) {
        combinations[key] = {
          category,
          type,
          serialStart: "-",
          serialEnd: "-",
          count: 0,
          nominal: 0,
        };
      }
    });

    // Merge with actual transaction data
    items.forEach((item: any) => {
      const programType = item.programType || (item.card?.cardProduct?.programType || "FWC");
      
      // Filter by program type
      if (isVoucher && programType !== "VOUCHER") return;
      if (!isVoucher && programType !== "FWC") return;

      // For voucher, handle bulk purchases
      let category: string;
      let type: string;
      let serialStart: string = "-";
      let serialEnd: string = "-";
      let count: number = 0;
      
      if (isVoucher) {
        const isBulkPurchase = item.bulkPurchaseItems && item.bulkPurchaseItems.length > 0;
        
        if (isBulkPurchase) {
          category = item.bulkPurchaseItems[0]?.card?.cardProduct?.category?.categoryName || "Unknown";
          type = item.bulkPurchaseItems[0]?.card?.cardProduct?.type?.typeName || "Unknown";
          count = item.bulkPurchaseItemsCount ?? item.bulkPurchaseItems?.length ?? 0;
          
          // Use firstSerialNumber and lastSerialNumber if available
          if (item.firstSerialNumber && item.lastSerialNumber) {
            serialStart = item.firstSerialNumber;
            serialEnd = item.lastSerialNumber;
          } else if (item.bulkPurchaseItems && item.bulkPurchaseItems.length > 0) {
            const serials = item.bulkPurchaseItems
              .map((bi: any) => bi.card?.serialNumber)
              .filter((s: string) => s)
              .sort();
            if (serials.length > 0) {
              serialStart = serials[0];
              serialEnd = serials[serials.length - 1];
            }
          }
        } else {
          category = item.card?.cardProduct?.category?.categoryName || "Unknown";
          type = item.card?.cardProduct?.type?.typeName || "Unknown";
          count = 1;
          serialStart = item.card?.serialNumber || "-";
          serialEnd = item.card?.serialNumber || "-";
        }
      } else {
        // FWC logic
        if (!item.card?.cardProduct) return;
        category = item.card.cardProduct.category?.categoryName || "Unknown";
        type = item.card.cardProduct.type?.typeName || "Unknown";
        count = 1;
        serialStart = item.card.serialNumber || "-";
        serialEnd = item.card.serialNumber || "-";
      }
      
      const key = `${category}-${type}`;
      const nominal = item.price || 0;

      if (combinations[key]) {
        const combo = combinations[key];
        
        // Update serialStart and serialEnd
        if (serialStart !== "-") {
          if (combo.serialStart === "-" || serialStart < combo.serialStart) {
            combo.serialStart = serialStart;
          }
        }
        if (serialEnd !== "-") {
          if (combo.serialEnd === "-" || serialEnd > combo.serialEnd) {
            combo.serialEnd = serialEnd;
          }
        }
        
        combo.count += count;
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
    let csv = isVoucher ? "LAPORAN TRANSAKSI HARIAN VOUCHER\n" : "LAPORAN TRANSAKSI HARIAN\n";
    csv += `Petugas: ${operatorName}, Tanggal: ${purchaseDateStr}, Shift: ${shiftDateStr}\n\n`;

    // Table
    const tableData = Object.values(combinations);
    csv += "No,Kategori,Type,Serial Start,Serial End,Jumlah,Nominal\n";
    
    tableData.forEach((combo: any, index: number) => {
      csv += `${index + 1},${combo.category},${combo.type},${combo.serialStart},${combo.serialEnd},${combo.count},${combo.nominal}\n`;
    });

    const totalCount = tableData.reduce((sum: number, combo: any) => sum + combo.count, 0);
    const totalNominal = tableData.reduce((sum: number, combo: any) => sum + combo.nominal, 0);
    csv += `,,,,${isVoucher ? "Total Voucher" : "Total FWC"},${totalCount},${totalNominal}\n\n`;

    // Keterangan Gangguan
    if (keteranganGangguan) {
      csv += `\nKeterangan Kejadian Gangguan:\n"${keteranganGangguan}"\n`;
    }

    // Download
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0].replace(/-/g, "");
    const filename = isVoucher ? `Shift_Report_Voucher_${dateStr}.csv` : `Shift_Report_FWC_${dateStr}.csv`;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    setKeteranganGangguan("");
  };

  /* =====================
     IMAGE EXPORT FUNCTION
  ===================== */
  const generateImageReport = async (items: any[]) => {
    const isVoucher = activeTab === "voucher";
    
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

    // Use axios instance which automatically includes token via interceptor
    let allProducts: any[] = [];
    try {
      const productsRes = await axios.get("/card/product");
      allProducts = productsRes.data?.data || [];
    } catch (error) {
      console.error("Error fetching card products:", error);
      alert("Gagal mengambil data card products");
      return;
    }

    // Initialize combinations based on program type
    const combinations: any = {};

    allProducts.forEach((product: any) => {
      const programType = product.programType || "FWC";
      
      // Filter by program type
      if (isVoucher && programType !== "VOUCHER") return;
      if (!isVoucher && programType !== "FWC") return;

      const category = product.category?.categoryName || "Unknown";
      const type = product.type?.typeName || "Unknown";
      const key = `${category}-${type}`;

      if (!combinations[key]) {
        combinations[key] = {
          category,
          type,
          serialStart: "-",
          serialEnd: "-",
          count: 0,
          nominal: 0,
        };
      }
    });

    // Merge with actual transaction data
    items.forEach((item: any) => {
      const programType = item.programType || (item.card?.cardProduct?.programType || "FWC");
      
      // Filter by program type
      if (isVoucher && programType !== "VOUCHER") return;
      if (!isVoucher && programType !== "FWC") return;

      // For voucher, handle bulk purchases
      let category: string;
      let type: string;
      let serialStart: string = "-";
      let serialEnd: string = "-";
      let count: number = 0;
      
      if (isVoucher) {
        const isBulkPurchase = item.bulkPurchaseItems && item.bulkPurchaseItems.length > 0;
        
        if (isBulkPurchase) {
          category = item.bulkPurchaseItems[0]?.card?.cardProduct?.category?.categoryName || "Unknown";
          type = item.bulkPurchaseItems[0]?.card?.cardProduct?.type?.typeName || "Unknown";
          count = item.bulkPurchaseItemsCount ?? item.bulkPurchaseItems?.length ?? 0;
          
          // Use firstSerialNumber and lastSerialNumber if available
          if (item.firstSerialNumber && item.lastSerialNumber) {
            serialStart = item.firstSerialNumber;
            serialEnd = item.lastSerialNumber;
          } else if (item.bulkPurchaseItems && item.bulkPurchaseItems.length > 0) {
            const serials = item.bulkPurchaseItems
              .map((bi: any) => bi.card?.serialNumber)
              .filter((s: string) => s)
              .sort();
            if (serials.length > 0) {
              serialStart = serials[0];
              serialEnd = serials[serials.length - 1];
            }
          }
        } else {
          category = item.card?.cardProduct?.category?.categoryName || "Unknown";
          type = item.card?.cardProduct?.type?.typeName || "Unknown";
          count = 1;
          serialStart = item.card?.serialNumber || "-";
          serialEnd = item.card?.serialNumber || "-";
        }
      } else {
        // FWC logic
        if (!item.card?.cardProduct) return;
        category = item.card.cardProduct.category?.categoryName || "Unknown";
        type = item.card.cardProduct.type?.typeName || "Unknown";
        count = 1;
        serialStart = item.card.serialNumber || "-";
        serialEnd = item.card.serialNumber || "-";
      }
      
      const key = `${category}-${type}`;
      const nominal = item.price || 0;

      if (combinations[key]) {
        const combo = combinations[key];
        
        // Update serialStart and serialEnd
        if (serialStart !== "-") {
          if (combo.serialStart === "-" || serialStart < combo.serialStart) {
            combo.serialStart = serialStart;
          }
        }
        if (serialEnd !== "-") {
          if (combo.serialEnd === "-" || serialEnd > combo.serialEnd) {
            combo.serialEnd = serialEnd;
          }
        }
        
        combo.count += count;
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
        <h2 style="text-align: center; margin: 0; font-size: 24px; color: rgb(141, 18, 49); font-family: Arial, sans-serif;">${isVoucher ? "LAPORAN TRANSAKSI HARIAN VOUCHER" : "LAPORAN TRANSAKSI HARIAN"}</h2>
        <div style="background: rgb(245, 245, 245); padding: 15px; margin-top: 15px; border-radius: 5px; text-align: center; color: rgb(0, 0, 0); font-family: Arial, sans-serif;">
          <strong style="color: rgb(0, 0, 0);">Petugas:</strong> ${operatorName} &nbsp;|&nbsp; 
          <strong style="color: rgb(0, 0, 0);">Tanggal:</strong> ${purchaseDateStr} &nbsp;|&nbsp; 
          <strong style="color: rgb(0, 0, 0);">Shift:</strong> ${shiftDateStr}
        </div>
      </div>
    `;

    // Table
    const tableData = Object.values(combinations);
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

    tableData.forEach((combo: any, index: number) => {
      html += `
        <tr>
          <td style="border: 1px solid rgb(221, 221, 221); padding: 10px; text-align: center; color: rgb(0, 0, 0);">${index + 1}</td>
          <td style="border: 1px solid rgb(221, 221, 221); padding: 10px; text-align: center; color: rgb(0, 0, 0);">${escapeHtml(combo.category)}</td>
          <td style="border: 1px solid rgb(221, 221, 221); padding: 10px; text-align: center; color: rgb(0, 0, 0);">${escapeHtml(combo.type)}</td>
          <td style="border: 1px solid rgb(221, 221, 221); padding: 10px; text-align: center; color: rgb(0, 0, 0);">${escapeHtml(combo.serialStart)}</td>
          <td style="border: 1px solid rgb(221, 221, 221); padding: 10px; text-align: center; color: rgb(0, 0, 0);">${escapeHtml(combo.serialEnd)}</td>
          <td style="border: 1px solid rgb(221, 221, 221); padding: 10px; text-align: center; color: rgb(0, 0, 0);">${combo.count}</td>
          <td style="border: 1px solid rgb(221, 221, 221); padding: 10px; text-align: center; color: rgb(0, 0, 0);">Rp ${new Intl.NumberFormat("id-ID").format(combo.nominal)}</td>
        </tr>
      `;
    });

    const totalCount = tableData.reduce((sum: number, combo: any) => sum + combo.count, 0) as number;
    const totalNominal = tableData.reduce((sum: number, combo: any) => sum + combo.nominal, 0) as number;

    html += `
        <tr style="background: rgb(240, 240, 240); font-weight: bold;">
          <td colspan="5" style="border: 1px solid rgb(221, 221, 221); padding: 10px; text-align: center; color: rgb(0, 0, 0);">${isVoucher ? "Total Voucher" : "Total FWC"}</td>
          <td style="border: 1px solid rgb(221, 221, 221); padding: 10px; text-align: center; color: rgb(0, 0, 0);">${totalCount}</td>
          <td style="border: 1px solid rgb(221, 221, 221); padding: 10px; text-align: center; color: rgb(0, 0, 0);">Rp ${new Intl.NumberFormat("id-ID").format(totalNominal)}</td>
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
              const filename = isVoucher ? `Shift_Report_Voucher_${dateStr}.png` : `Shift_Report_FWC_${dateStr}.png`;
              link.download = filename;
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
            stationIds={stationIds}
            purchasedDate={purchasedDate}
            shiftDate={shiftDate}
            cardCategoryIds={cardCategoryIds}
            cardTypeIds={cardTypeIds}
            employeeTypeIds={employeeTypeIds}
            onStationChange={(v) => {
              setStationIds(v);
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
              setCardCategoryIds(v);
              setCardTypeIds(undefined);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            onCardTypeChange={(v) => {
              setCardTypeIds(v);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            onEmployeeTypeChange={(v) => {
              setEmployeeTypeIds(v);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            onReset={resetFilter}
            onExportPDF={openTransactionExportModal}
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
              onDelete={() => {
                fetchData();
                loadDeletedPurchases();
              }}
              canEdit
              canDelete={true}
            />
          ) : (
            <TransactionTableVoucher
              data={voucherData}
              loading={loading}
              pagination={pagination}
              onPageChange={(page) => setPagination((p) => ({ ...p, page }))}
              onDelete={() => {
                fetchData();
                loadDeletedPurchases();
              }}
              canDelete={true}
            />
          )}

          {/* Riwayat Penghapusan - sama seperti di Redeem */}
          {/* {activeTab === "fwc" || activeTab === "voucher" ? (
            <DeletedPurchaseTable
              data={deletedPurchases}
              isLoading={isLoadingDeleted}
              noDataMessage="Tidak ada data yang dihapus"
              currentPage={deletedPagination.page}
              totalPages={deletedPagination.totalPages}
              totalCount={deletedPagination.total}
              onPageChange={setDeletedPage}
            />
          ) : null} */}
        </>
      )}

      {/* Laporan Transaksi Export Modal */}
      {showTransactionExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Laporan Transaksi</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Format Export
              </label>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
                value={transactionExportFormat}
                onChange={(e) =>
                  setTransactionExportFormat(e.target.value as "pdf" | "excel" | "csv" | "image")
                }
              >
                <option value="pdf">PDF</option>
                <option value="excel">Excel (.xlsx)</option>
                <option value="csv">CSV</option>
                <option value="image">Image (.png)</option>
              </select>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowTransactionExportModal(false)}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  const items = transactionExportItems;
                  setShowTransactionExportModal(false);
                  switch (transactionExportFormat) {
                    case "pdf":
                      generateTransactionPDF(items);
                      break;
                    case "excel":
                      generateTransactionExcel(items);
                      break;
                    case "csv":
                      generateTransactionCSV(items);
                      break;
                    case "image":
                      await generateTransactionImage(items);
                      break;
                  }
                }}
                className="px-4 py-2 text-sm bg-[#8D1231] text-white hover:bg-[#73122E] rounded-md"
              >
                Export {transactionExportFormat.toUpperCase()}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal (Laporan Shift) */}
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
