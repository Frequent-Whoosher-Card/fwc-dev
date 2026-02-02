"use client";

import { useParams } from "next/navigation";
import TransferReceiveDetailView from "@/components/stock/transfer/TransferReceiveDetailView";

export default function FWCTransferDetailPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";

  return <TransferReceiveDetailView id={id} />;
}
