"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import InboxFilter from "./components/InboxFilter";
import InboxList from "./components/InboxList";
import { InboxItemModel, InboxStatus } from "@/lib/services/inbox";

// 🔥 FIREBASE IMPORT
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase";

import { fwcNotedService } from "./fwc/fwc.service";
import { voucherNotedService } from "./voucher/voucher.service";

type Product = "FWC" | "VOUCHER";

const getNotedService = (product: Product) => {
  return product === "FWC" ? fwcNotedService : voucherNotedService;
};

export default function InboxPage() {
  // =========================
  // STATE DATA & LOADING
  // =========================
  const router = useRouter();

  const [product, setProduct] = useState<Product | "">("");
  const [items, setItems] = useState<InboxItemModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<any>({});

  /**
   * FETCH
   */
  const fetchInbox = useCallback(async () => {
    if (!product) return;

    try {
      setLoading(true);

      const service = getNotedService(product);

      const result = await service.list({
        page: 1,
        limit: 10,
      });

      const data =
        result?.found?.data ??
        result?.data ??
        result;

      const rawItems = Array.isArray(data?.items)
        ? data.items
        : [];

      const mapped: InboxItemModel[] = rawItems.map(
        (item: any) => {
          const date = new Date(item.movementAt);

          let status: InboxStatus = "PENDING";
          const damaged =
            item.damagedSerialNumbers?.length ?? 0;
          const lost =
            item.lostSerialNumbers?.length ?? 0;

          if (item.validationStatus === "COMPLETED") {
            status =
              damaged > 0 || lost > 0
                ? "ISSUE"
                : "COMPLETED";
          }

          return {
            id: item.id,
            sender: { fullName: item.createdByName || "-" },
            status,
            title: `Stock Out - ${item.stationName || "-"}`,
            message: item.note || "Menunggu validasi",
            date_label: date.toLocaleDateString("id-ID", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            }),
            time_label:
              date.toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
              }) + " WIB",
            raw: item,
          };
        }
      );

      setItems(mapped);
    } catch (error) {
      console.error("❌ FETCH ERROR:", error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [product]);

  /**
   * AUTO LOAD
   */
  useEffect(() => {
    if (product) {
      fetchInbox();
    }
  }, [product, fetchInbox]);

  /**
   * FIREBASE TRIGGER (tetap)
   */
  useEffect(() => {
    if (!product) return;

    const db = getFirestoreDb();
    if (!db) return;

    const q = query(
      collection(db, "inbox_notifications"),
      where("role", "==", "SUPERVISOR"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, () => {
      fetchInbox();
    });

    return () => unsub();
  }, [fetchInbox, product]);

  const handleAddNote = () => {
    router.push("/dashboard/supervisor/noted/formnoted");
  };

  const handleOpenDetail = (item: InboxItemModel) => {
   router.push(
  `/dashboard/supervisor/noted/formnoted?id=${item.id}&product=${product}`
);
  };

  return (
    <div className="flex flex-col gap-4 min-h-screen p-3 sm:p-6">
      <h1 className="text-lg sm:text-xl font-semibold">
        Stock In Validation
      </h1>

      {/* PRODUCT SELECT */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <span className="text-sm font-medium whitespace-nowrap text-gray-700">
          Pilih Jenis Produk:
        </span>

        <select
          value={product}
          onChange={(e) =>
            setProduct(e.target.value as Product | "")
          }
          className="
            h-9 w-full sm:w-44
            rounded-md border
            px-3 text-sm font-semibold
            text-[#8D1231]
            bg-red-50
            border-[#8D1231]
            focus:outline-none
            focus:ring-2
            focus:ring-[#8D1231]
          "
        >
          <option value="">Pilih Produk</option>
          <option value="FWC">FWC</option>
          <option value="VOUCHER">VOUCHER</option>
        </select>
    </div>


      {/* FILTER + LIST */}
      {product && (
        <>
          <div className="rounded-xl border bg-white p-3 sm:p-4 shadow-sm">
            <InboxFilter
              onFilter={setFilters}
              onAddNote={handleAddNote}
            />
          </div>

          <div className="rounded-xl border bg-white shadow-sm flex flex-col min-h-[420px] max-h-[70vh]">
            <div className="flex-1 overflow-y-auto">
              <InboxList
                items={items}
                loading={loading}
                onClickItem={handleOpenDetail}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
function deriveCardCondition(message: any) {
  throw new Error("Function not implemented.");
}
