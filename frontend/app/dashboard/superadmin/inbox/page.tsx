'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/lib/apiConfig';

import InboxFilter from './components/InboxFilter';
import InboxList from './components/InboxList';

interface InboxFilters {
  status?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Derive card condition from backend message
 * (temporary until backend provides explicit field)
 */
function deriveCardCondition(message: string): string {
  const msg = message.toLowerCase();

  if (msg.includes('diterima')) return 'ACCEPTED';
  if (msg.includes('hilang')) return 'CARD_MISSING';
  if (msg.includes('rusak')) return 'CARD_DAMAGED';

  return 'UNKNOWN';
}

export default function InboxPage() {
  const router = useRouter();

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchInbox = useCallback(
    async (filters: InboxFilters = {}) => {
      setLoading(true);

      try {
        const { status, startDate, endDate } = filters;

        let url = `${API_BASE_URL}/inbox/?limit=10`;
        if (status) url += `&status=${status}`;
        if (startDate) url += `&start_date=${startDate}`;
        if (endDate) url += `&end_date=${endDate}`;

        const token =
          typeof window !== 'undefined'
            ? localStorage.getItem('fwc_token')
            : null;

        if (!token) {
          router.push('/');
          return;
        }

        const res = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 401) {
          localStorage.removeItem('fwc_token');
          localStorage.removeItem('fwc_user');
          router.push('/');
          return;
        }

        const result = await res.json();

        if (result.success) {
          const mappedItems = result.data.items.map((item: any) => {
            const sentDate = new Date(item.sentAt);

            return {
              id: item.id,

              // CONTENT
              title: item.title,
              message: item.message,

              // SENDER
              sender: item.sender,

              // READ STATE
              isRead: item.isRead,
              readAt: item.readAt,

              // DATE & TIME (FROM BACKEND)
              date_label: sentDate.toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              }),
              time_label:
                sentDate.toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                }) + ' WIB',

              // CARD CONDITION (DERIVED FROM MESSAGE)
              status: deriveCardCondition(item.message),
            };
          });

          setItems(mappedItems);
        }
      } catch (error) {
        console.error('Error fetching inbox:', error);
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  useEffect(() => {
    fetchInbox();
  }, [fetchInbox]);

  return (
    <div className="space-y-6 h-full">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">
          List Inbox
        </h1>
      </div>

      {/* FILTER */}
      <div className="rounded-xl border bg-white px-4 py-3 shadow-sm">
        <InboxFilter onFilter={fetchInbox} />
      </div>

      {/* LIST */}
      <div className="rounded-xl border bg-white shadow-sm h-[65vh] overflow-hidden">
        <div className="h-full overflow-y-auto">
          <InboxList items={items} loading={loading} />
        </div>
      </div>
    </div>
  );
}
