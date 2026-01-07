export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Inventory Management FWC</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        <SummaryCard title="Card Issues" value="500" />
        <SummaryCard title="Ticket Issued" value="500" />
        <SummaryCard title="Ticket Redeemed" value="500" />
        <SummaryCard title="Expired Ticket" value="500" />
        <SummaryCard title="Remaining Ticket" value="500" />
      </div>

      {/* Placeholder Content */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="col-span-2 rounded-lg border bg-white p-4">
          <h2 className="font-medium mb-2">Tabel Penjualan Card Harian</h2>
          <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
            Table placeholder
          </div>
        </div>

        <div className="rounded-lg border bg-white p-4">
          <h2 className="font-medium mb-2">Sales Report per Stasiun</h2>
          <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
            Chart placeholder
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">Rp -</p>
    </div>
  );
}
