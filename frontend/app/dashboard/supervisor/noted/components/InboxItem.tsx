"use client";

import { InboxItemModel, mapInboxStatus } from "@/lib/services/inbox";
import StatusBadge from "./StatusBadge";

export default function InboxItem({
  item,
  onClick,
}: {
  item: InboxItemModel;
  onClick: () => void;
}) {
  const avatarLetter = item.sender.fullName?.charAt(0).toUpperCase() || "?";
  const status = mapInboxStatus(item);

  const isIssue = status === "ISSUE";

  return (
    <div
      onClick={onClick}
      className={`grid grid-cols-[56px_184px_1fr_160px] gap-6 px-6 py-5 border-b cursor-pointer transition
        ${
          isIssue
            ? "bg-red-50 hover:bg-red-100 border-red-200"
            : "bg-white hover:bg-gray-50 border-gray-200"
        }`}
    >
      {/* AVATAR */}
      <div className="flex items-center justify-center">
        <div className="w-10 h-10 rounded-full bg-gray-600 text-white flex items-center justify-center font-semibold">
          {avatarLetter}
        </div>
      </div>

      {/* LEFT */}
      <div className="flex flex-col gap-1">
        <span className="text-sm font-semibold truncate">
          {item.sender.fullName || "-"}
        </span>

        <StatusBadge status={status} />
      </div>

      {/* MIDDLE */}
      <div className="flex flex-col">
        <span className="text-sm font-medium">{item.title}</span>
        <span className="text-xs text-gray-500 line-clamp-1">
          {item.message}
        </span>
      </div>

      {/* RIGHT */}
      <div className="text-right text-xs text-gray-500 whitespace-nowrap">
        <div>{item.date_label}</div>
        <div>{item.time_label}</div>
      </div>
    </div>
  );
}
