"use client";
import DashboardLayout, { UserContext } from '@/app/dashboard/superadmin/dashboard/dashboard-layout';

export { UserContext };

export default function SupervisorDashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
