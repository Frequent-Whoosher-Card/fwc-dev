"use client";

import { usePathname, useRouter } from "next/navigation";

export interface SwitchTabItem {
  label: string;
  path?: string; // Optional if using state-based
  value?: string; // For state-based
  /**
   * Optional custom matcher
   * contoh: /\/fwc/
   */
   match?: RegExp;
  count?: number;
}

interface Props {
  items: SwitchTabItem[];
  activeValue?: string; // Optional: if provided, uses state instead of URL
  onValueChange?: (value: string) => void;
}

export default function SwitchTab({
  items,
  activeValue,
  onValueChange,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const baseBtn =
    "px-4 py-2 text-sm font-medium transition-colors focus:outline-none flex items-center gap-2";

  return (
    <div className="flex w-fit max-w-full overflow-x-auto rounded-lg border shadow-sm">
      {items.map((item, index) => {
        const isStateBased =
          activeValue !== undefined && onValueChange !== undefined;

        const isActive = isStateBased
          ? item.value === activeValue
          : item.match
            ? item.match.test(pathname)
            : item.path && pathname.startsWith(item.path);

        const isFirst = index === 0;
        const isLast = index === items.length - 1;

        const handleClick = () => {
          if (isStateBased && item.value) {
            onValueChange(item.value);
          } else if (item.path) {
            router.push(item.path);
          }
        };

        return (
          <button
            key={item.label}
            onClick={handleClick}
            className={[
              baseBtn,
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
            {item.count !== undefined && item.count > 0 && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${
                  isActive
                    ? "bg-white text-[#8D1231] border-white"
                    : "bg-[#8D1231] text-white border-[#8D1231]"
                }`}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
