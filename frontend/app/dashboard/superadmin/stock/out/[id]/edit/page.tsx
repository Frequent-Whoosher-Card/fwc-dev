"use client";

"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import BaseStockOutEdit from "@/components/stock/BaseStockOutEdit";
import { ProgramType } from "@/lib/services/card.base.service";

function EditStockOutContent() {
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type");
  const programType = (
    typeParam === "VOUCHER" ? "VOUCHER" : "FWC"
  ) as ProgramType;

  return <BaseStockOutEdit programType={programType} />;
}

export default function EditStockOutPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EditStockOutContent />
    </Suspense>
  );
}
