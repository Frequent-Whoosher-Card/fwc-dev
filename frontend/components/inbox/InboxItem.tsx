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

  return (
    <div
      onClick={onClick}
      className="grid grid-cols-[56px_184px_1fr_160px] gap-6 px-6 py-5 border-b hover:bg-gray-50 cursor-pointer"
    >
      {/* AVATAR */}
      <div className="flex items-center justify-center">
        <div className="w-10 h-10 rounded-full bg-gray-600 text-white flex items-center justify-center font-semibold">
          {avatar}
        </div>
      </div>

      {/* LEFT : SENDER + CARD CONDITION */}
      <div className="flex flex-col gap-1">
        <span className="text-sm font-semibold text-gray-900 truncate">
          {item.sender.fullName}
        </span>

        {/* Card Condition from backend */}
        <StatusBadge status={item.status} />
      </div>

      {/* MIDDLE : SUBJECT + MESSAGE */}
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-gray-800">{item.title}</span>

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
