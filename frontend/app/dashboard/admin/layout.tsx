'use client';

import DashboardLayout from '@/app/dashboard/superadmin/dashboard/dashboard-layout';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
