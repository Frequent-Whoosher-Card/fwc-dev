'use client';

import { useParams } from 'next/navigation';

export default function UserHistoryPage() {
  const { id } = useParams();

  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold">User History</h2>
      <p className="text-sm text-gray-500">
        Riwayat aktivitas user ID: {id}
      </p>
    </div>
  );
}
