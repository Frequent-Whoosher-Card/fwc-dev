"use client";

import { InboxStatus } from "@/lib/services/inbox";

export default function StatusBadge({ status }: { status: InboxStatus }) {
  if (status === "PENDING") {
    return (
      <span className="rounded-full bg-yellow-100 text-yellow-700 px-2.5 py-0.5 text-[11px] font-semibold">
        Pending
      </span>
    );
  }

  if (status === "COMPLETED") {
    return (
      <span className="rounded-full bg-green-100 text-green-700 px-2.5 py-0.5 text-[11px] font-semibold">
        Selesai
      </span>
    );
  }

  if (status === "ISSUE") {
    return (
      <span className="rounded-full bg-red-100 text-red-700 px-2.5 py-0.5 text-[11px] font-semibold">
        Issue
      </span>
    );
  }

  return (
    <span className="rounded-full bg-gray-100 text-gray-500 px-2.5 py-0.5 text-[11px] font-semibold">
      Unknown
    </span>
  );
}
