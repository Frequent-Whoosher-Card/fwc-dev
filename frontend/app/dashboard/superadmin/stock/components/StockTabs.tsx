'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function StockTabs() {
  const pathname = usePathname();

  const tabs = [
    { label: 'All', href: '/dashboard/admin/stock' },
    { label: 'Stock In', href: '/dashboard/admin/stock/in' },
    { label: 'Stock Out', href: '/dashboard/admin/stock/out' },
  ];

  return (
    <div className="flex gap-2">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;

        return (
          <Link
            key={tab.label}
            href={tab.href}
            className={cn(
              'rounded-md px-4 py-2 text-sm font-medium',
              isActive
                ? 'bg-[#8D1231] text-white'
                : 'text-gray-700 hover:bg-gray-100'
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
