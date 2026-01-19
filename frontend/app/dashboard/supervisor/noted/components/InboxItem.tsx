"use client";

import { InboxItemModel } from "@/lib/services/inbox";
import StatusBadge from "./StatusBadge";
import { mapInboxStatus } from "@/lib/services/inbox";

export default function InboxItem({
  item,
  onClick,
}: {
  item: InboxItemModel;
  onClick: () => void;
}) {
  const avatarLetter = item.sender.fullName?.charAt(0).toUpperCase() || "?";

  // =====================
  // STATUS MAPPING (FROM BACKEND)
  // =====================
  const status = mapInboxStatus(item);

  const isIssue = status === "ISSUE";
  const isPending = status === "PENDING";

  return (
    <div
      onClick={onClick}
      className={`grid grid-cols-[56px_184px_1fr_160px] gap-6 px-6 py-5 border-b cursor-pointer transition
        ${
          isIssue
            ? "bg-red-50 hover:bg-red-100 border-red-200"
            : isPending
            ? "bg-yellow-50 hover:bg-yellow-100 border-yellow-200"
            : "border-gray-200 hover:bg-gray-50"
        }`}
    >
      {/* AVATAR */}
      <div className="flex justify-center">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold
            ${
              isIssue
                ? "bg-red-500"
                : isPending
                ? "bg-yellow-500"
                : "bg-gray-600"
            }`}
        >
          {avatarLetter}
        </div>
      </div>

      {/* LEFT : SENDER + STATUS */}
      <div className="flex flex-col gap-1">
        <span className="text-sm font-semibold truncate">
          {item.sender.fullName || "-"}
        </span>

        {/* ✅ STATUS FROM MAPPER */}
        <StatusBadge status={status} />
      </div>

      {/* MIDDLE : TITLE + MESSAGE */}
      <div className="flex flex-col">
        <span className="text-sm font-medium">{item.title}</span>
        <span className="text-xs text-gray-500 line-clamp-1">
          {item.message}
        </span>
      </div>

      {/* RIGHT : DATE */}
      <div className="text-right text-xs text-gray-500 whitespace-nowrap">
        <div>{item.date_label}</div>
        <div>{item.time_label}</div>
      </div>
    </div>
  );
}
