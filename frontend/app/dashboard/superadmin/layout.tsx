'use client';

import { useEffect } from 'react';
import DashboardLayout from '@/app/dashboard/superadmin/dashboard/dashboard-layout';
import { getFcmToken } from '@/lib/firebase';

import { InboxProvider } from '@/context/InboxContext';

export default function SuperadminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    getFcmToken().then((token) => {
      console.log('🔥 FCM TOKEN:', token);
    });
  }, []);

  return (
    <InboxProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </InboxProvider>
  );
}
