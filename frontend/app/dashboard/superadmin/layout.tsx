'use client';

import { useEffect } from 'react';
import DashboardLayout from '@/app/dashboard/superadmin/dashboard/dashboard-layout';
import { getFcmToken } from '@/lib/firebase';

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

  return <DashboardLayout>{children}</DashboardLayout>;
}
