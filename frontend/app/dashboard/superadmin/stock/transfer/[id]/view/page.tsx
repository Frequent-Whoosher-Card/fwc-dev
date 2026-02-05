"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import TransferReceiveDetailView from "@/components/stock/transfer/TransferReceiveDetailView";

function ViewTransferContent() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";

  return <TransferReceiveDetailView id={id} />;
}

export default function ViewTransferPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ViewTransferContent />
    </Suspense>
  );
}
