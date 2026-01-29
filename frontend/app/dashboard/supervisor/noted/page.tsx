"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import InboxFilter, { InboxFilters } from "@/components/inbox/InboxFilter";
import InboxList from "@/components/inbox/InboxList";
import StockValidationModal from "@/components/inbox/StockValidationModal";
import ModalDetailInbox from "@/components/inbox/modalDetailInbox";
import { API_BASE_URL } from "@/lib/apiConfig";
import FormNoted from "./formnoted/page";
import SwitchTab from "@/components/SwitchTab";

export default function InboxPage() {
  // =========================
  // STATE DATA & LOADING
  // =========================
  const router = useRouter();

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeItem, setActiveItem] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState("FWC");
  const [currentFilters, setCurrentFilters] = useState<InboxFilters>({});

  // =========================
  // FETCH INBOX DATA
  // =========================
  const fetchInbox = useCallback(
    async (filters: InboxFilters = {}) => {
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
        const params = new URLSearchParams({ 
          limit: "10",
          programType: activeTab 
        });

        if (filters.status) params.append("status", filters.status);
        if (filters.search) params.append("search", filters.search);
        if (filters.startDate) params.append("startDate", filters.startDate);
        if (filters.endDate) params.append("endDate", filters.endDate);

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
              type: item.type, // Map Type
              programType: item.programType, // Map programType
              payload: item.payload, // Map Payload

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

              status: (() => {
                const pStatus = item.payload?.status;
                if (pStatus === "COMPLETED") return "ACCEPTED";
                if (pStatus === "PENDING") return "PENDING_VALIDATION";
                return deriveCardCondition(item.message);
              })(),
            };
          });

          // ... (Filter logic remains same)


          setItems(mappedItems);
        }
      } catch (error) {
        console.error("Error fetching inbox:", error);
      } finally {
        setLoading(false);
      }
    },
    [router, activeTab]
  );
  
  // INITIAL FETCH
  useEffect(() => {
    fetchInbox(currentFilters);
  }, [fetchInbox, activeTab, currentFilters]);

  const handleFilter = (newFilters: InboxFilters) => {
    setCurrentFilters(newFilters);
  };

  const handleAddNote = () => {
    router.push("/dashboard/supervisor/noted/formnoted");
  };

  const handleOpenDetail = (item: any) => {
    setActiveItem(item);
  };
  
  const handleCloseDetail = () => {
    setActiveItem(null);
  }

  const handleValidationSuccess = () => {
      fetchInbox(); // Refresh list after validation
      // Optionally show toast success
  };

  return (
    <div className="space-y-6 h-full">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Noted History</h1>

        <SwitchTab 
          activeValue={activeTab} 
          onValueChange={setActiveTab}
          items={[
            { label: "FWC", value: "FWC" },
            { label: "Voucher", value: "VOUCHER" }
          ]}
        />
      </div>

      {/* FILTER */}
      <div className="rounded-xl border bg-white px-4 py-3 shadow-sm">
        <InboxFilter onFilter={handleFilter} onAddNote={handleAddNote} />
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
      
      {/* MODALS */}
      {activeItem && (
         <>
            {/* Logic: If STOCK_DISTRIBUTION & PENDING -> Show Validation Modal */}
            {activeItem.type === "STOCK_DISTRIBUTION" && activeItem.payload?.status === "PENDING" ? (
                <StockValidationModal 
                    data={activeItem}
                    onClose={handleCloseDetail}
                    onSuccess={handleValidationSuccess}
                />
            ) : (
                <ModalDetailInbox 
                    data={activeItem}
                    onClose={handleCloseDetail}
                />
            )}
         </>
      )}
    </div>
  );
}

function deriveCardCondition(message: string): string {
  const msg = message.toLowerCase();
  
  if (msg.includes("diterima") || msg.includes("selesai")) return "ACCEPTED";
  if (msg.includes("hilang")) return "CARD_MISSING";
  if (msg.includes("rusak")) return "CARD_DAMAGED";
  if (msg.includes("mengirim") || msg.includes("validasi")) return "PENDING_VALIDATION";
  
  return "UNKNOWN";
}

