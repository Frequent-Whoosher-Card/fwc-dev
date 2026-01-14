"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import InboxFilter from "./components/InboxFilter";
import InboxList from "./components/InboxList";
import { API_BASE_URL } from "@/lib/apiConfig";
import FormNoted from "./formnoted/page";

export default function InboxPage() {
  // =========================
  // STATE DATA & LOADING
  // =========================
  const router = useRouter();

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeItem, setActiveItem] = useState<any | null>(null);

  /* =========================
     FETCH STOCK OUT HISTORY
  ========================= */
  const fetchInbox = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("fwc_token");
      if (!token) return router.push("/");

      const res = await fetch(`${API_BASE_URL}/stock/out/history`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401) {
        localStorage.clear();
        return router.push("/");
      }

      const result = await res.json();
      if (!result.success) return;

      const mappedItems = result.data.items.map((item: any) => {
        const date = new Date(item.movementAt);

        const hasDamaged =
          item.damagedSerialNumbers && item.damagedSerialNumbers.length > 0;

        const hasMissing =
          item.lostSerialNumbers && item.lostSerialNumbers.length > 0;

        let status = "ACCEPTED";
        if (hasDamaged) status = "CARD_DAMAGED";
        if (hasMissing) status = "CARD_MISSING";

        return {
          id: item.id,

          sender: {
            fullName: item.createdByName || "-",
          },

          status,

          title: `Stock Out - ${item.stationName}`,
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

          // simpan raw untuk halaman detail
          raw: item,
        };
      });

      setItems(mappedItems);
    } catch (err) {
      console.error("Fetch stock out history error:", err);
    } finally {
      setLoading(false);
    }
  }, [router]);

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

  // ✅ CLICK ITEM → HALAMAN DETAIL / EDIT
  const handleOpenDetail = (item: any) => {
    router.push(`/dashboard/supervisor/noted/formnoted?stockOutId=${item.id}`);
  };

  /* =========================
     RENDER
  ========================= */
  return (
    <div className="space-y-6 h-full">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">
          Stock Out Validation
        </h1>
      </div>

      {/* FILTER */}
      <div className="rounded-xl border bg-white px-4 py-3 shadow-sm">
        <InboxFilter onFilter={fetchInbox} onAddNote={handleAddNote} />
      </div>

      {/* LIST */}
      <div className="rounded-xl border bg-white shadow-sm h-[65vh] overflow-hidden">
        <div className="h-full overflow-y-auto">
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
