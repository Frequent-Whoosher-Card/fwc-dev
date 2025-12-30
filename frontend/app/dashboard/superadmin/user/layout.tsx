'use client';

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';

export default function UserLayout({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();

  return (
    <div className="space-y-4">
      {/* ===== HEADER ===== */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* TITLE */}
        <h1 className="text-xl font-semibold md:text-2xl">
          User Management
        </h1>

        {/* ACTIONS */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          {/* SEARCH */}
          <input
            placeholder="search operator"
            className="
              h-10
              w-full
              sm:w-56
              md:w-64
              rounded-md
              border
              px-3
              text-sm
              focus:outline-none
              focus:ring-1
              focus:ring-blue-500
            "
          />

          {/* ADD USER */}
          <button
            onClick={() =>
              router.push('/superadmin/user/create')
            }
            className="
              h-10
              w-full
              sm:w-auto
              rounded-md
              bg-[#7A0C2E]
              px-4
              text-sm
              font-medium
              text-white
              hover:opacity-90
            "
          >
            + add new User
          </button>
        </div>
      </div>

      {/* ===== CONTENT ===== */}
      <div className="rounded-lg border bg-white p-4">
        {children}
      </div>
    </div>
  );
}
