"use client";

export interface InboxItemProps {
    id: string;
    title: string;
    message: string;
    sender: { fullName: string };
    status: string;
    dateLabel: string;
    timeLabel: string;
    type?: string; // Add type for actionable logic
    payload?: any;
    isRead?: boolean;
}

import StatusBadge from "./StatusBadge";

export default function InboxItem({
  item,
  onClick,
}: {
  item: InboxItemProps;
  onClick: () => void;
}) {
  const avatar = item.sender?.fullName?.charAt(0).toUpperCase() || "?";
  const isUnread = item.isRead === false; // Compare explicit false just in case

  return (
    <div
      onClick={onClick}
      className={`grid grid-cols-[56px_184px_1fr_160px] gap-6 px-6 py-5 border-b cursor-pointer transition-colors ${
        isUnread ? "bg-[#F0F7FF] hover:bg-blue-50" : "bg-white hover:bg-gray-50"
      }`}
    >
      {/* AVATAR */}
      <div className="flex items-center justify-center">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white ${isUnread ? "bg-[#8D1231]" : "bg-gray-500"}`}>
          {avatar}
        </div>
      </div>

      {/* LEFT : SENDER + CARD CONDITION */}
      <div className="flex flex-col gap-1">
        <span className={`text-sm truncate ${isUnread ? "font-bold text-gray-900" : "font-semibold text-gray-700"}`}>
          {item.sender.fullName}
        </span>

        {/* Card Condition from backend */}
        <StatusBadge status={item.status} />
      </div>

      {/* MIDDLE : SUBJECT + MESSAGE */}
      <div className="flex flex-col gap-0.5">
        <span className={`text-sm ${isUnread ? "font-bold text-gray-900" : "font-medium text-gray-600"}`}>{item.title}</span>

        <span className="text-xs text-gray-500 line-clamp-1">
          {item.message}
        </span>
      </div>

      {/* RIGHT : INBOX DATE & TIME */}
      <div className="flex flex-col text-right whitespace-nowrap">
        <span className="text-xs text-gray-500 font-medium">
          {item.dateLabel}
        </span>
        <span className="text-xs text-gray-400">{item.timeLabel}</span>
      </div>
    </div>
  );
}
