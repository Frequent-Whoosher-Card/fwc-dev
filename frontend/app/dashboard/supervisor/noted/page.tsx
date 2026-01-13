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

  // =========================
  // FETCH INBOX DATA
  // =========================
  const fetchInbox = useCallback(
    async (filters: any = {}) => {
      setLoading(true);
      try {
        const token = localStorage.getItem("fwc_token");
        if (!token) return router.push("/");

        // Jika tidak ada token → redirect ke login
        if (!token) {
          setLoading(false);
          router.push("/");
          return;
        }

        /**
         * Build query string dengan URLSearchParams
         * Lebih aman & rapi dibanding string concat manual
         */
        const params = new URLSearchParams({ limit: "10" });

        if (filters.status) params.append("status", filters.status);

        const url = `${API_BASE_URL}/inbox/?${params.toString()}`;

        // Request ke backend
        const res = await fetch(`${API_BASE_URL}/inbox/?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        /**
         * Jika token expired / unauthorized
         * → clear localStorage & redirect
         */
        if (res.status === 401) {
          localStorage.clear();
          return router.push("/");
        }

        const result = await res.json();

        // MAP DATA FROM BACKEND TO FRONTEND FORMAT

        if (result.success) {
          let mappedItems = result.data.items.map((item: any) => {
            const sentDate = new Date(item.sentAt);

            return {
              id: item.id,
              title: item.title,
              message: item.message,
              sender: item.sender,
              isRead: item.isRead,
              readAt: item.readAt,

              // 🔥 SIMPAN DATE ASLI UNTUK FILTER
              sentAt: sentDate,

              dateLabel: sentDate.toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              }),
              timeLabel:
                sentDate.toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                }) + " WIB",

              status: deriveCardCondition(item.message),
            };
          });

          /**
           * ✅ FILTER FRONTEND (INI KUNCINYA)
           */
          if (filters.status) {
            mappedItems = mappedItems.filter(
              (item) => item.status === filters.status
            );
          }
          if (filters.startDate) {
            const start = new Date(filters.startDate);
            start.setHours(0, 0, 0, 0); // awal hari

            mappedItems = mappedItems.filter((item) => item.sentAt >= start);
          }

          if (filters.endDate) {
            const end = new Date(filters.endDate);
            end.setHours(23, 59, 59, 999); // akhir hari

            mappedItems = mappedItems.filter((item) => item.sentAt <= end);
          }

          setItems(mappedItems);
        }
      } catch (error) {
        console.error("Error fetching inbox:", error);
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  // INITIAL FETCH
  useEffect(() => {
    fetchInbox();
  }, [fetchInbox]);

  // ✅ ADD NOTE → HALAMAN FORM BARU
  const handleAddNote = () => {
    router.push("/dashboard/supervisor/noted/formnoted");
  };

  // ✅ CLICK ITEM → HALAMAN DETAIL / EDIT
  const handleOpenDetail = (item: any) => {
    router.push(`/dashboard/supervisor/noted/${item.id}`);
  };

  return (
    <div className="space-y-6 h-full">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Noted History</h1>
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
function deriveCardCondition(message: any) {
  throw new Error("Function not implemented.");
}
