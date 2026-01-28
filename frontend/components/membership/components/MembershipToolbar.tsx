import { Plus } from "lucide-react";

interface MembershipToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  onAdd: () => void;
}

export default function MembershipToolbar({
  search,
  onSearchChange,
  onAdd,
}: MembershipToolbarProps) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-xl font-semibold">Membership Management</h1>

      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-9 w-96 rounded-md border px-3 text-sm focus:border-gray-400 focus:outline-none"
        />

        <button
          onClick={onAdd}
          className="flex h-9 items-center gap-2 rounded-md bg-[#8D1231] px-4 text-sm text-white hover:bg-[#73122E]"
        >
          <Plus size={16} />
          Add New
        </button>
      </div>
    </div>
  );
}
