"use client";

import { getStations } from "@/lib/services/user.service";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import TransactionToolbar from "./components/TransactionToolbar";
import TransactionFilter from "./components/TransactionFilter";
import TransactionTable from "./components/TransactionTable";

import { getPurchases } from "@/lib/services/purchase.service";
// import { exportPurchasesPDF } from "@/lib/services/purchase.service";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* ======================
   TYPES
====================== */
interface Purchase {
  id: string;
  purchaseDate: string;
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

export default function TransactionPage() {
  const router = useRouter();

  /* =====================
     FILTER STATE
  ===================== */
  const [search, setSearch] = useState("");
  const [type, setType] = useState<"ALL" | "KAI">("ALL");
  const [stationId, setStationId] = useState<string | undefined>();
  const [purchasedDate, setPurchasedDate] = useState<string | undefined>();
  const [shiftDate, setShiftDate] = useState<string | undefined>();
  const [stations, setStations] = useState([]);
  useEffect(() => {
    getStations().then((res) => setStations(res.data));
  }, []);

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
     FETCH
  ===================== */
  const fetchPurchases = async () => {
    setLoading(true);

    const res = await getPurchases({
      page: pagination.page,
      limit: pagination.limit,
      search,
      stationId,

      // 🔥 FIX: mapping UI → API
      startDate: purchasedDate,
      endDate: shiftDate,
    });

    if (res.success && res.data) {
      setData(res.data.items);
      setPagination(res.data.pagination);
    }

    setLoading(false);
  };

  // 🔥 RESET FILTER SAAT MASUK HALAMAN TRANSAKSI
  useEffect(() => {
    setSearch("");
    setStationId(undefined);
    setPurchasedDate(undefined);
    setShiftDate(undefined);

    setPagination((p) => ({ ...p, page: 1 }));

    fetchPurchases();
  }, []);

  /* =====================
     EFFECT
  ===================== */
  useEffect(() => {
    fetchPurchases();
  }, [search, type, stationId, purchasedDate, shiftDate, pagination.page]);

  /* =====================
     HANDLER
  ===================== */
  const handleResetFilter = () => {
    setType("ALL");
    setStationId(undefined);
    setPurchasedDate(undefined);
    setShiftDate(undefined);
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const handleAddPurchased = () => {
    router.push("/dashboard/superadmin/transaksi/create");
  };

  const handleExportPDF = async () => {
    try {
      const res = await getPurchases({
        search,
        stationId,
        startDate: purchasedDate,
        endDate: shiftDate,
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

      /* ===== HEADER ===== */
      doc.setFontSize(14);
      doc.text("Transaction Report", 14, 15);

      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString("id-ID")}`, 14, 22);

      /* ===== TABLE (FIGMA BASED) ===== */
      autoTable(doc, {
        startY: 28,

        head: [
          [
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
          ],
        ],

        body: items.map((item: any) => [
          item.card?.name ?? "-",
          item.card?.identityNumber ?? "-",
          item.card?.cardProduct?.category?.categoryName ?? "-",
          item.card?.cardProduct?.type?.typeName ?? "-",
          item.card?.serialNumber ?? "-",
          item.edcReferenceNumber ?? "-",
          `Rp ${item.price?.toLocaleString("id-ID") ?? "-"}`,
          item.purchaseDate
            ? new Date(item.purchaseDate).toLocaleDateString("id-ID")
            : "-",
          item.shiftDate
            ? new Date(item.shiftDate).toLocaleDateString("id-ID")
            : "-",
          item.operator?.fullName ?? "-",
          item.station?.stationName ?? "-",
        ]),

        styles: {
          fontSize: 7,
          cellPadding: 1.5,
          valign: "middle",
        },

        headStyles: {
          fillColor: [141, 18, 49], // maroon figma
          textColor: 255,
          halign: "center",
          fontStyle: "bold",
          fontSize: 7,
        },

        columnStyles: {
          0: { cellWidth: 26 }, // Customer
          1: { cellWidth: 28 }, // NIK
          2: { cellWidth: 20 }, // Category
          3: { cellWidth: 18 }, // Type
          4: { cellWidth: 22 }, // Serial
          5: { cellWidth: 26 }, // EDC Ref
          6: { cellWidth: 18 }, // Price
          7: { cellWidth: 18 }, // Purchase Date
          8: { cellWidth: 18 }, // Shift Date
          9: { cellWidth: 22 }, // Operator
          10: { cellWidth: 20 }, // Station
        },
      });

      doc.save("transaction-report.pdf");
    } catch (err) {
      console.error(err);
      alert("Gagal export PDF");
    }
  };

  /* =====================
     RENDER
  ===================== */
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <TransactionToolbar
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPagination((p) => ({ ...p, page: 1 }));
        }}
        onAdd={handleAddPurchased}
      />

      {/* FILTER */}
      <TransactionFilter
        type={type}
        stationId={stationId}
        purchasedDate={purchasedDate}
        shiftDate={shiftDate}
        stations={stations} // ⬅️ TAMBAH DI SINI
        onTypeChange={(v) => {
          setType(v);
          setPagination((p) => ({ ...p, page: 1 }));
        }}
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
        onReset={handleResetFilter}
        onExportPDF={handleExportPDF} // 🔥 INI YANG HILANG
      />

      {/* TABLE */}
      <TransactionTable
        data={data}
        loading={loading}
        pagination={pagination}
        type={type} // ⬅️ TAMBAHKAN INI
        onPageChange={(page) => setPagination((p) => ({ ...p, page }))}
      />
    </div>
  );
}
