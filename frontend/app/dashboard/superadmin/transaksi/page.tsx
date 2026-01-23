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

type TabType = "fwc" | "voucher";

/* ======================
   HELPERS
====================== */
const formatDateID = (date?: string) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("id-ID");
};

export default function TransactionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  /* =====================
     TAB STATE
  ===================== */
  const [activeTab, setActiveTab] = useState<TabType>("fwc");

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
  const [voucherData, setVoucherData] = useState<any[]>([]); // dummy dulu

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

    console.log("Fetching purchases with params:", params);

    try {
      if (activeTab === "fwc") {
        const res = await getPurchases(params);
        console.log("Purchases response:", res);
        if (res.success && res.data) {
          setFWCData(res.data.items);
          setPagination(res.data.pagination);
        }
      }

      if (activeTab === "voucher") {
        // 🔥 DUMMY (endpoint belum ada)
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
    searchParams.get("refresh"), // Trigger refetch saat refresh param berubah
  ]);

  /* =====================
     HANDLERS
  ===================== */
  const handleAddPurchased = () => {
    if (activeTab === "voucher") {
      router.push("/dashboard/superadmin/transaksi/voucher/create");
    } else {
      router.push("/dashboard/superadmin/transaksi/create");
    }
  };

  const handleAddMember = () => {
    router.push("/dashboard/superadmin/membership/create");
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

    autoTable(doc, {
      head: [
        [
          "Customer Name",
          "Identity Number",
          "Card Category",
          "Card Type",
          "Serial Number",
          "Reference EDC",
          "Price",
          "Purchase Date",
          "Shift Date",
          "Operator",
          "Station",
        ],
      ],
      body: items.map((item: any) => [
        item.member?.name ?? "-",
        item.member?.identityNumber ?? "-",
        item.card?.cardProduct?.category?.categoryName ?? "-",
        item.card?.cardProduct?.type?.typeName ?? "-",
        item.card?.serialNumber ?? "-",
        item.edcReferenceNumber ?? "-",
        `Rp ${item.price?.toLocaleString("id-ID") ?? "-"}`,
        formatDateID(item.purchaseDate),
        formatDateID(item.shiftDate),
        item.operator?.fullName ?? "-",
        item.station?.stationName ?? "-",
      ]),
      headStyles: {
        fillColor: [141, 18, 49],
        textColor: 255,
      },
    });

    doc.save("transaction-fwc.pdf");
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
      />

      <TransactionFilter
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          resetFilter();
        }}
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
      />

      {activeTab === "fwc" ? (
        <TransactionTableFWC
          data={fwcData}
          loading={loading}
          pagination={pagination}
          onPageChange={(page) => setPagination((p) => ({ ...p, page }))}
          onEdit={(id) =>
            router.push(`/dashboard/superadmin/transaksi/edit/${id}`)
          }
          canEdit
          canDelete
        />
      ) : (
        <TransactionTableVoucher
          data={voucherData}
          loading={loading}
          pagination={pagination}
          onPageChange={(page) => setPagination((p) => ({ ...p, page }))}
        />
      )}
    </div>
  );
}
