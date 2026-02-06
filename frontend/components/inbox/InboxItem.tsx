"use client";

export interface InboxItemProps {
    id: string;
    title: string;
    message: string;
    sender: { fullName: string };
    status: string;
    dateLabel: string;
    timeLabel: string;
    type?: string; 
    programType?: "FWC" | "VOUCHER";
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
      className={`relative flex flex-col gap-3 p-4 border-b cursor-pointer transition-colors md:grid md:grid-cols-[60px_180px_1fr_150px] md:gap-4 md:px-6 md:py-4 ${
        isUnread ? "bg-[#F0F7FF]/50" : "bg-white hover:bg-gray-50"
      }`}
    >
      {/* AVATAR */}
      <div className="hidden md:flex items-center justify-center">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-lg ${isUnread ? "bg-[#8D1231]" : "bg-gray-400"}`}>
          {avatar}
        </div>
      </div>

      {/* MOBILE HEADER */}
      <div className="flex items-center gap-3 md:hidden">
         <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0 ${isUnread ? "bg-[#8D1231]" : "bg-gray-400"}`}>
          {avatar}
         </div>
         <div className="flex flex-col overflow-hidden">
             <div className="flex items-center gap-2">
                 <span className={`text-sm truncate ${isUnread ? "font-bold text-gray-900" : "font-semibold text-gray-700"}`}>
                   {item.sender.fullName}
                 </span>
             </div>
             <span className="text-[10px] text-gray-500">{item.dateLabel} • {item.timeLabel}</span>
         </div>
      </div>

      {/* LEFT COLUMN: SENDER + STATUS (Desktop) */}
      <div className="hidden md:flex flex-col justify-center gap-1">
        <span className={`text-sm truncate ${isUnread ? "font-bold text-gray-900" : "font-semibold text-gray-700"}`}>
          {item.sender.fullName}
        </span>
        <StatusBadge status={item.status} />
      </div>

      {/* MIDDLE COLUMN: TITLE + MESSAGE */}
      <div className="flex flex-col justify-center gap-0.5">
        <div className="flex items-center justify-between md:block">
            <span className={`text-sm ${isUnread ? "font-semibold text-gray-900" : "font-medium text-gray-600"}`}>
              {item.title}
            </span>
            {/* Mobile Status Badge */}
            <div className="md:hidden">
                <StatusBadge status={item.status} />
            </div>
        </div>
        <span className="text-xs text-gray-500 line-clamp-2 md:line-clamp-1">
          {item.message}
        </span>
      </div>

      {/* RIGHT COLUMN: DATE & TIME */}
      <div className="hidden md:flex flex-col justify-center text-right whitespace-nowrap">
        <span className="text-xs text-gray-500 font-medium">
          {item.dateLabel}
        </span>
        <span className="text-[10px] text-gray-400 font-medium">{item.timeLabel}</span>
      </div>
    </div>
  );
}
