"use client";

import { useSearchParams } from "next/navigation";
import BaseStockOutAdd from "@/components/stock/BaseStockOutAdd";
import { ProgramType } from "@/lib/services/card.base.service";

export default function AddStockOutPage() {
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type");
  const programType = (
    typeParam === "VOUCHER" ? "VOUCHER" : "FWC"
  ) as ProgramType;

  return <BaseStockOutAdd programType={programType} />;
}
