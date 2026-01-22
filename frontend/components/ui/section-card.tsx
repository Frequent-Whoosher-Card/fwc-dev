/**
 * Section Card Component
 * Reusable card component with title and grid layout
 */

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SectionCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  gridCols?: number;
}

export function SectionCard({
  title,
  children,
  className,
  gridCols = 2,
}: SectionCardProps) {
  return (
    <div className={cn("rounded-md border border-gray-200 p-4", className)}>
      <h3 className="mb-4 text-sm font-semibold text-gray-700">{title}</h3>
      <div
        className={cn(
          "grid gap-4",
          gridCols === 1 && "grid-cols-1",
          gridCols === 2 && "grid-cols-1 md:grid-cols-2",
          gridCols === 3 && "grid-cols-1 md:grid-cols-3",
        )}
      >
        {children}
      </div>
    </div>
  );
}
