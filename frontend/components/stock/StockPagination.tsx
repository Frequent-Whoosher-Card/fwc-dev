"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface StockPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function StockPagination({
  currentPage,
  totalPages,
  onPageChange,
}: StockPaginationProps) {
  const getPaginationRange = (
    current: number,
    total: number,
    delta = 2,
  ): (number | "...")[] => {
    if (total <= 1) return [1];

    const range: (number | "...")[] = [];
    range.push(1);

    const left = Math.max(2, current - delta);
    const right = Math.min(total - 1, current + delta);

    if (left > 2) range.push("...");
    for (let i = left; i <= right; i++) range.push(i);
    if (right < total - 1) range.push("...");
    if (total > 1) range.push(total);

    return range;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="mt-4 flex justify-center gap-1 text-sm">
      <button
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="px-2 py-1 rounded disabled:opacity-40 hover:bg-gray-100 transition-colors"
      >
        <ChevronLeft size={18} />
      </button>

      {getPaginationRange(currentPage, totalPages).map((p, idx) =>
        p === "..." ? (
          <span key={idx} className="px-2 py-1 text-gray-500">
            …
          </span>
        ) : (
          <button
            key={idx}
            onClick={() => onPageChange(p)}
            className={`px-3 py-1 rounded transition-colors ${
              p === currentPage
                ? "bg-[#8D1231] text-white font-semibold"
                : "hover:bg-gray-100"
            }`}
          >
            {p}
          </button>
        ),
      )}

      <button
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="px-2 py-1 rounded disabled:opacity-40 hover:bg-gray-100 transition-colors"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
