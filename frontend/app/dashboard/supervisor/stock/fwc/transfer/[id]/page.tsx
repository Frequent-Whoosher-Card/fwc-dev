"use client";

import TransferReceiveDetailView from "@/components/stock/transfer/TransferReceiveDetailView";
import { useParams } from "next/navigation";

export default function FWCTransferDetailPage() {
  const params = useParams();
  const id = params.id as string;
  return <TransferReceiveDetailView id={id} />;
}
