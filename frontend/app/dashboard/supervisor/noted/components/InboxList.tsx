"use client";

import { InboxItemModel } from "@/lib/services/inbox";
import InboxItem from "./InboxItem";

interface Props {
  items: InboxItemModel[];
  loading: boolean;
  onClickItem: (item: InboxItemModel) => void;
}

export default function InboxList({ items, loading, onClickItem }: Props) {
  if (loading) {
    return (
      <div className="p-20 text-center text-gray-400 animate-pulse">
        Loading Inbox...
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="flex justify-center py-20 text-gray-400">
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
