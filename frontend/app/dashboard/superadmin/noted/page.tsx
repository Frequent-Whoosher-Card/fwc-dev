"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import InboxFilter, { InboxFilters } from "@/components/inbox/InboxFilter";
import InboxList from "@/components/inbox/InboxList";
import ModalDetailInbox from "@/components/inbox/modalDetailInbox"; // Only Detail Modal, no Validation Modal
import { API_BASE_URL } from "@/lib/apiConfig";
import SwitchTab from "@/components/SwitchTab";

export default function SuperadminNotedPage() {
  const router = useRouter();

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeItem, setActiveItem] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState("FWC");
  const [currentFilters, setCurrentFilters] = useState<InboxFilters>({});
  
  // Station Filter State
  const [stations, setStations] = useState<any[]>([]);
  const [selectedStation, setSelectedStation] = useState<string>("");

  // FETCH STATIONS
  useEffect(() => {
    const fetchStations = async () => {
        try {
            const token = localStorage.getItem("fwc_token");
            if (!token) return;
            const res = await fetch(`${API_BASE_URL}/station?limit=1000`, { 
                headers: { Authorization: `Bearer ${token}` }
            });
            const result = await res.json();
            if (result.success) {
                setStations(result.data.items);
            }
        } catch (e) {
            console.error("Failed to fetch stations", e);
        }
    };
    fetchStations();
  }, []);

  // FETCH DATA
  const fetchHistory = useCallback(
    async (filters: InboxFilters = {}, stationId = "") => {
      setLoading(true);
      try {
        const token = localStorage.getItem("fwc_token");
        if (!token) return router.push("/");

        const params = new URLSearchParams({ 
          limit: "10",
          programType: activeTab 
        });

        if (filters.status) params.append("status", filters.status);
        if (filters.search) params.append("search", filters.search);
        if (filters.startDate) params.append("startDate", filters.startDate);
        if (filters.endDate) params.append("endDate", filters.endDate);
        if (stationId) params.append("stationId", stationId); // Append Station ID

        // USE NEW ENDPOINT
        const res = await fetch(`${API_BASE_URL}/inbox/supervisor-noted-history?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 401) {
          localStorage.clear();
          return router.push("/");
        }

        const result = await res.json();

        if (result.success) {
          let mappedItems = result.data.items.map((item: any) => {
            const sentDate = new Date(item.sentAt);

            return {
              id: item.id,
              title: item.title,
              message: item.message,
              sender: item.sender,
              isRead: true, // Always show as read primarily since it's history
              readAt: item.readAt,
              type: item.type,
              programType: item.programType,
              payload: item.payload,
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
              
              // Status Logic
              status: (() => {
                const pStatus = item.payload?.status;
                if (pStatus === "COMPLETED") return "ACCEPTED";
                if (pStatus === "PENDING") return "PENDING_VALIDATION";
                return "UNKNOWN";
              })(),
              
              // Helper to show station in list if needed (InboxList might not show it by default, but Title/Message usually has context)
              // We can rely on Message content usually indicating context, or the Modal Detail showing it.
            };
          });

          setItems(mappedItems);
        }
      } catch (error) {
        console.error("Error fetching noted history:", error);
      } finally {
        setLoading(false);
      }
    },
    [router, activeTab]
  );
  
  // INITIAL FETCH & WATCHERS
  useEffect(() => {
    fetchHistory(currentFilters, selectedStation);
  }, [fetchHistory, activeTab, currentFilters, selectedStation]);

  const handleFilter = (newFilters: InboxFilters) => {
    setCurrentFilters(newFilters);
  };

  const handleOpenDetail = (item: any) => {
    setActiveItem(item);
  };
  
  const handleCloseDetail = () => {
    setActiveItem(null);
  }

  return (
    <div className="space-y-6 h-full">
      {/* HEADER */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">Noted History (Global Monitor)</h1>

            <SwitchTab 
            activeValue={activeTab} 
            onValueChange={setActiveTab}
            items={[
                { label: "FWC", value: "FWC" },
                { label: "Voucher", value: "VOUCHER" }
            ]}
            />
        </div>
      </div>
        
      {/* FILTER */}
      <div className="rounded-xl border bg-white px-4 py-3 shadow-sm">
        <InboxFilter 
            onFilter={handleFilter} 
            onRefresh={() => fetchHistory(currentFilters, selectedStation)} 
            stations={stations}
            selectedStation={selectedStation}
            onStationChange={setSelectedStation}
        />
        {/* Note: onAddNote removed as Superadmin likely doesn't create Notes here, or if they do, needs logic */}
      </div>

      {/* LIST */}
      <div className="rounded-xl border bg-white shadow-sm h-[60vh] overflow-hidden">
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
          <ModalDetailInbox 
              data={activeItem}
              onClose={handleCloseDetail}
          />
      )}
    </div>
  );
}
