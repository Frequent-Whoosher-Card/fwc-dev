"use client";

"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import BaseStockInView from "@/components/stock/BaseStockInView";
import { ProgramType } from "@/lib/services/card.base.service";

function ViewStockInContent() {
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type");
  const programType = (
    typeParam === "VOUCHER" ? "VOUCHER" : "FWC"
  ) as ProgramType;

  return <BaseStockInView programType={programType} />;
}

export default function ViewStockInPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ViewStockInContent />
    </Suspense>
  );
}
