"use client";
import DashboardLayout, { UserContext } from '@/app/dashboard/superadmin/dashboard/dashboard-layout';

export { UserContext };

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
