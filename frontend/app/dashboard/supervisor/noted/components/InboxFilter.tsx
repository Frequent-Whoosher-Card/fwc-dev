'use client';

export default function InboxFilter({
  onFilter,
}: {
  onFilter: (filters: any) => void;
}) {
  return (
    <div className="flex gap-3">
      <button
        onClick={() => onFilter({ status: 'pending' })}
        className="px-4 py-2 border rounded-lg"
      >
        Pending
      </button>
      <button
        onClick={() => onFilter({})}
        className="px-4 py-2 border rounded-lg"
      >
        All
      </button>
    </div>
  );
}
