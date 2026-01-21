"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getPurchases } from "@/lib/services/purchase.service";

import TransactionToolbar from "./components/TransactionToolbar";
import TransactionFilter from "./components/TransactionFilter";
import TransactionTable from "./components/TransactionTable";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* ======================
   TYPES
====================== */
interface Purchase {
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

/* ======================
   HELPERS
====================== */
const formatDateID = (date?: string) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("id-ID");
};

export default function TransactionPage() {
  const router = useRouter();

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
     DATA STATE
  ===================== */
  const [data, setData] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    totalPages: 1,
    total: 0,
  });

  /* =====================
     FETCH PURCHASES
  ===================== */
  const fetchPurchases = async () => {
    setLoading(true);

    const params: any = {
      page: pagination.page,
      limit: pagination.limit,
      search,
    };

    if (stationId) params.stationId = stationId;
    if (purchasedDate) params.startDate = purchasedDate;
    if (shiftDate) params.endDate = shiftDate;
    if (cardCategoryId) params.categoryId = cardCategoryId;
    if (cardTypeId) params.typeId = cardTypeId;

    const res = await getPurchases(params);

    if (res.success && res.data) {
      setData(res.data.items);
      setPagination(res.data.pagination);
    }

    setLoading(false);
  };

  /* =====================
     INIT
  ===================== */
  useEffect(() => {
    fetchPurchases();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* =====================
     AUTO FETCH
  ===================== */
  useEffect(() => {
    fetchPurchases();
  }, [
    search,
    stationId,
    purchasedDate,
    shiftDate,
    cardCategoryId,
    cardTypeId,
    pagination.page,
  ]);

  /* =====================
     HANDLERS
  ===================== */
  const handleResetFilter = () => {
    setStationId(undefined);
    setPurchasedDate(undefined);
    setShiftDate(undefined);
    setCardCategoryId(undefined);
    setCardTypeId(undefined);
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const handleAddPurchased = () => {
    router.push("/dashboard/superadmin/transaksi/create");
  };

  /* =====================
     EXPORT PDF (FINAL)
  ===================== */
  const handleExportPDF = async () => {
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
    const firstItem = items[0];

    /* ===== REPORT INFO ===== */
    const reportInfo = {
      station: stationId
        ? firstItem?.station?.stationName ?? "-"
        : "All Station",
      category: cardCategoryId
        ? firstItem?.card?.cardProduct?.category?.categoryName ?? "-"
        : "All Category",
      type: cardTypeId
        ? firstItem?.card?.cardProduct?.type?.typeName ?? "-"
        : "All Type",
      dateRange:
        purchasedDate || shiftDate
          ? `${formatDateID(purchasedDate)} s/d ${formatDateID(shiftDate)}`
          : "All Dates",
    };

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();

    /* ===== HEADER ===== */
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Transaction Report", pageWidth / 2, 16, { align: "center" });

    /* ===== REPORT INFORMATION ===== */
    doc.setFontSize(11);
    doc.text("Report Information", 14, 26);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    const reportDate = new Date().toLocaleString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const infoY = 32;
    const gap = 5;

    doc.text(`Report Date   : ${reportDate} WIB`, 14, infoY);
    doc.text(`Date Period   : ${reportInfo.dateRange}`, 14, infoY + gap);
    doc.text(`Station       : ${reportInfo.station}`, 14, infoY + gap * 2);
    doc.text(`Card Category : ${reportInfo.category}`, 14, infoY + gap * 3);
    doc.text(`Card Type     : ${reportInfo.type}`, 14, infoY + gap * 4);

    // divider maroon
    doc.setDrawColor(141, 18, 49);
    doc.line(14, infoY + gap * 5 + 2, pageWidth - 14, infoY + gap * 5 + 2);

    /* ===== TABLE ===== */
    autoTable(doc, {
      startY: infoY + gap * 6 + 4,
      head: [[
        "Customer Name",
        "NIK",
        "Card Category",
        "Card Type",
        "Serial Number",
        "Reference EDC",
        "FWC Price",
        "Purchase Date",
        "Shift Date",
        "Operator Name",
        "Station",
      ]],
      body: items.map((item: any) => [
        item.member?.name ?? "-",
        item.member?.identityNumber ?? "-",
        item.card?.cardProduct?.category?.categoryName ?? "-",
        item.card?.cardProduct?.type?.typeName ?? "-",
        item.card?.serialNumber ?? "-",
        item.edcReferenceNumber ?? "-",
        `Rp ${item.price?.toLocaleString("id-ID") ?? "-"}`,
        formatDateID(item.purchaseDate),
        formatDateID(item.shiftDate ?? undefined),
        item.operator?.fullName ?? "-",
        item.station?.stationName ?? "-",
      ]),
      styles: {
        font: "helvetica",
        fontSize: 8,
        cellPadding: 3,
        valign: "middle",
      },
      headStyles: {
        fillColor: [141, 18, 49], // MAROON
        textColor: 255,
        fontStyle: "bold",
        halign: "center",
      },
      columnStyles: {
        6: { halign: "right" }, // price right align
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    });

    doc.save("transaction-report.pdf");
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
      />

      <TransactionFilter
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
        onReset={handleResetFilter}
        onExportPDF={handleExportPDF}
      />

      <TransactionTable
        data={data}
        loading={loading}
        pagination={pagination}
        onPageChange={(page) =>
          setPagination((p) => ({ ...p, page }))
        }
        onEdit={(id) =>
          router.push(`/dashboard/superadmin/transaksi/${id}/edit`)
        }
        canEdit
        canDelete
      />
    </div>
  );
}
