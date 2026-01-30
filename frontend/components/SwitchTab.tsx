"use client";

import { usePathname, useRouter } from "next/navigation";

export interface SwitchTabItem {
  label: string;
  path: string;
  /**
   * Optional custom matcher
   * contoh: /\/fwc/
   */
  match?: RegExp;
}

interface Props {
  items: SwitchTabItem[];
}

export default function SwitchTab({ items }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const baseBtn =
    "px-4 py-2 text-sm font-medium transition-colors focus:outline-none";

  return (
    <div className="flex w-fit overflow-hidden rounded-lg border shadow-sm">
      {items.map((item, index) => {
        const isActive = item.match
          ? item.match.test(pathname)
          : pathname.startsWith(item.path);

        const isFirst = index === 0;
        const isLast = index === items.length - 1;

        return (
          <button
            key={item.label}
            onClick={() => router.push(item.path)}
            className={[
              baseBtn,
              "flex-1 min-w-[100px] text-center px-4",
              isActive
                ? "bg-[#8D1231] text-white"
                : "bg-white text-gray-700 hover:bg-gray-50",
              isFirst && "rounded-l-lg",
              isLast && "rounded-r-lg border-l",
              !isFirst && !isLast && "border-l",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
