"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
export default function PetugasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
