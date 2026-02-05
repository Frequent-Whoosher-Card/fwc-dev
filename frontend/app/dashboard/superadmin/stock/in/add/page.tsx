"use client";

"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import BaseStockInAdd from "@/components/stock/BaseStockInAdd";
import { ProgramType } from "@/lib/services/card.base.service";

function AddStockInContent() {
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type");
  const programType = (
    typeParam === "VOUCHER" ? "VOUCHER" : "FWC"
  ) as ProgramType;

  return <BaseStockInAdd programType={programType} />;
}

export default function AddStockInPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AddStockInContent />
    </Suspense>
  );
}
