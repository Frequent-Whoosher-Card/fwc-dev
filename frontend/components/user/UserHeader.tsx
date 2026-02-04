import { Plus } from "lucide-react";

interface UserHeaderProps {
  search: string;
  setSearch: (value: string) => void;
  onAdd: () => void;
}

export default function UserHeader({
  search,
  setSearch,
  onAdd,
}: UserHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <h1 className="text-xl font-semibold">User Management</h1>

      <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="search operator"
          className="
            h-10 w-full md:w-96
            rounded-lg border border-gray-300 px-4 text-sm
            focus:border-[#8D1231] focus:ring-1 focus:ring-[#8D1231]
          "
        />

        <button
          onClick={onAdd}
          className="
            flex w-full items-center justify-center gap-2
            rounded-lg bg-[#8D1231] px-5 py-2 text-sm text-white
            hover:bg-[#73122E]
            md:w-auto
          "
        >
          <Plus size={16} />
          add new User
        </button>
      </div>
    </div>
  );
}
