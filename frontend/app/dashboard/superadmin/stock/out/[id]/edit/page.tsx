"use client";

import { useSearchParams } from "next/navigation";
import BaseStockOutEdit from "@/components/stock/BaseStockOutEdit";
import { ProgramType } from "@/lib/services/card.base.service";

export default function EditStockOutPage() {
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type");
  const programType = (
    typeParam === "VOUCHER" ? "VOUCHER" : "FWC"
  ) as ProgramType;

  return <BaseStockOutEdit programType={programType} />;
}
