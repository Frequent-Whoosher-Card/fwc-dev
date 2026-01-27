import { InboxStatus } from "../models/inbox.model";

const LABELS: Record<InboxStatus, string> = {
  COMPLETED: "Completed",
  ISSUE: "Issue",
  UNKNOWN: "Unknown",
  CARD_DAMAGED: "Card Damaged",
  CARD_MISSING: "Card Missing",
};

const STYLES: Record<InboxStatus, string> = {
  COMPLETED: "bg-green-100 text-green-700",
  ISSUE: "bg-orange-100 text-orange-700",
  UNKNOWN: "bg-gray-100 text-gray-600",
  CARD_DAMAGED: "bg-red-100 text-red-700",
  CARD_MISSING: "bg-red-100 text-red-700",
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
