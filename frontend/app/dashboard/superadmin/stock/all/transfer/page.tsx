"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import TransferCardView from "@/components/stock/TransferCardView";
import { ProgramType } from "@/lib/services/card.base.service";

function CreateTransferContent() {
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type");
  const programType = (
    typeParam === "VOUCHER" ? "VOUCHER" : "FWC"
  ) as ProgramType;

  return <TransferCardView programType={programType} />;
}

export default function CreateTransferPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateTransferContent />
    </Suspense>
  );
}
