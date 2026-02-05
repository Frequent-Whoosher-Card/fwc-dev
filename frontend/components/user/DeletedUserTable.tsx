import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface DeletedUserItem {
  id: string;
  fullname: string;
  nip: string;
  username: string;
  email: string;
  phone: string;
  roleLabel: string;
  station: string;
  deletedAt?: string;
  deletedByName?: string | null;
  notes?: string | null;
}

interface DeletedUserTableProps {
  data: DeletedUserItem[];
  isLoading: boolean;
  noDataMessage?: string;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
}

export default function DeletedUserTable({
  data,
  isLoading,
  noDataMessage,
  currentPage,
  totalPages,
  totalCount,
  onPageChange,
}: DeletedUserTableProps) {
  const [openNotesId, setOpenNotesId] = useState<string | null>(null);
  const [notesContent, setNotesContent] = useState<string | null>(null);

  const handleViewNotes = (item: DeletedUserItem) => {
    setOpenNotesId(item.id);
    setNotesContent(
      item.notes || "Tidak ada alasan yang terekam (Data backend belum tersedia)"
    );
  };

  const handleCloseNotes = () => {
    setOpenNotesId(null);
    setNotesContent(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1).slice(
    Math.max(0, currentPage - 3),
    currentPage + 2
  );

  return (
    <div className="w-full mt-8">
      <div className="bg-red-50 px-4 py-3 border border-red-200 rounded-t-lg flex justify-between items-center">
        <h3 className="text-red-800 font-semibold">Riwayat Penghapusan</h3>
        <span className="text-xs font-semibold text-red-700 bg-red-100 px-2 py-1 rounded border border-red-200">
          Total Data : {totalCount}
        </span>
      </div>
      <div className="overflow-x-auto border-t-0 rounded-b-lg pb-4 [&::-webkit-scrollbar]:h-3 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-400 [&::-webkit-scrollbar-track]:bg-gray-100">
        <table className="min-w-[1500px] text-sm md:min-w-[1200px] border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-semibold uppercase text-gray-600">
              <th className="px-2 md:px-4 py-3 text-left whitespace-nowrap">
                Tanggal Dihapus
              </th>
              <th className="px-2 md:px-4 py-3 text-left whitespace-nowrap">
                Nama
              </th>
              <th className="px-2 md:px-4 py-3 text-left whitespace-nowrap">
                NIP
              </th>
              <th className="px-2 md:px-4 py-3 text-left whitespace-nowrap">
                Username
              </th>
              <th className="px-2 md:px-4 py-3 text-left whitespace-nowrap">
                Email
              </th>
              <th className="px-2 md:px-4 py-3 text-left whitespace-nowrap">
                Phone
              </th>
              <th className="px-2 md:px-4 py-3 text-left whitespace-nowrap">
                Role
              </th>
              <th className="px-2 md:px-4 py-3 text-left whitespace-nowrap">
                Stasiun
              </th>
              <th className="px-2 md:px-4 py-3 text-left whitespace-nowrap">
                Dihapus Oleh
              </th>
              <th className="px-2 md:px-4 py-3 text-center whitespace-nowrap">
                Alasan Hapus
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600" />
                  </div>
                </td>
              </tr>
            ) : !data || data.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                  {noDataMessage || "Tidak ada data yang dihapus"}
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-gray-200 hover:bg-gray-50 transition"
                >
                  <td className="px-2 md:px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                    {item.deletedAt ? formatDate(item.deletedAt) : "-"}
                  </td>
                  <td className="px-2 md:px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                    {item.fullname || "-"}
                  </td>
                  <td className="px-2 md:px-4 py-3 text-sm text-gray-900 whitespace-nowrap font-mono">
                    {item.nip || "-"}
                  </td>
                  <td className="px-2 md:px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                    {item.username || "-"}
                  </td>
                  <td className="px-2 md:px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                    {item.email || "-"}
                  </td>
                  <td className="px-2 md:px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                    {item.phone || "-"}
                  </td>
                  <td className="px-2 md:px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                    {item.roleLabel || "-"}
                  </td>
                  <td className="px-2 md:px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                    {item.station || "-"}
                  </td>
                  <td className="px-2 md:px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                    {item.deletedByName || "-"}
                  </td>
                  <td className="px-2 md:px-4 py-3 text-center whitespace-nowrap">
                    {item.notes ? (
                      <button
                        type="button"
                        className="px-3 py-1 rounded text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 transition"
                        onClick={() => handleViewNotes(item)}
                      >
                        Lihat Alasan
                      </button>
                    ) : (
                      <span className="text-gray-400 text-xs italic">
                        Tanpa Alasan
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!isLoading && totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-2 px-4 py-4">
          <button
            disabled={currentPage === 1}
            onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30"
          >
            <ChevronLeft size={16} />
          </button>

          {pageNumbers.map((p) => (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`
                flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors
                ${
                  p === currentPage
                    ? "bg-[#8D1231] text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }
              `}
            >
              {p}
            </button>
          ))}

          <button
            disabled={currentPage === totalPages}
            onClick={() =>
              currentPage < totalPages && onPageChange(currentPage + 1)
            }
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {openNotesId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <h2 className="text-lg font-semibold mb-4 text-red-800">
              Alasan Penghapusan
            </h2>
            <div className="mb-6 whitespace-pre-line text-gray-800 bg-gray-50 p-4 rounded border border-gray-200 min-h-[100px]">
              {notesContent}
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
                onClick={handleCloseNotes}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
