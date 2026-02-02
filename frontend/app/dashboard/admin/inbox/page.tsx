"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/apiConfig";
import InboxFilter, { InboxFilters } from "@/components/inbox/InboxFilter";
import InboxList from "@/components/inbox/InboxList";
import ModalDetailInbox from "@/components/inbox/modalDetailInbox";
import IssueApprovalModal from "@/components/inbox/IssueApprovalModal";
import SwitchTab from "@/components/SwitchTab";

/**
 * Derive card condition from backend message
 * (temporary until backend provides explicit field)
 */
 // Update derive function to match StatusBadge keys
function deriveCardCondition(message: string): string {
  const msg = message.toLowerCase();

  // Map legacy messages to new keys or keep using StatusBadge keys
  if (msg.includes("diterima")) return "ACCEPTED"; // Will render "Diterima"
  if (msg.includes("hilang")) return "CARD_MISSING"; // "Kartu Hilang"
  if (msg.includes("rusak")) return "CARD_DAMAGED"; // "Kartu Rusak"

  return "UNKNOWN";
}

export default function InboxPage() {
  // =========================
  // STATE DATA & LOADING
  // =========================
  const router = useRouter();

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("FWC");
  const [currentFilters, setCurrentFilters] = useState<InboxFilters>({});

  // =========================
  // FETCH INBOX DATA
  // =========================
  const fetchInbox = useCallback(
    async (filters: InboxFilters = {}) => {
      setLoading(true);

      try {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("fwc_token")
            : null;

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
        const res = await fetch(url, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        /**
         * Jika token expired / unauthorized
         * → clear localStorage & redirect
         */
        if (res.status === 401) {
          localStorage.removeItem("fwc_token");
          localStorage.removeItem("fwc_user");
          router.push("/");
          return;
        }

        const result = await res.json();

        // MAP DATA FROM BACKEND TO FRONTEND FORMAT

        if (result.success) {
          let mappedItems = result.data.items
            .filter((item: any) => item.type !== 'LOW_STOCK_ALERT')
            .map((item: any) => {
            const sentDate = new Date(item.sentAt);

            // Prioritize explicit status from payload if resolved
            let derivedStatus = "UNKNOWN";
            const payloadStatus = item.payload?.status;

            if (payloadStatus === "APPROVE") {
                derivedStatus = "APPROVED";
            } else if (payloadStatus === "REJECT") {
                derivedStatus = "REJECTED";
            } else if (payloadStatus === "COMPLETED") {
                derivedStatus = "COMPLETED";
            } else if (payloadStatus === "PENDING") {
                derivedStatus = "PENDING";
            } else if (payloadStatus === "PENDING_APPROVAL") {
                derivedStatus = "PENDING_APPROVAL";
            } else if (item.type === 'LOW_STOCK_ALERT') {
                derivedStatus = "ALERT";
            } else {
                derivedStatus = deriveCardCondition(item.message);
            }

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

              status: derivedStatus,
              type: item.type,
              programType: item.programType, // Map programType
              payload: item.payload,
            };
          });



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


  const [selectedIssue, setSelectedIssue] = useState<any | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<any | null>(null);

  const handleItemClick = (item: any) => {
      // Check payload type or infer from payload structure
      // Ideally we should have 'type' in item, currently backend sends 'type' in mapped item?
      // Wait, mapped item only has { id, title, message, sender, status, ... }
      // We need to ensure 'type' or 'payload' is available in mapped items.
      
      // Let's modify the map function above first to include payload and type.
      // Assuming it's done below.
      
      if (item.type === 'STOCK_ISSUE_REPORT') {
          setSelectedIssue(item);
      } else {
          setSelectedDetail(item);
      }
  };

  return (
    <div className="space-y-6 h-full">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">List Inbox</h1>
        
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
        <InboxFilter onFilter={handleFilter} onRefresh={() => fetchInbox(currentFilters)} />
      </div>

      {/* LIST */}
      <div className="rounded-xl border bg-white shadow-sm h-[65vh] overflow-hidden">
        <div className="h-full overflow-y-auto">
          <InboxList 
            items={items} 
            loading={loading} 
            onClickItem={handleItemClick}
          />
        </div>
      </div>

      {/* MODALS */}
      {selectedIssue && (
          <IssueApprovalModal 
            data={selectedIssue} 
            onClose={() => setSelectedIssue(null)}
            onSuccess={() => {
                fetchInbox(); // Refresh list
            }}
          />
      )}

      {selectedDetail && (
          <ModalDetailInbox 
            data={selectedDetail} 
            onClose={() => setSelectedDetail(null)}
          />
      )}
    </div>
  );
}
