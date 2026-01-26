"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import InboxFilter from "./components/InboxFilter";
import InboxList from "./components/InboxList";
import api from "@/lib/axios";
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

export default function InboxPage() {
  // =========================
  // STATE DATA & LOADING
  // =========================
  const router = useRouter();

  const [items, setItems] = useState<InboxItemModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeItem, setActiveItem] = useState<any | null>(null);

  // =====================
  // FETCH DATA FROM BACKEND
  // =====================
  const fetchInbox = useCallback(async () => {
    try {
      setLoading(true);

      const res = await api.get("/stock/out", {
        params: { page: 1, limit: 10 },
        validateStatus: (status) => status < 500,
      });

      const data = res.data?.found?.data ?? res.data?.data ?? res.data;
      const rawItems = Array.isArray(data?.items) ? data.items : [];

      const mappedItems: InboxItemModel[] = rawItems.map((item: any) => {
        const date = new Date(item.movementAt);

        let status: InboxStatus = "PENDING";

        const damagedCount = item.damagedSerialNumbers?.length ?? 0;
        const lostCount = item.lostSerialNumbers?.length ?? 0;
        const hasIssue = damagedCount > 0 || lostCount > 0;

        if (item.validationStatus === "COMPLETED") {
          status = hasIssue ? "ISSUE" : "COMPLETED";
        } else if (item.validationStatus === "ISSUE") {
          status = "ISSUE";
        }

        return {
          id: item.id,
          sender: { fullName: item.createdByName || "-" },
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
      console.error("Fetch inbox error:", error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // =====================
  // FIRST LOAD + AUTO POLLING
  // =====================
  useEffect(() => {
    fetchInbox();

    const interval = setInterval(() => {
      fetchInbox();
    }, 15000); // refresh tiap 15 detik

    return () => clearInterval(interval);
  }, [fetchInbox]);

  // =====================
  // 🔥 FIREBASE REALTIME TRIGGER
  // =====================
  useEffect(() => {
    const db = getFirestoreDb();
    if (!db) return;

    const q = query(
      collection(db, "inbox_notifications"),
      where("role", "==", "SUPERVISOR"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, () => {
      console.log("🔔 Firebase inbox trigger");
      fetchInbox(); // reload backend data
    });

    return () => unsubscribe();
  }, [fetchInbox]);

  const handleAddNote = () => {
    router.push("/dashboard/supervisor/noted/formnoted");
  };

  const handleOpenDetail = (item: InboxItemModel) => {
    router.push(`/dashboard/supervisor/noted/formnoted?id=${item.id}`);
  };

  return (
    <div className="flex flex-col gap-4 min-h-screen p-3 sm:p-6">
      <h1 className="text-lg sm:text-xl font-semibold">
        Stock In Validation
      </h1>

      <div className="rounded-xl border bg-white p-3 sm:p-4 shadow-sm">
        <InboxFilter onFilter={fetchInbox} onAddNote={handleAddNote} />
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
    </div>
  );
}
function deriveCardCondition(message: any) {
  throw new Error("Function not implemented.");
}
