'use client';

import DashboardLayout from '@/app/dashboard/superadmin/dashboard/dashboard-layout';
import { InboxProvider } from '@/context/InboxContext';

import { useEffect } from 'react';
import { getFcmToken } from '@/lib/firebase';
import { updateFcmToken } from '@/lib/apiConfig';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    getFcmToken().then((token) => {
      if (token) {
        console.log('🔥 FCM TOKEN (Admin):', token);
        updateFcmToken(token).catch(err => console.error("Failed to sync FCM token", err));
      }
    });
  }, []);
  return (
    <InboxProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </InboxProvider>
  );
}
