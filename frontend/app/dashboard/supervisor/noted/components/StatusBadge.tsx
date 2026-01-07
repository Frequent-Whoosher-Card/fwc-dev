export default function StatusBadge({ status }: { status: string }) {
  if (status === 'ACCEPTED') return <span className="text-green-600">Accepted</span>;
  if (status === 'CARD_MISSING') return <span className="text-yellow-600">Missing</span>;
  if (status === 'CARD_DAMAGED') return <span className="text-red-600">Damaged</span>;
  return null;
}
