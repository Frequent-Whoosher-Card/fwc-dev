"use client";

import { useSearchParams } from "next/navigation";
import BaseStockInAdd from "@/components/stock/BaseStockInAdd";
import { ProgramType } from "@/lib/services/card.base.service";

export default function AddStockInPage() {
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type");
  const programType = (
    typeParam === "VOUCHER" ? "VOUCHER" : "FWC"
  ) as ProgramType;

  return <BaseStockInAdd programType={programType} />;
}
