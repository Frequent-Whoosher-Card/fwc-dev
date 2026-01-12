import { InboxStatus } from "../models/inbox.model";

const LABELS: Record<InboxStatus, string> = {
  ACCEPTED: "Accepted",
  CARD_MISSING: "Card Missing",
  CARD_DAMAGED: "Card Damaged",
  UNKNOWN: "Unknown",
};

const STYLES: Record<InboxStatus, string> = {
  ACCEPTED: "bg-green-100 text-green-700",
  CARD_MISSING: "bg-yellow-100 text-yellow-700",
  CARD_DAMAGED: "bg-red-100 text-red-700",
  UNKNOWN: "bg-gray-100 text-gray-600",
};

export default function StatusBadge({ status }: { status?: InboxStatus }) {
  if (!status) return null;

  return (
    <span
      className={`
        inline-flex
        w-fit
        max-w-fit
        whitespace-nowrap
        items-center
        rounded-full
        px-3 py-1
        text-xs
        font-medium
        ${STYLES[status]}
      `}
    >
      {LABELS[status]}
    </span>
  );
}
