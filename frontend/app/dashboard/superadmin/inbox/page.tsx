"use client";

import { useEffect, useState, useCallback } from "react";
import InboxFilter from "./components/InboxFilter";
import InboxList from "./components/InboxList";
import { InboxStatus } from "./models/inbox.model";
import { fwcInboxService } from "./fwc/fwc.service";
import { voucherInboxService } from "./voucher/voucher.service";

/**
 * PRODUCT TYPE
 */
type InboxProduct = "FWC" | "VOUCHER";

/**
 * SERVICE RESOLVER
 */
const getInboxService = (product: InboxProduct) => {
  return product === "FWC" ? fwcInboxService : voucherInboxService;
};

interface InboxFilters {
  status?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * DERIVE STATUS
 */
function deriveCardCondition(
  message: string,
  backendStatus?: string
): InboxStatus {
  if (backendStatus === "COMPLETED") return "COMPLETED";
  if (backendStatus === "ISSUE") return "ISSUE";

  const msg = (message || "").toLowerCase();
  if (msg.includes("completed") || msg.includes("selesai"))
    return "COMPLETED";
  if (msg.includes("issue") || msg.includes("masalah")) return "ISSUE";

  return "UNKNOWN";
}

export default function InboxPage() {
  /**
   * STATE
   */
  const [product, setProduct] = useState<InboxProduct | "">("");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  /**
   * FETCH INBOX
   */
  const fetchInbox = useCallback(
    async (filters: InboxFilters = {}) => {
      if (!product) return;

      setLoading(true);
      try {
        const service = getInboxService(product);

        const result = await service.getInbox({
          page: 1,
          limit: 10,
          status: filters.status,
        });

        if (result?.success) {
          let mapped = result.data.items.map((item: any) => {
            const sentDate = new Date(item.sentAt);

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
              status: deriveCardCondition(item.message, item.status),
            };
          });

          // frontend date filter
          if (filters.startDate) {
            const start = new Date(filters.startDate);
            start.setHours(0, 0, 0, 0);
            mapped = mapped.filter((i: any) => i.sentAt >= start);
          }

          if (filters.endDate) {
            const end = new Date(filters.endDate);
            end.setHours(23, 59, 59, 999);
            mapped = mapped.filter((i: any) => i.sentAt <= end);
          }

          setItems(mapped);
        } else {
          setItems([]);
        }
      } catch (error) {
        console.error("Fetch inbox failed:", error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [product]
  );

  /**
   * AUTO LOAD WHEN PRODUCT SELECTED
   */
  useEffect(() => {
    if (product) {
      fetchInbox();
    }
  }, [product, fetchInbox]);

  return (
    <div className="space-y-6 h-full">
      {/* HEADER */}
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold text-gray-900">List Inbox</h1>

        {/* PRODUCT SELECT */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">
            Pilih Jenis Produk:
          </span>

          <select
            value={product}
            onChange={(e) =>
              setProduct(e.target.value as InboxProduct | "")
            }
            className="h-9 w-44 rounded-md border px-3 text-sm font-semibold
              text-[#8D1231] bg-red-50 border-[#8D1231]
              focus:outline-none focus:ring-2 focus:ring-[#8D1231]"
          >
            <option value="">Pilih Produk</option>
            <option value="FWC">FWC</option>
            <option value="VOUCHER">VOUCHER</option>
          </select>
        </div>
      </div>

      {/* FILTER + LIST ONLY WHEN PRODUCT SELECTED */}
      {product && (
        <>
          {/* FILTER */}
          <div className="rounded-xl border bg-white px-4 py-3 shadow-sm">
            <InboxFilter onFilter={fetchInbox} />
          </div>

          {/* LIST */}
          <div className="rounded-xl border bg-white shadow-sm h-[65vh] overflow-hidden">
            <div className="h-full overflow-y-auto">
              <InboxList items={items} loading={loading} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
