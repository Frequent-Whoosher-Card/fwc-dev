"use client";

"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import BaseStockOutView from "@/components/stock/BaseStockOutView";
import { ProgramType } from "@/lib/services/card.base.service";

function ViewStockOutContent() {
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type");
  const programType = (
    typeParam === "VOUCHER" ? "VOUCHER" : "FWC"
  ) as ProgramType;

  return <BaseStockOutView programType={programType} />;
}

export default function ViewStockOutPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ViewStockOutContent />
    </Suspense>
  );
}
