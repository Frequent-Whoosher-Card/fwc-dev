type Props = {
  status: 'accepted' | 'missing' | 'damaged';
};

export default function StatusBadge({ status }: Props) {
  const map = {
    accepted: 'bg-green-100 text-green-700',
    missing: 'bg-yellow-100 text-yellow-700',
    damaged: 'bg-red-100 text-red-700',
  };

  const label = {
    accepted: 'Accepted',
    missing: 'Missing',
    damaged: 'Damaged',
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium ${map[status]}`}
    >
      {label[status]}
    </span>
  );
}
