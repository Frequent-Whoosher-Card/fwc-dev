<<<<<<< HEAD
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
=======
'use client';

import { Plus, Search } from 'lucide-react';

interface Props {
  search: string;
  onSearchChange: (value: string) => void;
  onAdd: () => void;
}

export default function TransactionToolbar({
  search,
  onSearchChange,
  onAdd,
}: Props) {
  return (
    <div className="flex items-center justify-between">
      {/* TITLE */}
      <h1 className="text-xl font-semibold">
        Transaction Management
      </h1>

      {/* ACTION */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search transaction"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-9 w-72 rounded-md border px-3 pl-9 text-sm"
          />
        </div>

        <button
          onClick={onAdd}
          className="flex items-center gap-2 rounded-md bg-red-700 px-4 py-2 text-sm text-white hover:bg-red-800"
        >
          <Plus size={16} />
          Add Purchased
        </button>
      </div>
    </div>
  );
}
>>>>>>> da9ad286010c29f3d8e17c72ef368bf0864559eb
