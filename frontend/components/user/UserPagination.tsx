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
    <div
      className="
  flex flex-wrap items-center justify-center gap-3
  px-4 text-sm
"
    >
      <button
        disabled={pagination.page === 1}
        onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
      >
        <ChevronLeft size={18} />
      </button>

      {pageNumbers.map((p) => (
        <button
          key={p}
          onClick={() => setPagination((pg) => ({ ...pg, page: p }))}
          className={p === pagination.page ? "font-semibold underline" : ""}
        >
          {p}
        </button>
      ))}

      <button
        disabled={pagination.page === pagination.totalPages}
        onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
