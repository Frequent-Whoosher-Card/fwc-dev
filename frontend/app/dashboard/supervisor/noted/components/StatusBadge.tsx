export default function StatusBadge({ status }: { status: string }) {
  const color =
    status === 'pending'
      ? 'bg-yellow-100 text-yellow-700'
      : 'bg-green-100 text-green-700';

  return (
    <span
      className={`px-3 py-1 text-xs rounded-full ${color}`}
    >
      {status}
    </span>
  );
}
