"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function StockTabs() {
  const pathname = usePathname();

  const tabs = [
    { label: "All", href: "/dashboard/superadmin/stock/summary" },
    { label: "Stock In", href: "/dashboard/superadmin/stock/in" },
    { label: "Stock Out", href: "/dashboard/superadmin/stock/out" },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard/superadmin/stock/summary") {
      return pathname.startsWith(href);
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="flex gap-2">
      {tabs.map((tab) => (
        <Link
          key={tab.label}
          href={tab.href}
          className={cn(
            "rounded-md px-4 py-2 text-sm font-medium",
            isActive(tab.href)
              ? "bg-[#8D1231] text-white"
              : "text-gray-700 hover:bg-gray-100",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
