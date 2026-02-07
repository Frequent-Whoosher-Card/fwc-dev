"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/apiConfig";
import { useInbox } from "@/context/InboxContext";
import Pagination from "@/components/ui/pagination";

import InboxFilter, { InboxFilters } from "@/components/inbox/InboxFilter";
import InboxList from "@/components/inbox/InboxList";
import ModalDetailInbox from "@/components/inbox/modalDetailInbox";
import IssueApprovalModal from "@/components/inbox/IssueApprovalModal";
import SwitchTab from "@/components/SwitchTab";

function deriveCardCondition(message: string): string {
  const msg = message.toLowerCase();
  if (msg.includes("diterima")) return "ACCEPTED";
  if (msg.includes("hilang")) return "CARD_MISSING";
  if (msg.includes("rusak")) return "CARD_DAMAGED";
  return "UNKNOWN";
}

export default function InboxPage() {
  // =========================
  // STATE DATA & LOADING
  // =========================
  const router = useRouter();
  const { unreadCounts, decrementUnread } = useInbox();
  
  // Track previous unread counts to detect INCREASES (New Messages)
  const prevUnreadRef = useRef(unreadCounts);

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("FWC");
  const [currentFilters, setCurrentFilters] = useState<InboxFilters>({});
  
  // Pagination State
  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  
  // Badge State (Handled by Context)

  // =========================
  // FETCH INBOX DATA
  // =========================
  const fetchInbox = useCallback(
    async (pageIndex: number, filters: InboxFilters = {}) => {
      setLoading(true);

      try {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("fwc_token")
            : null;

        if (!token) {
          setLoading(false);
          router.push("/");
          return;
        }

        const params = new URLSearchParams({ 
          page: String(pageIndex),
          limit: "10", // Default limit per page
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

        const res = await fetch(url, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 401) {
          localStorage.removeItem("fwc_token");
          localStorage.removeItem("fwc_user");
          router.push("/");
          return;
        }

        const result = await res.json();

        if (result.success) {
          // Set Pagination Data
          if (result.data.pagination) {
             setTotalPages(result.data.pagination.totalPages);
             setTotalItems(result.data.pagination.total || 0);
          }

          let mappedItems = result.data.items
            .map((item: any) => {
            const sentDate = new Date(item.sentAt);

            let derivedStatus = "UNKNOWN";
            const payloadStatus = item.payload?.status;

            if (payloadStatus === "COMPLETED" || payloadStatus === "RESOLVED") {
                derivedStatus = "ACCEPTED";
            } else if (payloadStatus === "PENDING") {
                derivedStatus = "PENDING_VALIDATION";
            } else if (payloadStatus === "PENDING_APPROVAL") {
                derivedStatus = "PENDING_APPROVAL";
            } else if (payloadStatus === "REJECT" || payloadStatus === "REJECTED") {
                derivedStatus = "REJECTED";
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
              programType: item.programType,
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

  // INITIAL FETCH & ON PAGE CHANGE
  useEffect(() => {
    fetchInbox(page, currentFilters);
  }, [fetchInbox, page, currentFilters]);

  // SMART AUTO-REFRESH: Detect if Unread Count INCREASES (New Message)
  useEffect(() => {
    const key = activeTab.toLowerCase() as keyof typeof unreadCounts;
    const currentCount = unreadCounts[key as "fwc" | "voucher"] || 0;
    const prevCount = prevUnreadRef.current[key as "fwc" | "voucher"] || 0;
    
    // Only refresh if count INCREASED (New Message) and we are on Page 1
    if (currentCount > prevCount && page === 1) {
        console.log(`[InboxPage] New ${activeTab} message detected! Refreshing list...`);
        fetchInbox(1, currentFilters);
    }
    
    prevUnreadRef.current = unreadCounts;
  }, [unreadCounts, activeTab, fetchInbox, page, currentFilters]);

  // Handle Tab Change (Reset Page)
  const handleTabChange = (val: string) => {
      setActiveTab(val);
      setPage(1); // Reset to page 1
  };

  const handleFilter = (newFilters: InboxFilters) => {
    setCurrentFilters(newFilters);
    setPage(1); // Reset to page 1 on filter change
  };

  const [selectedIssue, setSelectedIssue] = useState<any | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<any | null>(null);

  const handleItemClick = async (item: any) => {
      // Optimistic Update & API Call if Unread
      if (!item.isRead) {
          // 1. Optimistic UI Update
          setItems(prev => prev.map(i => i.id === item.id ? { ...i, isRead: true } : i));
          
          // Context Update (Global)
          decrementUnread(item.programType as "FWC" | "VOUCHER");

          // 2. API Call (Silent)
          try {
             const token = localStorage.getItem("fwc_token");
             if (token) {
                 await fetch(`${API_BASE_URL}/inbox/${item.id}/read`, {
                     method: "PATCH",
                     headers: { Authorization: `Bearer ${token}` }
                 });
             }
          } catch (err) {
             console.error("Failed to mark as read", err);
          }
      }

      // Open Modal
      if (item.type === 'STOCK_ISSUE_REPORT') {
          setSelectedIssue({ ...item, isRead: true });
      } else {
          setSelectedDetail({ ...item, isRead: true });
      }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between flex-none gap-4">
        <h1 className="text-xl font-semibold text-gray-900">List Inbox</h1>
        
        <SwitchTab 
          activeValue={activeTab} 
          onValueChange={handleTabChange}
          items={[
            { label: "FWC", value: "FWC", count: unreadCounts.fwc },
            { label: "Voucher", value: "VOUCHER", count: unreadCounts.voucher }
          ]}
        />
      </div>

      {/* FILTER */}
      <div className="rounded-xl border bg-white px-4 py-3 shadow-sm flex-none">
        <InboxFilter onFilter={handleFilter} onRefresh={() => fetchInbox(page, currentFilters)} />
      </div>

      {/* LIST */}
      <div className="rounded-xl border bg-white shadow-sm flex-1 flex flex-col min-h-0">
        {/* Table Toolbar / Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between px-4 py-3 border-b gap-2">
           <h3 className="text-sm font-semibold text-gray-700">Messages List</h3>
           <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Total Data:</span>
              <span className="px-2.5 py-0.5 rounded-md bg-[#8D1231]/10 text-[#8D1231] text-xs font-medium border border-[#8D1231]/20">
                {totalItems}
              </span>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <InboxList 
            items={items} 
            loading={loading} 
            onClickItem={handleItemClick}
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
      {selectedIssue && (
          <IssueApprovalModal 
            data={selectedIssue} 
            programType={selectedIssue.programType}
            onClose={() => setSelectedIssue(null)}
            onSuccess={() => {
                fetchInbox(page, currentFilters); // Refresh list
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

