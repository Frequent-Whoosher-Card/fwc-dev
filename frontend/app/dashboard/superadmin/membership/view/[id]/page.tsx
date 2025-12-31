// app/dashboard/superadmin/membership/view/[id]/page.tsx

interface PageProps {
  params: {
    id: string;
  };
}

export default function MembershipViewPage({ params }: PageProps) {
  const { id } = params;

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Detail Membership</h1>
      <p>ID: {id}</p>
    </div>
  );
}
