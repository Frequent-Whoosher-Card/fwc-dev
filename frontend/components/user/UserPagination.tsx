import { ChevronLeft, ChevronRight } from "lucide-react";
import { Pagination } from "./types";

interface UserPaginationProps {
  pagination: Pagination;
  setPagination: (
    value: React.SetStateAction<Pagination> | Pagination
  ) => void;
}

export default function UserPagination({
  pagination,
  setPagination,
}: UserPaginationProps) {
  const pageNumbers = Array.from(
    { length: pagination.totalPages },
    (_, i) => i + 1
  ).slice(Math.max(0, pagination.page - 3), pagination.page + 2);

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 px-4 py-4">
      <button
        disabled={pagination.page === 1}
        onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30"
      >
        <ChevronLeft size={16} />
      </button>

      {pageNumbers.map((p) => (
        <button
          key={p}
          onClick={() => setPagination((pg) => ({ ...pg, page: p }))}
          className={`
            flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors
            ${
              p === pagination.page
                ? "bg-[#8D1231] text-white"
                : "text-gray-600 hover:bg-gray-100"
            }
          `}
        >
          {p}
        </button>
      ))}

      <button
        disabled={pagination.page === pagination.totalPages}
        onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
