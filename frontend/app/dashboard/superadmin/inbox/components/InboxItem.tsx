'use client';

import StatusBadge from './StatusBadge';

export default function InboxItem({
  item,
  onClick,
}: {
  item: any;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="
        grid grid-cols-[240px_1fr_160px]
        items-center
        gap-6
        px-6 py-5
        border-b border-gray-200
        hover:bg-gray-50
        transition
        cursor-pointer
      "
    >
      {/* LEFT : SENDER + CARD CONDITION */}
      <div className="flex flex-col gap-1">
        <span className="text-sm font-semibold text-gray-900 truncate">
          {item.sender?.fullName}
        </span>

        {/* Card Condition from backend */}
        <StatusBadge status={item.status} />
      </div>

      {/* MIDDLE : SUBJECT + MESSAGE */}
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-gray-800">
          {item.title}
        </span>

        <span className="text-xs text-gray-500 line-clamp-1">
          {item.message}
        </span>
      </div>

      {/* RIGHT : INBOX DATE & TIME (from backend) */}
      <div className="flex flex-col text-right whitespace-nowrap">
        <span className="text-xs text-gray-500 font-medium">
          {item.date_label}
        </span>
        <span className="text-xs text-gray-400">
          {item.time_label}
        </span>
      </div>
    </div>
  );
}
