"use client";

import { useSearchParams } from "next/navigation";
import BaseStockOutView from "@/components/stock/BaseStockOutView";
import { ProgramType } from "@/lib/services/card.base.service";

export default function ViewStockOutPage() {
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type");
  const programType = (
    typeParam === "VOUCHER" ? "VOUCHER" : "FWC"
  ) as ProgramType;

  return <BaseStockOutView programType={programType} />;
}
