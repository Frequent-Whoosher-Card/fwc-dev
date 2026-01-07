'use client';

export default function TransactionToolbar() {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-lg font-semibold">
        Transaction Management
      </h1>

      <div className="flex gap-2">
        <input
          placeholder="Search transaction"
          className="h-9 w-64 rounded-md border px-3 text-sm"
        />

        <button className="rounded-md bg-red-700 px-4 py-2 text-sm text-white">
          + Add Purchased
        </button>

        <button className="rounded-md border px-3 py-2 text-sm">
          PDF
        </button>
      </div>
    </div>
  );
}
