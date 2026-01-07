'use client';
import { useState } from 'react';
import InboxItem from './InboxItem';
import ModalDetailInbox from './modalDetailInbox';

export default function InboxList({
  items,
  loading,
  onRefresh,
}: {
  items: any[];
  loading: boolean;
  onRefresh: () => void;
}) {
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

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
    <>
      <div className="flex flex-col px-6 pb-6">
        {items.map((item) => (
          <InboxItem
            key={item.id}
            item={item}
            onClick={() => setSelectedItem(item)}
          />
        ))}
      </div>

      {selectedItem && (
        <ModalDetailInbox
          data={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </>
  );
}
