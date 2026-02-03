'use client';

import DashboardLayout from '@/app/dashboard/superadmin/dashboard/dashboard-layout';
import { InboxProvider } from '@/context/InboxContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <InboxProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </InboxProvider>
  );
}
