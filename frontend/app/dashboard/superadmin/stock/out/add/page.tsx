"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import BaseStockOutAdd from "@/components/stock/BaseStockOutAdd";
import { ProgramType } from "@/lib/services/card.base.service";

function AddStockOutContent() {
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type");
  const programType = (
    typeParam === "VOUCHER" ? "VOUCHER" : "FWC"
  ) as ProgramType;

  return <BaseStockOutAdd programType={programType} />;
}

export default function AddStockOutPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AddStockOutContent />
    </Suspense>
  );
}
