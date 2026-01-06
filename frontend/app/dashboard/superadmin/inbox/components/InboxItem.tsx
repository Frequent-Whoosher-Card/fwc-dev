'use client';
import StatusBadge from './StatusBadge';

export default function InboxItem({ item, onClick }: { item: any; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="grid grid grid-cols-[48px_48px_1.2fr_2fr_140px] items-center gap-4 px-5 py-3 border border-gray-200 rounded-xl mb-3 hover:border-red-200 transition-all cursor-pointer bg-white items-center gap-4 px-4 py-3 border border-gray-200 rounded-xl mb-3 hover:border-red-200 transition-all cursor-pointer bg-white"
    >
      {/* Checkbox */}
      <div className="flex justify-center">
        <input type="checkbox" className="w-5 h-5 border-gray-300 rounded accent-[#E31E24]" onClick={(e) => e.stopPropagation()} />
      </div>

      {/* Avatar */}
      <img
        src={item.sender?.avatar || 'https://via.placeholder.com/40'}
        className="h-10 w-10 rounded-full object-cover border border-gray-100"
        alt="avatar"
      />

     {/* Sender & Badge */}
      <div className="flex flex-col gap-1">
        <span className="font-semibold text-gray-800 text-sm truncate">{item.sender?.fullName}</span>
        <StatusBadge status={item.status} />
      </div>

      {/* Subject & Message */}
      <div className="flex flex-col">
        <span className="font-semibold text-gray-800 text-sm">{item.title}</span>
        <span className="text-xs text-gray-500 line-clamp-1 italic">
          {item.message}
        </span>
      </div>

      {/* Date & Time */}
      <div className="text-right flex flex-col">
        <span className="text-xs text-gray-500 font-medium">{item.date_label}</span>
        <span className="text-xs text-gray-400">{item.time_label}</span>
      </div>
    </div>
  );
}