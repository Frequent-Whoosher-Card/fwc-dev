'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import InboxFilter from './components/InboxFilter';
import InboxList from './components/InboxList';
import ModalDetailInbox from './components/modalDetailInbox';
import { API_BASE_URL } from '@/lib/apiConfig';

export default function InboxPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeItem, setActiveItem] = useState<any | null>(null);

  const fetchInbox = useCallback(async (filters: any = {}) => {
    setLoading(true);
    try {
      let url = `${API_BASE_URL}/inbox/?limit=10`;
      if (filters.status) url += `&status=${filters.status}`;
      if (filters.startDate) url += `&start_date=${filters.startDate}`;
      if (filters.endDate) url += `&end_date=${filters.endDate}`;

      const token = localStorage.getItem('fwc_token');
      if (!token) return router.push('/');

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await res.json();
      if (result.success) {
        setItems(
          result.data.items.map((item: any) => {
            const d = new Date(item.sentAt);
            return {
              id: item.id,
              title: item.title,
              message: item.message,
              sender: item.sender,
              status: item.status, // ENUM BACKEND
              date_label: d.toLocaleDateString('id-ID'),
              time_label: d.toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
              }),
            };
          })
        );
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchInbox();
  }, [fetchInbox]);

  // 🔥 ADD NOTE → OPEN MODAL
  const handleAddNote = () => {
    setActiveItem({
      id: 'NEW',
      title: '',
      message: '',
      sender: { fullName: 'You', station: '-' },
      status: 'ACCEPTED',
      date_label: '-',
      time_label: '-',
      isNew: true,
    });
  };

  return (
    <div className="space-y-6 h-full">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">
          Noted History
        </h1>
      </div>

      {/* FILTER */}
      <div className="rounded-xl border bg-white px-4 py-3 shadow-sm">
        <InboxFilter onFilter={fetchInbox} onAddNote={handleAddNote} />
      </div>

      {/* LIST */}
      <div className="rounded-xl border bg-white shadow-sm h-[65vh] overflow-hidden">
        <div className="h-full overflow-y-auto">
          <InboxList
            items={items}
            loading={loading}
            onRefresh={fetchInbox}
          />
        </div>
      </div>

      {/* MODAL DETAIL INBOX */}
      {activeItem && (
        <ModalDetailInbox
          item={activeItem}
          onClose={() => setActiveItem(null)}
        />
      )}
    </div>
  );
}
