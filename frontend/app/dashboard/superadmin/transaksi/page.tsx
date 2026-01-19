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

      // 🔽 mapping dari UI ke API
      startDate: purchasedDate,
      endDate: shiftDate,

      // contoh mapping type
      // typeId: type === 'KAI' ? 'KAI_UUID' : undefined,
    });

    if (res.success && res.data) {
      setData(res.data.items);
      setPagination(res.data.pagination);
    }

    setLoading(false);
  };

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
      // 🔥 ambil data pakai filter yang sama (tanpa pagination kecil)
      const res = await getPurchases({
        search,
        stationId,
        startDate: purchasedDate,
        endDate: shiftDate,
        limit: 1000, // ambil banyak biar semua ke-export
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

      // ===== HEADER =====
      doc.setFontSize(14);
      doc.text("Transaction Report", 14, 15);

      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString("id-ID")}`, 14, 22);

      // ===== TABLE =====
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
            "Price",
            "Purchase Date",
            "Shift Date",
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
          item.purchaseDate
            ? new Date(item.purchaseDate).toLocaleDateString("id-ID")
            : "-",
          item.shiftDate
            ? new Date(item.shiftDate).toLocaleDateString("id-ID")
            : "-",
          item.station?.stationName ?? "-",
        ]),
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [141, 18, 49], // maroon
          textColor: 255,
          halign: "center",
        },
        bodyStyles: {
          valign: "middle",
        },
      });

      // ===== SAVE =====
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
