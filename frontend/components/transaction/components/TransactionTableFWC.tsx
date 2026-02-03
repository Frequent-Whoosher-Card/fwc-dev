"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, AlertTriangle, CheckCircle } from "lucide-react";

/* ======================
   TYPES
====================== */
interface Purchase {
  id: string;
  purchaseDate: string;
  shiftDate?: string | null;
  price: number;
  edcReferenceNumber: string;
  card: {
    serialNumber: string;
    status: string;
    expiredDate: string | null;
    quotaTicket: number;
    cardProduct: {
      totalQuota: number;
      category: { categoryName: string };
      type: { typeName: string };
    };
  } | null;
  member: {
    name: string;
    identityNumber: string;
    companyName?: string | null;
  } | null;
  operator: { fullName: string };
  station: { stationName: string };
  employeeTypeId?: string | null;
  employeeType?: { code: string; name: string } | null;
}

interface Pagination {
  page: number;
  limit: number;
  totalPages: number;
  total: number;
}

interface Props {
  data: Purchase[];
  loading: boolean;
  pagination: Pagination;
  onPageChange: (page: number) => void;
  onEdit?: (id: string) => void;
  onDelete?: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

/* ======================
   HELPERS
====================== */
const formatDate = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";

const formatDateTime = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);

const formatNIK = (nik?: string | null) => {
  if (!nik) return "-";
  // NIK sudah memiliki prefix "FW" dari database, tampilkan saja langsung
  return nik;
};

const formatEDC = (edc?: string | null) => {
  if (!edc) return "-";
  return `EDC${edc}`;
};

/* ======================
   COMPONENT
====================== */
export default function TransactionTable({
  data,
  loading,
  pagination,
  onPageChange,
  onEdit,
  onDelete,
  canEdit = false,
  canDelete = false,
}: Props) {
  /* ======================
     DELETE STATE
  ====================== */
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Purchase | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");

  const pageNumbers = Array.from(
    { length: pagination.totalPages },
    (_, i) => i + 1,
  ).slice(Math.max(0, pagination.page - 3), pagination.page + 2);

  /* ======================
     DELETE HANDLER
  ====================== */
  const handleOpenDelete = (transaction: Purchase) => {
    setSelectedTransaction(transaction);
    setOpenDelete(true);
  };

  const handleCloseDelete = () => {
    if (deleteLoading) return;
    setOpenDelete(false);
    setSelectedTransaction(null);
    setDeleteReason("");
  };

  const handleConfirmDelete = async () => {
    if (!selectedTransaction) return;

    const trimmed = deleteReason.trim();
    if (!trimmed || trimmed.length < 15) {
      alert("Alasan penghapusan wajib diisi minimal 15 karakter");
      return;
    }

    try {
      setDeleteLoading(true);

      const token = localStorage.getItem("fwc_token");
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

      const response = await fetch(`${API_URL}/purchases/${selectedTransaction.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notes: trimmed }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const msg = errData?.error?.message || errData?.message || "Gagal menghapus transaksi";
        throw new Error(msg);
      }

      setOpenDelete(false);
      setSelectedTransaction(null);
      setDeleteReason("");
      setShowSuccessModal(true);

      if (onDelete) {
        onDelete();
      }
    } catch (error) {
      console.error("Delete failed:", error);
      alert(error instanceof Error ? error.message : "Gagal menghapus transaksi");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* TABLE */}
      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full text-xs border-collapse">
          <thead className="bg- gray-100">
            <tr className="text-[11px] font-semibold text-gray-600">
              <th className="px-4 py-3 text-center w-16">No</th>
              <th className="px-4 py-3 text-left">Customer Name</th>
              <th className="px-4 py-3 text-left">Identity Number</th>
              <th className="px-4 py-3 text-left">Card Category</th>
              <th className="px-4 py-3 text-left">Card Type</th>
              <th className="px-4 py-3 text-left">Serial Number</th>
              <th className="px-4 py-3 text-left">Reference EDC</th>
              <th className="px-4 py-3 text-right">FWC Price</th>
              <th className="px-4 py-3 text-center">Purchase Date</th>
              <th className="px-4 py-3 text-center">Shift Date</th>
              <th className="px-4 py-3 text-left">Operator Name</th>
              <th className="px-4 py-3 text-left">Station</th>
              <th className="px-4 py-3 text-left">Tipe Karyawan</th>
              <th className="px-4 py-3 text-center">Aksi</th>
            </tr>
          </thead>

          <tbody className="text-gray-700">
            {loading ? (
              <tr>
                <td colSpan={14} className="py-10 text-center text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={14} className="py-10 text-center text-gray-400">
                  No data
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr
                  key={item.id}
                  className="border-t hover:bg-gray-50 transition"
                >
                  <td className="px-4 py-3 text-center font-medium text-gray-500">
                    {(pagination.page - 1) * pagination.limit + index + 1}
                  </td>
                  <td className="px-4 py-3 truncate">
                    {item.member?.name ?? "-"}
                  </td>
                  <td className="px-4 py-3 font-mono truncate">
                    {formatNIK(item.member?.identityNumber)}
                  </td>
                  <td className="px-4 py-3">
                    {item.card?.cardProduct?.category?.categoryName ?? "-"}
                  </td>
                  <td className="px-4 py-3">
                    {item.card?.cardProduct?.type?.typeName ?? "-"}
                  </td>
                  <td className="px-4 py-3 font-mono truncate">
                    {item.card?.serialNumber ?? "-"}
                  </td>
                  <td className="px-4 py-3 font-mono truncate">
                    {formatEDC(item.edcReferenceNumber)}
                  </td>
                  <td className="px-4 py-3 text-right text-[#8D1231] font-medium">
                    {formatCurrency(item.price)}
                  </td>
                  <td className="px-3 py-2 text-center whitespace-nowrap">
                    {formatDateTime(item.purchaseDate)}
                  </td>
                  <td className="px-3 py-2 text-center text-gray-500 text-[11px] whitespace-nowrap">
                    {formatDate(item.shiftDate ?? item.purchaseDate)}
                  </td>
                  <td className="px-4 py-3 truncate">
                    {item.operator.fullName}
                  </td>
                  <td className="px-4 py-3 truncate">
                    {item.station.stationName}
                  </td>
                  <td className="px-4 py-3 truncate">
                    {item.employeeType?.name ?? "-"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-2">
                      {canEdit && (
                        <button
                          onClick={() => onEdit?.(item.id)}
                          className="px-3 py-1 text-xs rounded border border-gray-300 text-gray-700 hover:bg-gray-100"
                        >
                          Edit
                        </button>
                      )}

                      {canDelete && (
                        <button
                          onClick={() => handleOpenDelete(item)}
                          className="px-3 py-1 text-xs rounded bg-[#8D1231] text-white hover:bg-[#741026]"
                        >
                          Hapus
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {!loading && data.length > 0 && (
        <div className="flex items-center justify-center gap-3 text-sm text-gray-600">
          <button
            disabled={pagination.page === 1}
            onClick={() => onPageChange(pagination.page - 1)}
            className="disabled:opacity-40"
          >
            <ChevronLeft size={18} />
          </button>

          {pageNumbers.map((p) => (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`px-2 ${
                p === pagination.page
                  ? "font-semibold underline text-gray-900"
                  : "hover:text-gray-900"
              }`}
            >
              {p}
            </button>
          ))}

          <button
            disabled={pagination.page === pagination.totalPages}
            onClick={() => onPageChange(pagination.page + 1)}
            className="disabled:opacity-40"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* DELETE MODAL */}
      {openDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[420px] rounded-2xl bg-white p-6 shadow-xl">
            {/* ICON */}
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="text-red-600" size={22} />
            </div>

            {/* TITLE */}
            <h2 className="text-center text-lg font-semibold text-gray-800">
              Delete Transaction
            </h2>

            <p className="mt-1 text-center text-sm text-gray-600">
              Are you sure you want to delete this transaction?
            </p>

            {/* ALASAN PENGHAPUSAN (wajib) */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alasan penghapusan <span className="text-red-500">*</span>
              </label>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Minimal 15 karakter (wajib diisi)"
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#8D1231] focus:outline-none focus:ring-1 focus:ring-[#8D1231]"
              />
              {deleteReason.trim().length > 0 && deleteReason.trim().length < 15 && (
                <p className="mt-1 text-xs text-amber-600">
                  Minimal 15 karakter
                </p>
              )}
            </div>

            {/* INFO BOX */}
            <div className="mt-4 rounded-lg bg-gray-50 px-4 py-3 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Customer Name</span>
                <span className="max-w-[240px] truncate font-medium text-gray-800">
                  {selectedTransaction?.member?.name || "-"}
                </span>
              </div>

              <div className="mt-1 flex justify-between gap-3">
                <span className="text-gray-500">Serial Number</span>
                <span className="max-w-[240px] truncate font-mono text-gray-800">
                  {selectedTransaction?.card?.serialNumber || "-"}
                </span>
              </div>

              <div className="mt-1 flex justify-between gap-3">
                <span className="text-gray-500">Price</span>
                <span className="max-w-[240px] truncate font-medium text-gray-800">
                  {selectedTransaction ? formatCurrency(selectedTransaction.price) : "-"}
                </span>
              </div>
            </div>

            {/* ACTION */}
            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={handleCloseDelete}
                disabled={deleteLoading}
                className="h-9 w-24 rounded-md bg-gray-100 text-sm text-gray-700 hover:bg-gray-200 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmDelete}
                disabled={deleteLoading || deleteReason.trim().length < 15}
                className="rounded-md bg-[#8D1231] px-5 py-2 text-sm text-white transition hover:bg-[#73122E] active:scale-95 disabled:opacity-50"
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS MODAL */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-[380px] rounded-xl bg-white p-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="text-green-600" size={28} />
            </div>

            <h2 className="text-xl font-semibold">Success</h2>
            <p className="mt-2 text-sm text-gray-600">
              Transaction has been deleted successfully
            </p>

            <button
              onClick={() => {
                setShowSuccessModal(false);
              }}
              className="mt-6 rounded-md bg-[#8B1538] px-6 py-2 text-sm text-white hover:bg-[#73122E]"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
