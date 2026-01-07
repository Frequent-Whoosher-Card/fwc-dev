'use client';

import { useParams } from 'next/navigation';

export default function UserDetailPage() {
  const { id } = useParams();

  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold">User Detail</h2>
      <p className="text-sm text-gray-500">
        Detail user dengan ID: {id}
      </p>
    </div>
  );
}
