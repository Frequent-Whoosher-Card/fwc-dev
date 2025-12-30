'use client';

import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function EditUserPage() {
  const { id } = useParams();
  const router = useRouter();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Edit User</h2>
        <Button variant="outline" onClick={() => router.back()}>
          Back
        </Button>
      </div>

      <div className="rounded-lg border bg-white p-4 text-sm text-gray-600">
        Form edit user untuk ID: {id}
      </div>
    </div>
  );
}
