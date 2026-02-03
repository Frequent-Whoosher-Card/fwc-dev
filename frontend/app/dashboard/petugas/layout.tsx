'use client';

import DashboardLayout from '@/app/dashboard/superadmin/dashboard/dashboard-layout';
import { InboxProvider } from '@/context/InboxContext';

export default function PetugasLayout({ children }: { children: React.ReactNode }) {
  return (
    <InboxProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </InboxProvider>
  );
}
