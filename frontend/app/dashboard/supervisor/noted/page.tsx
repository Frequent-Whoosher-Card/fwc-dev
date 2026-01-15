"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import InboxFilter from "./components/InboxFilter";
import InboxList from "./components/InboxList";
import api from "@/lib/axios";

export default function InboxPage() {
  // =========================
  // STATE DATA & LOADING
  // =========================
  const router = useRouter();

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  /* =========================
     FETCH STOCK OUT LIST
  ========================= */
  const fetchInbox = useCallback(async () => {
    try {
      setLoading(true);

      // ⚠️ Jangan kirim filter param dulu supaya API aman
      const params = {
        page: 1,
        limit: 10,
      };

      const res = await api.get("/stock/out", {
        params,
        validateStatus: (status) => status < 500, // allow 422
      });

      // ✅ Aman untuk berbagai bentuk response
      const data = res.data?.found?.data ?? res.data?.data ?? res.data;

      const rawItems = Array.isArray(data?.items) ? data.items : [];

      const mappedItems = rawItems.map((item: any) => {
        const date = new Date(item.movementAt);

        // =====================
        // STATUS MAPPING (BENAR)
        // =====================
        let status = "PENDING";

        // backend yang menentukan status validasi
        if (item.validationStatus === "COMPLETED") status = "COMPLETED";
        if (item.validationStatus === "ISSUE") status = "ISSUE";

        // fallback: hitung dari data rusak / hilang
        if (!item.validationStatus) {
          const hasDamaged = item.damagedSerialNumbers?.length > 0;
          const hasMissing = item.lostSerialNumbers?.length > 0;

          if (hasDamaged || hasMissing) {
            status = "ISSUE";
          } else {
            status = "COMPLETED";
          }
        }

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
    } catch (error) {
      console.error("Fetch stock out error >>>", error);
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

  // ✅ CLICK ITEM → HALAMAN DETAIL / EDIT
  const handleOpenDetail = (item: any) => {
    router.push(`/dashboard/supervisor/noted/formnoted?stockOutId=${item.id}`);
  };

  /* =========================
     RENDER (SCROLL FIXED)
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
        {/* SCROLL AREA */}
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
