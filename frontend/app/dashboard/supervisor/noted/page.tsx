"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import InboxFilter from "./components/InboxFilter";
import InboxList from "./components/InboxList";
import api from "@/lib/axios";
import { InboxItemModel, InboxStatus } from "@/lib/services/inbox";

export default function InboxPage() {
  const router = useRouter();

  // =========================
  // STATE
  // =========================
  const [items, setItems] = useState<InboxItemModel[]>([]);
  const [loading, setLoading] = useState(true);

  /* =========================
     FETCH STOCK OUT LIST
  ========================= */
  const fetchInbox = useCallback(async () => {
    try {
      setLoading(true);

      const params = {
        page: 1,
        limit: 10,
      };

      const res = await api.get("/stock/out", {
        params,
        validateStatus: (status) => status < 500, // allow 422
      });

      /**
       * Backend kadang return:
       *  - res.data.data
       *  - res.data.found.data
       *  - res.data
       */
      const data = res.data?.found?.data ?? res.data?.data ?? res.data;
      const rawItems = Array.isArray(data?.items) ? data.items : [];

      const mappedItems: InboxItemModel[] = rawItems.map((item: any) => {
        const date = new Date(item.movementAt);

        // =====================
        // ✅ STATUS MAPPING FINAL
        // =====================
        let status: InboxStatus = "PENDING";

        const damagedCount = item.damagedSerialNumbers?.length ?? 0;
        const lostCount = item.lostSerialNumbers?.length ?? 0;
        const hasIssue = damagedCount > 0 || lostCount > 0;

        /**
         * PRIORITY:
         * 1. Jika backend sudah kirim validationStatus → pakai itu
         * 2. Jika belum ada → fallback dari data issue
         */
        if (item.validationStatus === "COMPLETED") {
          status = hasIssue ? "ISSUE" : "COMPLETED";
        } else if (item.validationStatus === "ISSUE") {
          status = "ISSUE";
        } else {
          // belum divalidasi
          status = "PENDING";
        }

        return {
          id: item.id,

          sender: {
            fullName: item.createdByName || "-",
          },

          status,

          title: `Stock Out - ${item.stationName || "-"}`,
          message: item.note || "Menunggu validasi stock out",

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
      });

      setItems(mappedItems);
    } catch (error) {
      console.error("❌ Fetch stock out error:", error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /* =========================
     INITIAL LOAD
  ========================= */
  useEffect(() => {
    fetchInbox();
  }, [fetchInbox]);

  /* =========================
     HANDLERS
  ========================= */
  const handleAddNote = () => {
    router.push("/dashboard/supervisor/noted/formnoted");
  };

  const handleOpenDetail = (item: InboxItemModel) => {
    router.push(`/dashboard/supervisor/noted/formnoted?id=${item.id}`);
  };

  /* =========================
     RENDER (UI TIDAK BERUBAH)
  ========================= */
  return (
    <div className="flex flex-col gap-4 min-h-screen p-3 sm:p-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
          Stock In Validation
        </h1>
      </div>

      {/* FILTER */}
      <div className="rounded-xl border bg-white p-3 sm:p-4 shadow-sm">
        <InboxFilter onFilter={fetchInbox} onAddNote={handleAddNote} />
      </div>

      {/* LIST */}
      <div className="rounded-xl border bg-white shadow-sm flex flex-col min-h-[420px] max-h-[70vh]">
        <div className="flex-1 overflow-y-auto">
          <InboxList
            items={items}
            loading={loading}
            onClickItem={handleOpenDetail}
          />
        </div>
      </div>
    </div>
  );
}
