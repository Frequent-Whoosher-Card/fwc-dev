'use client';

import { ReactNode } from 'react';

export default function UserLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-white p-6">
      {children}
    </div>
  );
}
