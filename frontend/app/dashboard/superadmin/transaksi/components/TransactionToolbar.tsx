"use client";

import { Plus, Search } from "lucide-react";

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
      <h1 className="text-xl font-semibold text-gray-900">
        Transaction Management
      </h1>

      {/* ACTION */}
      <div className="flex items-center gap-3">
        {/* SEARCH */}
        <div className="relative">
          <Search
            size={16}
            className="
              absolute left-3 top-1/2 -translate-y-1/2
              text-[#8D1231]
            "
          />

          <input
            type="text"
            placeholder="Search transaction"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="
              h-10 w-72
              rounded-md border px-3 pl-9 text-sm
              text-gray-800
              placeholder:text-gray-400
              focus:border-[#8D1231]
              focus:ring-1 focus:ring-[#8D1231]
            "
          />
        </div>

        {/* ADD */}
        <button
          onClick={onAdd}
          className="
            flex items-center gap-2
            rounded-md
            bg-[#8D1231]
            px-4 py-2
            text-sm text-white
            transition
            hover:bg-[#73122E]
          "
        >
          <Plus size={16} />
          Add Purchased
        </button>
      </div>
    </div>
  );
}
