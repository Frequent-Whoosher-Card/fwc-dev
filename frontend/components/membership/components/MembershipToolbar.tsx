interface MembershipToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
}

export default function MembershipToolbar({
  search,
  onSearchChange,
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
          className="h-9 w-96 rounded-md border px-3 text-sm"
        />
      </div>
    </div>
  );
}
