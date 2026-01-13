export default function StatusBadge({ status }: { status?: string }) {
  if (status === "ACCEPTED")
    return <span className="text-green-600">Good</span>;
  if (status === "CARD_MISSING")
    return <span className="text-yellow-600">Missing</span>;
  if (status === "CARD_DAMAGED")
    return <span className="text-red-600">Damaged</span>;
  return <span className="text-gray-400">-</span>;
}
