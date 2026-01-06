'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/lib/apiConfig';
import InboxFilter from './components/InboxFilter';
import InboxList from './components/InboxList';

export default function InboxPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchInbox = useCallback(async (filters = {}) => {
    setLoading(true);
    try {
      const { status, startDate, endDate } = filters as any;
      let url = `${API_BASE_URL}/inbox/?limit=10`;

      if (status) url += `&status=${status}`;
      if (startDate) url += `&start_date=${startDate}`;
      if (endDate) url += `&end_date=${endDate}`;

      // Get token from localStorage
      const token = typeof window !== 'undefined' ? localStorage.getItem('fwc_token') : null;

      if (!token) {
        console.error('No authentication token found');
        router.push('/');
        return;
      }

      const res = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      // Handle 401 Unauthorized
      if (res.status === 401) {
        console.error('Unauthorized - redirecting to login');
        localStorage.removeItem('fwc_token');
        localStorage.removeItem('fwc_user');
        router.push('/');
        return;
      }

      // Check if response is JSON before parsing
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        console.error('Non-JSON response:', text);
        throw new Error('Invalid response format');
      }

      const result = await res.json();

      if (result.success) {
        setItems(result.data.items);
      }
    } catch (err) {
      console.error('Error fetching inbox:', err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchInbox();
  }, [fetchInbox]);

  return (
    <main className="p-8 bg-[#F8F9FA] min-h-screen">
      <div className="max-w-[1440px] mx-auto">
        <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 flex flex-col h-[80vh]">
          
          {/* HEADER + FILTER */}
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-[#0054A6] mb-6">
              List Inbox
            </h2>
            <InboxFilter onFilter={fetchInbox} />
          </div>

          {/* LIST */}
          <div className="flex-1 overflow-y-auto">
            <InboxList items={items} loading={loading} />
          </div>

        </div>
      </div>
    </main>
  );
}
