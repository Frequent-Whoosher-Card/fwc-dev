"use client";
import InboxItem from "./InboxItem";

export default function InboxList({
  items,
  loading,
  onClickItem,
}: {
  items: any[];
  loading: boolean;
  onClickItem: (item: any) => void;
}) {
  if (loading) {
    return (
      <div className="p-20 text-center text-gray-400 animate-pulse">
        Loading Inbox...
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="flex items-center justify-center h-full py-20 text-gray-400">
        Tidak ada data ditemukan.
      </div>
    );
  }

  return (
    <div className="flex flex-col px-6 pb-6">
      {items.map((item) => (
        <InboxItem
          key={item.id}
          item={item}
          onClick={() => onClickItem(item)}
        />
      ))}
    </div>
  );
}
