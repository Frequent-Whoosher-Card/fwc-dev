"use client";

import DashboardLayout from "@/app/dashboard/superadmin/dashboard/dashboard-layout";

export default function SupervisorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
