"use client";
import { useEffect, useState } from "react";
import StatusBadge from "./StatusBadge";
import { API_BASE_URL } from "@/lib/apiConfig";
import { InboxStatus } from "../models/inbox.model";

interface Sender {
  fullName: string;
  station?: string;
  batch_card?: string;
  card_category?: string;
  card_type?: string;
  amount_card?: string;
}

interface InboxPayload {
  batchCard?: string;
  cardCategory?: string;
  cardType?: string;
  amountCard?: number;
  serials?: string[];
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

  // 🔑 SATU SUMBER DATA UNTUK RENDER
  const viewData = detail ?? data;

  const avatarLetter =
    viewData.sender?.fullName?.charAt(0).toUpperCase() ?? "?";

  const isSerialCase =
    viewData.status === "CARD_DAMAGED" || viewData.status === "CARD_MISSING";

  /* ===== FETCH DETAIL ===== */
  useEffect(() => {
    async function fetchDetail() {
      try {
        const token = localStorage.getItem("fwc_token");

        const res = await fetch(
          `${API_BASE_URL}/inbox/${inboxId}`, // ❗ BUKAN "{id}"
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const result = await res.json();

        if (result.success) {
          const item = result.data;
          const sentDate = new Date(item.sentAt);

          setDetail({
            id: item.id,
            status: data.status, // pakai status dari list
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
              fullName: item.sender.fullName,
              station: item.sender.station,
            },
            payload: item.payload,
          });
        }
      } catch (e) {
        console.error(e);
      }
    }

    fetchDetail();
  }, [inboxId, data.status]);

  /*================= Helper Functions =================*/
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
          <Row label="Batch Card:" value={viewData.payload?.batchCard ?? "-"} />
          <Row
            label="Card Category:"
            value={viewData.payload?.cardCategory ?? "-"}
          />
          <Row label="Card Type:" value={viewData.payload?.cardType ?? "-"} />
          <Row
            label="Amount Card:"
            value={String(viewData.payload?.amountCard ?? "-")}
          />
          <Row label="Station:" value={viewData.sender.station ?? "-"} />

          <div className="grid grid-cols-[180px_1fr] items-center gap-4">
            <span className="text-sm text-gray-700">Card Condition:</span>
            <StatusBadge status={viewData.status} />
          </div>

          {isSerialCase &&
            viewData.payload?.serials?.map((sn, i) => (
              <Row
                key={sn}
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

/* ===== Helper Row ===== */
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[180px_1fr] items-center gap-4">
      <span className="text-sm text-gray-700">{label}</span>
      <span className="text-sm text-gray-600">{value}</span>
    </div>
  );
}
