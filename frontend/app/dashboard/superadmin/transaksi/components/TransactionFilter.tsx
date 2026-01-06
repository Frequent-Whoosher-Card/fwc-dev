'use client';

export default function TransactionFilter() {
  return (
    <div className="flex items-center gap-3">
      <select className="h-9 rounded-md border px-3 text-sm">
        <option>Station</option>
      </select>

      <input
        type="date"
        className="h-9 rounded-md border px-3 text-sm"
      />

      <input
        type="date"
        className="h-9 rounded-md border px-3 text-sm"
      />
    </div>
  );
}
