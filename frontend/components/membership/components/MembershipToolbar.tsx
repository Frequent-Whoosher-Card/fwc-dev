interface MembershipToolbarProps {
  children?: React.ReactNode;
}

export default function MembershipToolbar({
  children,
}: MembershipToolbarProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center">
        <h1 className="text-xl font-semibold">Membership Management</h1>
        {children}
      </div>
    </div>
  );
}
