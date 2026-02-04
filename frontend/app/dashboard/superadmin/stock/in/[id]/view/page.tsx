"use client";

import { useSearchParams } from "next/navigation";
import BaseStockInView from "@/components/stock/BaseStockInView";
import { ProgramType } from "@/lib/services/card.base.service";

export default function ViewStockInPage() {
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type");
  const programType = (
    typeParam === "VOUCHER" ? "VOUCHER" : "FWC"
  ) as ProgramType;

  return <BaseStockInView programType={programType} />;
}
