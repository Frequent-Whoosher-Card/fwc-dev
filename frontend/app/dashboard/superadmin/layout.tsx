'use client';

import { DashboardLayout } from '@/app/dashboard/superadmin/dashboard/dashboard-layout';

export default function SuperadminLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
