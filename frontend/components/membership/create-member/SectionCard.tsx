"use client";

import { cn } from "@/lib/utils";

export function SectionCard({
  title,
  children,
  className,
  gridCols = 2,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  gridCols?: number;
}) {
  return (
    <div className={cn("md:col-span-2 rounded-md border border-gray-200 p-4 w-full", className)}>
      <h3 className="mb-4 text-sm font-semibold text-gray-700">{title}</h3>
      <div
        className={cn(
          "gap-4 items-start w-full",
          gridCols === 1 && "flex flex-col",
          gridCols === 2 && "grid grid-cols-1 md:grid-cols-2",
          gridCols === 3 && "grid grid-cols-1 md:grid-cols-3",
        )}
      >
        {children}
      </div>
    </div>
  );
}
