'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    const userRaw = localStorage.getItem('fwc_user');

    if (!userRaw) {
      router.replace('/login');
      return;
    }

    const user = JSON.parse(userRaw);
    const role = user.role;

    switch (role) {
      case 'superadmin':
        router.replace('/dashboard/superadmin');
        break;
      case 'admin':
        router.replace('/dashboard/admin');
        break;
      case 'petugas':
        router.replace('/dashboard/petugas');
        break;
      default:
        router.replace('/login');
    }
  }, [router]);

  return null;
}
