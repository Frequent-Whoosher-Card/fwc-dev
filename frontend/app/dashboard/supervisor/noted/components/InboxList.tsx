'use client';

import InboxItem from './InboxItem';

export default function InboxList({
  items,
  loading,
  onRefresh,
}: {
  items: any[];
  loading: boolean;
  onRefresh: () => void;
}) {
  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!items.length) {
    return <div className="p-6">No data</div>;
  }

  return (
    <>
      {items.map((item) => (
        <InboxItem
          key={item.id}
          item={item}
          onRefresh={onRefresh}
        />
      ))}
    </>
  );
}
