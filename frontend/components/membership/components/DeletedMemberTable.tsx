"use client";

import { useState } from "react";

export interface DeletedMemberItem {
  id: string;
  name: string;
  identityNumber: string;
  nationality?: string | null;
  email?: string | null;
  phone?: string | null;
  nippKai?: string | null;
  gender?: string | null;
  alamat?: string | null;
  notes?: string | null;
  companyName?: string | null;
  employeeTypeId?: string | null;
  deletedAt?: string;
  deletedByName?: string | null;
  employeeType?: { id: string; code: string; name: string } | null;
}

interface DeletedMemberTableProps {
  data: DeletedMemberItem[];
  isLoading: boolean;
  noDataMessage?: string;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
}

export default function DeletedMemberTable({
  data,
  isLoading,
  noDataMessage,
  currentPage,
  totalPages,
  totalCount,
  onPageChange,
}: DeletedMemberTableProps) {
  const [openNotesId, setOpenNotesId] = useState<string | null>(null);
  const [notesContent, setNotesContent] = useState<string | null>(null);

  const handleViewNotes = (item: DeletedMemberItem) => {
    setOpenNotesId(item.id);
    setNotesContent(item.notes || "-");
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

  const genderLabel = (g?: string | null) => {
    if (!g) return "-";
    return g === "L" ? "Laki-laki" : g === "P" ? "Perempuan" : g;
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
      <div className="overflow-x-auto border border-t-0 border-red-200 rounded-b-lg scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        <table className="min-w-[1000px] md:min-w-full text-sm">
          <thead>
            <tr className="bg-red-50/50 border-b border-red-100">
              <th className="px-2 md:px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">
                Tanggal Dihapus
              </th>
              <th className="px-2 md:px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">
                Nama
              </th>
              <th className="px-2 md:px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">
                NIK
              </th>
              <th className="px-2 md:px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">
                Email
              </th>
              <th className="px-2 md:px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">
                Telepon
              </th>
              <th className="px-2 md:px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">
                Gender
              </th>
              <th className="px-2 md:px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">
                Alamat
              </th>
              <th className="px-2 md:px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">
                Perusahaan
              </th>
              <th className="px-2 md:px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">
                Tipe Karyawan
              </th>
              <th className="px-2 md:px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">
                Dihapus Oleh
              </th>
              <th className="px-2 md:px-4 py-3 text-center font-semibold text-gray-700 whitespace-nowrap">
                Alasan Hapus
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={11} className="px-4 py-8 text-center text-gray-500">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600" />
                  </div>
                </td>
              </tr>
            ) : !data || data.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-4 py-8 text-center text-gray-500">
                  {noDataMessage || "Tidak ada data yang dihapus"}
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-gray-100 hover:bg-red-50 transition"
                >
                  <td className="px-2 md:px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                    {item.deletedAt ? formatDate(item.deletedAt) : "-"}
                  </td>
                  <td className="px-2 md:px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                    {item.name || "-"}
                  </td>
                  <td className="px-2 md:px-4 py-3 text-sm text-gray-900 whitespace-nowrap font-mono">
                    {item.identityNumber || "-"}
                  </td>
                  <td className="px-2 md:px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                    {item.email || "-"}
                  </td>
                  <td className="px-2 md:px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                    {item.phone || "-"}
                  </td>
                  <td className="px-2 md:px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                    {genderLabel(item.gender)}
                  </td>
                  <td className="px-2 md:px-4 py-3 text-sm text-gray-900 max-w-[200px] truncate">
                    {item.alamat || "-"}
                  </td>
                  <td className="px-2 md:px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                    {item.companyName || "-"}
                  </td>
                  <td className="px-2 md:px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                    {item.employeeType?.name || "-"}
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
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-600">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
            className="px-2 disabled:opacity-40 hover:text-red-700 transition"
          >
            Previous
          </button>
          {pageNumbers.map((p) => (
            <button
              type="button"
              key={p}
              onClick={() => onPageChange(p)}
              className={`px-3 py-1 rounded ${
                p === currentPage
                  ? "bg-red-100 text-red-800 font-semibold"
                  : "hover:bg-gray-100"
              }`}
            >
              {p}
            </button>
          ))}
          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() =>
              currentPage < totalPages && onPageChange(currentPage + 1)
            }
            className="px-2 disabled:opacity-40 hover:text-red-700 transition"
          >
            Next
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
