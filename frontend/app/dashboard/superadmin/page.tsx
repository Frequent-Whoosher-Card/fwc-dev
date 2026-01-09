<<<<<<< HEAD
'use client';

import { DashboardLayout } from './dashboard/dashboard-layout';
// import { DashboardContent } from '../../../components/dashboard-content';

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <DashboardContent />
    </DashboardLayout>
  );
}
=======
'use client';

import DashboardLayout from './dashboard/dashboard-layout';
import DashboardContent from '@/components/dashboard-content';

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <DashboardContent />
    </DashboardLayout>
  );
}
>>>>>>> da9ad286010c29f3d8e17c72ef368bf0864559eb
