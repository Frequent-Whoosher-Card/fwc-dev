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
      className={`relative flex flex-col gap-3 p-4 border-b cursor-pointer transition-colors md:grid md:grid-cols-[56px_184px_1fr_160px] md:gap-6 md:px-6 md:py-5 ${
        isUnread ? "bg-[#F0F7FF] hover:bg-blue-50" : "bg-white hover:bg-gray-50"
      }`}
    >
      {/* AVATAR - Hide on mobile if too cluttered, or keep small */}
      <div className="hidden md:flex items-center justify-center">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white ${isUnread ? "bg-[#8D1231]" : "bg-gray-500"}`}>
          {avatar}
        </div>
      </div>

      {/* MOBILE HEADER: Avatar + Name + Date (Absolute) */}
      <div className="flex items-center gap-3 md:hidden">
         <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs text-white shrink-0 ${isUnread ? "bg-[#8D1231]" : "bg-gray-500"}`}>
          {avatar}
         </div>
         <div className="flex flex-col overflow-hidden">
             <div className="flex items-center gap-2">
                 <span className={`text-sm truncate ${isUnread ? "font-bold text-gray-900" : "font-semibold text-gray-700"}`}>
                  {item.sender.fullName}
                </span>
             </div>
             <span className="text-xs text-gray-500">{item.dateLabel} • {item.timeLabel}</span>
         </div>
         {/* ABSOLUTE STATUS BADGE on Mobile - Right side */}
         {/* <div className="ml-auto">
             <StatusBadge status={item.status} />
         </div> */}
      </div>

      {/* LEFT : SENDER + CARD CONDITION (Desktop) */}
      <div className="hidden md:flex flex-col gap-1">
        <span className={`text-sm truncate ${isUnread ? "font-bold text-gray-900" : "font-semibold text-gray-700"}`}>
          {item.sender.fullName}
        </span>

        {/* Card Condition from backend */}
        <StatusBadge status={item.status} />
      </div>

      {/* MIDDLE : SUBJECT + MESSAGE */}
      <div className="flex flex-col gap-1 md:gap-0.5">
        <div className="flex items-center justify-between md:block">
            <span className={`text-sm ${isUnread ? "font-bold text-gray-900" : "font-medium text-gray-600"}`}>{item.title}</span>
            {/* Mobile Status Badge */}
            <div className="md:hidden">
                <StatusBadge status={item.status} />
            </div>
        </div>

        <span className="text-xs text-gray-500 line-clamp-2 md:line-clamp-1">
          {item.message}
        </span>
      </div>

      {/* RIGHT : INBOX DATE & TIME (Desktop Only - Mobile handled above) */}
      <div className="hidden md:flex flex-col text-right whitespace-nowrap">
        <span className="text-xs text-gray-500 font-medium">
          {item.dateLabel}
        </span>
        <span className="text-xs text-gray-400">{item.timeLabel}</span>
      </div>
    </div>
  );
}
