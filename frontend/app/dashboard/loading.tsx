export default function DashboardLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3 text-gray-500">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-300 border-t-[var(--kcic)]" />
        <p className="text-sm font-medium">Loading dashboard...</p>
      </div>
    </div>
  );
}


