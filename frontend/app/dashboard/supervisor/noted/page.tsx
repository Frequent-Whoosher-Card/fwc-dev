'use client';

import { useEffect, useState, useCallback } from 'react';
import InboxFilter from './components/InboxFilter';
import InboxList from './components/InboxList';

export default function InboxPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInbox = useCallback(async (filters = {}) => {
    setLoading(true);
    try {
      const { status, startDate, endDate } = filters as any;
      let url = `https://fwc-kcic.me/api/inbox/?limit=10`;

      if (status) url += `&status=${status}`;
      if (startDate) url += `&start_date=${startDate}`;
      if (endDate) url += `&end_date=${endDate}`;

      const res = await fetch(url);
      const result = await res.json();

      if (result.success) {
        setItems(result.data.items);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInbox();
  }, [fetchInbox]);

  return (
    <main className="p-8 bg-[#F8F9FA] min-h-screen">
      <div className="max-w-[1440px] mx-auto">
        <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 flex flex-col h-[80vh]">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-[#0054A6] mb-6">
              List Inbox
            </h2>
            <InboxFilter onFilter={fetchInbox} />
          </div>

          <div className="flex-1 overflow-y-auto">
            <InboxList
              items={items}
              loading={loading}
              onRefresh={fetchInbox}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
