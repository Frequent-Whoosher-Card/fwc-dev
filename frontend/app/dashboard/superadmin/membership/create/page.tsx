"use client";

import { useSearchParams } from "next/navigation";
import CreateMemberPage from "@/components/membership/CreateMemberPage";

export default function SuperAdminCreateMemberPage() {
  const searchParams = useSearchParams();
  const programType = (searchParams.get("programType") === "voucher" ? "VOUCHER" : "FWC") as "FWC" | "VOUCHER";
  return <CreateMemberPage programType={programType} />;
}
