import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  // if (totalPages <= 1) return null; // Showing for demo/dev as per user request to see layout

  // Simple range logic: always show first, last, and window around current
  // For simplicity given the requirements, I'll show max 5 items sliding
  
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
       for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
       // Always show 1
       pages.push(1);
       
       let start = Math.max(2, currentPage - 1);
       let end = Math.min(totalPages - 1, currentPage + 1);

       if (currentPage <= 3) {
           start = 2;
           end = 4;
       } else if (currentPage >= totalPages - 2) {
           start = totalPages - 3;
           end = totalPages - 1;
       }

       if (start > 2) pages.push("...");
       for (let i = start; i <= end; i++) pages.push(i);
       if (end < totalPages - 1) pages.push("...");
       
       pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-2 py-4">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-1 rounded hover:bg-gray-100 text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft size={24} strokeWidth={1.5} />
      </button>

      <div className="flex items-center gap-1">
        {getPageNumbers().map((page, idx) => (
          typeof page === 'number' ? (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`h-9 min-w-[36px] px-3 rounded-lg text-sm font-semibold transition-all ${
                currentPage === page
                  ? "bg-[#8D1231] text-white shadow-md"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              {page}
            </button>
          ) : (
            <span key={`dots-${idx}`} className="text-gray-400 px-1">...</span>
          )
        ))}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-1 rounded hover:bg-gray-100 text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight size={24} strokeWidth={1.5} />
      </button>
    </div>
  );
}
