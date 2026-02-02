

const LABELS: Record<string, string> = {
  ACCEPTED: "Diterima",
  CARD_MISSING: "Kartu Hilang",
  CARD_DAMAGED: "Kartu Rusak",
  PENDING_VALIDATION: "Menunggu Validasi",
  UNKNOWN: "Info", // Fallback better than Unknown
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
  COMPLETED: "Selesai",
  PENDING: "Menunggu",
  PENDING_APPROVAL: "Menunggu Approval",
  ALERT: "Peringatan",
};

const STYLES: Record<string, string> = {
  ACCEPTED: "bg-green-100 text-green-700",
  CARD_MISSING: "bg-yellow-100 text-yellow-700",
  CARD_DAMAGED: "bg-red-100 text-red-700",
  PENDING_VALIDATION: "bg-blue-100 text-blue-700",
  UNKNOWN: "bg-gray-100 text-gray-600",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  COMPLETED: "bg-green-100 text-green-700",
  PENDING: "bg-yellow-100 text-yellow-700",
  PENDING_APPROVAL: "bg-orange-100 text-orange-700",
  ALERT: "bg-red-100 text-red-700",
};

export default function StatusBadge({ status }: { status?: string }) {
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
