"use client";

import { Plus, Search } from "lucide-react";

interface Props {
  search: string;
  onSearchChange: (value: string) => void;
  onAdd: () => void;
  onAddMember: () => void;
  activeTab: 'fwc' | 'voucher' | '';
  onTabChange: (tab: 'fwc' | 'voucher' | '') => void;
}

export default function TransactionToolbar({
  search,
  onSearchChange,
  onAdd,
  onAddMember,
  activeTab,
  onTabChange,
}: Props) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      {/* TITLE & SWITCHER */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
          Transaction Management
        </h1>
        
        {/* PRODUCT SWITCHER */}
        <select
          value={activeTab}
          onChange={(e) => onTabChange(e.target.value as 'fwc' | 'voucher' | '')}
          className="h-10 w-full sm:w-auto rounded-md border px-3 text-sm font-semibold text-[#8D1231] bg-red-50 border-[#8D1231] focus:outline-none focus:ring-2 focus:ring-[#8D1231]"
        >
          <option value="">Pilih Produk</option>
          <option value="fwc">FWC</option>
          <option value="voucher">VOUCHER</option>
        </select>
      </div>

      {/* ACTION */}
      {activeTab && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          {/* SEARCH */}
          <div className="relative w-full sm:w-auto">
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
            className="h-10 w-full sm:w-64 lg:w-72 rounded-md border px-3 pl-9 text-sm text-gray-800 placeholder:text-gray-400 focus:border-[#8D1231] focus:ring-1 focus:ring-[#8D1231]"
          />
        </div>

        <div className="flex gap-2 sm:gap-3">
          {/* ADD MEMBER */}
          <button
            onClick={onAddMember}
            className="flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-md bg-green-700 px-3 sm:px-4 py-2 text-sm text-white transition hover:bg-green-800"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Purchased</span>
          </button>

          {/* ADD PURCHASE */}
          <button
            onClick={onAdd}
            className="flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-md bg-[#8D1231] px-3 sm:px-4 py-2 text-sm text-white transition hover:bg-[#73122E]"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Repurchased</span>
          </button>
        </div>
        </div>
      )}
    </div>
  );
}
