'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '@/lib/apiConfig';
import { onForegroundMessage } from '@/lib/firebase';
import toast from "react-hot-toast";

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

  // Initial Fetch on Mount & Setup FCM Listener
  useEffect(() => {
    // 1. Initial Fetch (Only once)
    fetchUnreadCounts();
    
    // 2. Listen for Real-time FCM Messages
    // This replaces the heavy polling (setInterval)
    onForegroundMessage((payload) => {
      console.log("[InboxContext] Notification received:", payload);
      
      // SHOW TOAST (Foreground Notification)
      if (payload.data && payload.data.title) {
      toast(payload.data.title + "\n" + (payload.data.body || ''), {
              icon: '📢', // Changed to Loudspeaker for better context
              duration: 5000,
              position: 'top-right',
              style: {
                  background: '#FFFFFF',
                  color: '#1F2937', // Dark Grey for readability
                  borderLeft: '5px solid #8D1231', // Corporate Maroon Accent
                  boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)', // Soft Drop Shadow
                  borderRadius: '6px',
                  fontWeight: '500',
                  padding: '12px 16px',
                  minWidth: '300px'
              }
          });
      }

      // Option A: Smart Increment (If payload has data)
      if (payload.data && payload.data.type) {
         setUnreadCounts(prev => {
             const type = payload.data.type;
             const newCounts = { ...prev };
             
             // Increment specific counter
             if (type === 'FWC') newCounts.fwc += 1;
             if (type === 'VOUCHER') newCounts.voucher += 1;
             
             // Always increment total
             newCounts.total += 1;
             
             return newCounts;
         });
      } 
      // Option B: Fallback - Re-fetch counts (Lightweight single fetch) if weird payload
      else {
          fetchUnreadCounts();
      }
    });

    // Clean up? Firebase listeners are persistent, usually don't need manual off for top-level
  }, [fetchUnreadCounts]);

  // 3. Auto-Refresh when Tab becomes Active (Handle "Background -> Foreground" scenario)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log("[InboxContext] Tab active, refreshing counts...");
        fetchUnreadCounts();
      }
    };
    
    // Also listen for focus (window click)
    const handleFocus = () => {
        console.log("[InboxContext] Window focused, refreshing counts...");
        fetchUnreadCounts();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
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
