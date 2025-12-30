'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function CreateUserPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Create New User</h2>

        <Button
          variant="outline"
          onClick={() => router.back()}
        >
          Back
        </Button>
      </div>

      {/* FORM (DUMMY / PLACEHOLDER) */}
      <div className="rounded-lg border bg-white p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <input
            className="h-10 rounded-md border px-3 text-sm"
            placeholder="Name"
          />
          <input
            className="h-10 rounded-md border px-3 text-sm"
            placeholder="Username"
          />
          <input
            className="h-10 rounded-md border px-3 text-sm"
            placeholder="Email"
          />
          <input
            className="h-10 rounded-md border px-3 text-sm"
            placeholder="Phone Number"
          />
          <input
            className="h-10 rounded-md border px-3 text-sm"
            placeholder="Role"
          />
          <input
            className="h-10 rounded-md border px-3 text-sm"
            placeholder="Stasiun"
          />
        </div>

        {/* ACTION */}
        <div className="mt-6 flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button className="bg-[#7A0C2E] text-white hover:opacity-90">
            Save User
          </Button>
        </div>
      </div>
    </div>
  );
}
