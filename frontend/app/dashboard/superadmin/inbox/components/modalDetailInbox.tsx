"use client";

import { useEffect, useState } from "react";
import StatusBadge from "./StatusBadge";
import api from "@/lib/axios";
import type { InboxStatus } from "../models/inbox.model";

/* ================= TYPES ================= */

interface Sender {
  fullName: string;
  station?: string;
}

interface InboxPayload {
  stockOutId?: string;
  damagedSerials?: string[];
  missingSerials?: string[];
}

interface StockDetail {
  batchCard?: string;
  cardCategory?: string;
  cardType?: string;
  amountCard?: number;
}

export interface InboxDetail {
  id: string;
  status: InboxStatus;
  message: string;
  dateLabel: string;
  timeLabel: string;
  sender: Sender;
  payload?: InboxPayload;
}

/* ================= COMPONENT ================= */

export default function ModalDetailInbox({
  inboxId,
  data,
  onClose,
}: {
  inboxId: string;
  data: InboxDetail;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<InboxDetail | null>(null);
  const [stockDetail, setStockDetail] = useState<StockDetail | null>(null);

  // 👉 single source of truth untuk render
  const viewData = detail ?? data;

  const avatarLetter =
    viewData.sender?.fullName?.charAt(0).toUpperCase() ?? "?";

  const isSerialCase =
    viewData.status === "CARD_DAMAGED" || viewData.status === "CARD_MISSING";

  /* ================= FETCH DETAIL ================= */

  useEffect(() => {
    async function fetchDetail() {
      try {
        /**
         * =====================
         * 1️⃣ FETCH INBOX DETAIL
         * =====================
         */
        const inboxRes = await api.get(`/inbox/${inboxId}`);
        if (!inboxRes.data?.success) return;

        const item = inboxRes.data.data;
        const sentDate = new Date(item.sentAt);

        // ✅ mapping status aman
        const mappedStatus: InboxStatus =
          item.payload?.damagedSerials?.length > 0
            ? "CARD_DAMAGED"
            : item.payload?.missingSerials?.length > 0
            ? "CARD_MISSING"
            : "ACCEPTED";

        const inboxPayload: InboxPayload = {
          stockOutId: item.payload?.stockOutId,
          damagedSerials: item.payload?.damagedSerials ?? [],
          missingSerials: item.payload?.missingSerials ?? [],
        };

        setDetail({
          id: item.id,
          status: mappedStatus,
          message: item.message,
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
          sender: {
            fullName: item.sender?.fullName ?? "-",
            station: item.station?.name ?? "-",
          },
          payload: inboxPayload,
        });

        /**
         * ==========================
         * 2️⃣ FETCH STOCK OUT DETAIL
         * ==========================
         */
        if (!inboxPayload.stockOutId) {
          console.warn("stockOutId not found in inbox payload");
          return;
        }

        const stockRes = await api.get(`/stock/out/${inboxPayload.stockOutId}`);

        if (!stockRes.data?.success) return;

        const s = stockRes.data.data;

        setStockDetail({
          batchCard: String(s.batchId ?? "-"),
          cardCategory: s.cardCategory?.name ?? "-",
          cardType: s.cardType?.name ?? "-",
          amountCard: s.quantity ?? 0,
        });
      } catch (err) {
        console.error("Fetch inbox / stock detail error:", err);
      }
    }

    fetchDetail();
  }, [inboxId]);

  /* ================= RENDER ================= */

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border text-lg font-bold">
              {avatarLetter}
            </div>

            <div>
              <p className="font-semibold text-gray-800">
                {viewData.sender.fullName}
              </p>
              <p className="text-xs text-gray-500">
                {viewData.sender.station ?? "-"}
              </p>
            </div>
          </div>

          <div className="flex flex-col text-right whitespace-nowrap">
            <span className="text-xs text-gray-500 font-medium">
              {viewData.dateLabel}
            </span>
            <span className="text-xs text-gray-400">{viewData.timeLabel}</span>
          </div>
        </div>

        {/* Body */}
        <div className="space-y-4 px-6 py-6">
          <Row label="Card Type:" value={stockDetail?.cardType ?? "-"} />
          <Row
            label="Amount Card:"
            value={String(stockDetail?.amountCard ?? "-")}
          />
          <Row label="Station:" value={viewData.sender.station ?? "-"} />

          <div className="grid grid-cols-[180px_1fr] items-center gap-4">
            <span className="text-sm text-gray-700">Card Condition:</span>
            <StatusBadge status={viewData.status} />
          </div>

          {isSerialCase &&
            [
              ...(viewData.payload?.damagedSerials ?? []),
              ...(viewData.payload?.missingSerials ?? []),
            ].map((sn, i) => (
              <Row
                key={`${sn}-${i}`}
                label={i === 0 ? "Serial Number Card:" : ""}
                value={`${i + 1}. ${sn}`}
              />
            ))}

          <div className="grid grid-cols-[180px_1fr] items-start gap-4">
            <span className="text-sm text-gray-700">Messages:</span>
            <textarea
              disabled
              value={viewData.message}
              className="min-h-[80px] w-full rounded-md border bg-gray-50 px-3 py-2 text-sm text-gray-700"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t px-8 py-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-red-700 px-10 py-3 text-sm font-semibold text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================= HELPER ================= */

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[180px_1fr] items-center gap-4">
      <span className="text-sm text-gray-700">{label}</span>
      <span className="text-sm text-gray-600">{value}</span>
    </div>
  );
}
