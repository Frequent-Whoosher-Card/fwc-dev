'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '@/lib/apiConfig';

interface UnreadCounts {
  total: number;
  fwc: number;
  voucher: number;
}

interface InboxContextType {
  unreadCounts: UnreadCounts;
  fetchUnreadCounts: () => Promise<void>;
  decrementUnread: (type: "FWC" | "VOUCHER" | "TOTAL") => void;
}

const InboxContext = createContext<InboxContextType | undefined>(undefined);

export function InboxProvider({ children }: { children: React.ReactNode }) {
  const [unreadCounts, setUnreadCounts] = useState<UnreadCounts>({
    total: 0,
    fwc: 0,
    voucher: 0,
  });

  const fetchUnreadCounts = useCallback(async () => {
    try {
      const token = localStorage.getItem("fwc_token");
      if (!token) return;

      const res = await fetch(`${API_BASE_URL}/inbox/counts`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const json = await res.json();
        setUnreadCounts(json.data);
      }
    } catch (error) {
      console.error("Failed to fetch unread counts", error);
    }
  }, []);

  // Initial Fetch on Mount
  useEffect(() => {
    fetchUnreadCounts();
    
    // Optional: Poll every 5 seconds to keep fresh (more dynamic)
    const interval = setInterval(fetchUnreadCounts, 5000);
    return () => clearInterval(interval);
  }, [fetchUnreadCounts]);

  const decrementUnread = useCallback((type: string) => {
    setUnreadCounts((prev) => {
        const normalizedType = type ? type.toUpperCase() : "TOTAL";
        
        let newCounts = { ...prev };
        
        if (normalizedType === "FWC") {
            newCounts.fwc = Math.max(0, prev.fwc - 1);
            newCounts.total = Math.max(0, prev.total - 1);
        } else if (normalizedType === "VOUCHER") {
            newCounts.voucher = Math.max(0, prev.voucher - 1);
            newCounts.total = Math.max(0, prev.total - 1);
        } else {
             newCounts.total = Math.max(0, prev.total - 1);
        }
        return newCounts;
    });
  }, []);

  return (
    <InboxContext.Provider value={{ unreadCounts, fetchUnreadCounts, decrementUnread }}>
      {children}
    </InboxContext.Provider>
  );
}

export function useInbox() {
  const context = useContext(InboxContext);
  if (context === undefined) {
    throw new Error('useInbox must be used within an InboxProvider');
  }
  return context;
}
