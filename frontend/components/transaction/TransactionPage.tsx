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
     RESET FILTER
  ===================== */
  const resetFilter = () => {
    setStationId(undefined);
    setPurchasedDate(undefined);
    setShiftDate(undefined);
    setCardCategoryId(undefined);
    setCardTypeId(undefined);
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
    };

    try {
      if (activeTab === "fwc") {
        const res = await getPurchases(params);
        if (res.success && res.data) {
          setFWCData(res.data.items);
          setPagination(res.data.pagination);
        }
      }

      if (activeTab === "voucher") {
        setVoucherData([]);
        setPagination((p) => ({
          ...p,
          totalPages: 1,
          total: 0,
        }));
      }
    } finally {
      setLoading(false);
    }
  };

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
    router.push(`${basePath}/membership/create`);
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

    // Create all possible category-type combinations
    const allCombinations: any = {};
    productsData.data?.forEach((product: any) => {
      const category = product.category?.categoryName || "-";
      const type = product.type?.typeName || "-";
      const key = `${category}|${type}`;

      if (!allCombinations[key]) {
        allCombinations[key] = {
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

    // Update combinations with actual transaction data
    items.forEach((item: any) => {
      const category = item.card?.cardProduct?.category?.categoryName || "-";
      const type = item.card?.cardProduct?.type?.typeName || "-";
      const key = `${category}|${type}`;

      if (!allCombinations[key]) {
        allCombinations[key] = {
          category,
          type,
          serialStart: item.card?.serialNumber || "-",
          serialEnd: item.card?.serialNumber || "-",
          count: 0,
          nominal: 0,
        };
      }

      if (allCombinations[key].count === 0) {
        allCombinations[key].serialStart = item.card?.serialNumber || "-";
      }

      allCombinations[key].count += 1;
      allCombinations[key].nominal += item.price || 0;
      allCombinations[key].serialEnd = item.card?.serialNumber || "-";
    });

    // Convert to table data with row numbers
    const tableData: any[] = Object.values(allCombinations).map(
      (combo: any, index: number) => [
        index + 1, // No
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
    const totalCount = (Object.values(allCombinations) as any[]).reduce(
      (sum: number, combo: any) => sum + (combo.count || 0),
      0,
    ) as number;
    const totalNominal = (Object.values(allCombinations) as any[]).reduce(
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

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Laporan Transaksi Harian", pageWidth / 2, margin, {
      align: "center",
    });

    const operatorName = items[0]?.operator?.fullName || "-";

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
            content: "Total",
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
      footStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontSize: 8,
        lineWidth: 0.2,
        lineColor: [200, 200, 200],
      },
      columnStyles: {
        0: { cellWidth: 10 }, // No
        1: { cellWidth: 25 }, // Category
        2: { cellWidth: 25 }, // Type
        3: { cellWidth: 28 }, // Serial Start
        4: { cellWidth: 28 }, // Serial End
        5: { cellWidth: 22 }, // Jumlah
        6: { cellWidth: "auto" }, // Nominal
      },
      theme: "grid",
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(9);

    const col1X = margin;
    const col2X = pageWidth - margin - 50;

    doc.text("PSAC", col1X, finalY);
    doc.text("SPV", col2X, finalY);

    doc.line(col1X, finalY + 30, col1X + 50, finalY + 30);
    doc.line(col2X, finalY + 30, col2X + 50, finalY + 30);

    doc.text(operatorName, col1X, finalY + 35);

    const today = new Date();
    const dateStr = today.toISOString().split("T")[0].replace(/-/g, "");
    doc.save(`Shift_Report_FWC_${dateStr}.pdf`);
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
            />
          )}
        </>
      )}
    </div>
  );
}
