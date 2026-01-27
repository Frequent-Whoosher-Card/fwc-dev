"use client";

import type { ElementType } from "react";
import { Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { InboxStatus } from "@/lib/services/inbox";

interface Props {
  status?: InboxStatus;
}

const LABELS: Record<InboxStatus, string> = {
  PENDING: "Perlu Validasi",
  ISSUE: "Ada Masalah",
  COMPLETED: "Tervalidasi",
};

const STYLES: Record<InboxStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  ISSUE: "bg-red-100 text-red-700",
  COMPLETED: "bg-green-100 text-green-700",
};

const ICONS: Record<InboxStatus, ElementType> = {
  PENDING: Clock,
  ISSUE: AlertTriangle,
  COMPLETED: CheckCircle2,
};

export default function StatusBadge({ status }: Props) {
  if (!status) return null;

  const Icon = ICONS[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${STYLES[status]}`}
    >
      <Icon size={14} strokeWidth={2.5} />
      {LABELS[status]}
    </span>
  );
}
