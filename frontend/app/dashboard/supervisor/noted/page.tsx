"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import InboxFilter, { InboxFilters } from "@/components/inbox/InboxFilter";
import InboxList from "@/components/inbox/InboxList";
import StockValidationModal from "@/components/inbox/StockValidationModal";
import ModalDetailInbox from "@/components/inbox/modalDetailInbox";
import { API_BASE_URL } from "@/lib/apiConfig";
import Pagination from "@/components/ui/pagination";

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

  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // =========================
  // FETCH INBOX DATA
  // =========================
  const fetchInbox = useCallback(
    async (pageIndex: number, filters: InboxFilters = {}) => {
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
          page: String(pageIndex),
          limit: "10",
          programType: activeTab 
        });

        let searchParam = filters.search || "";

        if (filters.status) {
           switch (filters.status) {
             case "CARD_MISSING":
               searchParam = (searchParam + " hilang").trim();
               break;
             case "CARD_DAMAGED":
               searchParam = (searchParam + " rusak").trim();
               break;
             default:
               params.append("status", filters.status);
           }
        }

        if (searchParam) params.append("search", searchParam);
        if (filters.startDate) params.append("startDate", filters.startDate);
        if (filters.endDate) params.append("endDate", filters.endDate);

        const url = `${API_BASE_URL}/inbox/?${params.toString()}`;

        // Request ke backend
        const res = await fetch(url, {
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
          // Set Pagination Data
          if (result.data.pagination) {
             setTotalPages(result.data.pagination.totalPages);
          }

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
                if (pStatus === "COMPLETED" || pStatus === "RESOLVED") return "ACCEPTED";
                if (pStatus === "PENDING_APPROVAL") return "PENDING_APPROVAL";
                if (pStatus === "PENDING") return "PENDING_VALIDATION";
                if (pStatus === "REJECTED") return "REJECTED";
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
    fetchInbox(page, currentFilters);
  }, [fetchInbox, page, currentFilters]);

  // Handle Tab Change (Reset Page)
  const handleTabChange = (val: string) => {
      setActiveTab(val);
      setPage(1); // Reset to page 1
  };

  const handleFilter = (newFilters: InboxFilters) => {
    setCurrentFilters(newFilters);
    setPage(1); // Reset to page 1 on filter
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
      fetchInbox(page, currentFilters); // Refresh list
      // Optionally show toast success
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* HEADER */}
      <div className="flex items-center justify-between flex-none">
        <h1 className="text-xl font-semibold text-gray-900">Noted History</h1>

        <SwitchTab 
          activeValue={activeTab} 
          onValueChange={handleTabChange}
          items={[
            { label: "FWC", value: "FWC" },
            { label: "Voucher", value: "VOUCHER" }
          ]}
        />
      </div>

      {/* FILTER */}
      <div className="rounded-xl border bg-white px-4 py-3 shadow-sm flex-none">
        <InboxFilter onFilter={handleFilter} onAddNote={handleAddNote} onRefresh={() => fetchInbox(page, currentFilters)} />
      </div>

      {/* LIST */}
      <div className="rounded-xl border bg-white shadow-sm flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto">
          <InboxList
            items={items}
            loading={loading}
            onClickItem={handleOpenDetail}
          />
        </div>
        
        <div className="border-t">
            <Pagination 
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
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