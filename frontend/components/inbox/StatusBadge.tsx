

const LABELS: Record<string, string> = {
  ACCEPTED: "Diterima",
  CARD_MISSING: "Kartu Hilang",
  CARD_DAMAGED: "Kartu Rusak",
  PENDING_VALIDATION: "Menunggu Validasi",
  UNKNOWN: "Info",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
  COMPLETED: "Selesai",
  PENDING: "Menunggu",
  PENDING_APPROVAL: "Menunggu Approval",
  ALERT: "Peringatan",
};

const STYLES: Record<string, string> = {
  ACCEPTED: "bg-[#E7F7EF] text-[#0A6C3A] border-[#C3EAD3]",
  CARD_MISSING: "bg-[#FFFBEB] text-[#92400E] border-[#FEF3C7]",
  CARD_DAMAGED: "bg-[#FEF1F2] text-[#991B1B] border-[#FEE2E2]",
  PENDING_VALIDATION: "bg-[#E0F2FE] text-[#075985] border-[#BAE6FD]",
  UNKNOWN: "bg-gray-50 text-gray-600 border-gray-200",
  APPROVED: "bg-[#E7F7EF] text-[#0A6C3A] border-[#C3EAD3]",
  REJECTED: "bg-[#FEF1F2] text-[#991B1B] border-[#FEE2E2]",
  COMPLETED: "bg-[#E7F7EF] text-[#0A6C3A] border-[#C3EAD3]",
  PENDING: "bg-[#FFFBEB] text-[#92400E] border-[#FEF3C7]",
  PENDING_APPROVAL: "bg-[#FFF7ED] text-[#9A3412] border-[#FFEDD5]",
  ALERT: "bg-[#FEF1F2] text-[#991B1B] border-[#FEE2E2]",
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
        rounded-lg
        px-3 py-1
        text-[11px]
        font-bold
        uppercase
        tracking-wider
        border
        shadow-sm
        ${STYLES[status] || STYLES.UNKNOWN}
      `}
    >
      {LABELS[status] || LABELS.UNKNOWN}
    </span>
  );
}
