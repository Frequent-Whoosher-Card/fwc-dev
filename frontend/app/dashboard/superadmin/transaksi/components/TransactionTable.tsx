"use client";

import { useState } from "react";
import ConfirmDeleteModal from "./ui/ConfirmDeleteModal";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
  };
  member: {
    name: string;
    identityNumber: string;
  } | null;
  operator: { fullName: string };
  station: { stationName: string };
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
  type: "ALL" | "KAI";
  onPageChange: (page: number) => void;
  onEdit?: (id: string) => void;
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

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);

const formatNIK = (nik?: string | null) => {
  if (!nik) return "-";
  return `FWC${nik}`;
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
}: Props) {
  /* ======================
     DELETE STATE
  ====================== */
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const pageNumbers = Array.from(
    { length: pagination.totalPages },
    (_, i) => i + 1,
  ).slice(Math.max(0, pagination.page - 3), pagination.page + 2);

  /* ======================
     DELETE HANDLER
  ====================== */
  const handleOpenDelete = (id: string) => {
    setSelectedId(id);
    setOpenDelete(true);
  };

  const handleCloseDelete = () => {
    if (deleteLoading) return;
    setOpenDelete(false);
    setSelectedId(null);
  };

  const handleConfirmDelete = async () => {
    if (!selectedId) return;

    try {
      setDeleteLoading(true);

      // 🔴 SESUAIKAN URL API DELETE
      await fetch(`/api/purchases/${selectedId}`, {
        method: "DELETE",
      });

      setOpenDelete(false);
      setSelectedId(null);

      // refresh current page
      onPageChange(pagination.page);
    } catch (error) {
      console.error("Delete failed:", error);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* TABLE */}
      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full text-xs border-collapse">
          <thead className="bg-gray-100">
            <tr className="text-[11px] font-semibold text-gray-600">
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
              <th className="px-4 py-3 text-center">Aksi</th>
            </tr>
          </thead>

          <tbody className="text-gray-700">
            {loading ? (
              <tr>
                <td colSpan={12} className="py-10 text-center text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-10 text-center text-gray-400">
                  No data
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr
                  key={item.id}
                  className="border-t hover:bg-gray-50 transition"
                >
                  <td className="px-4 py-3 truncate">
                    {item.member?.name ?? "-"}
                  </td>

                  <td className="px-4 py-3 font-mono truncate">
                    {formatNIK(item.member?.identityNumber)}
                  </td>

                  <td className="px-4 py-3">
                    {item.card.cardProduct.category.categoryName}
                  </td>

                  <td className="px-4 py-3">
                    {item.card.cardProduct.type.typeName}
                  </td>

                  <td className="px-4 py-3 font-mono truncate">
                    {item.card.serialNumber}
                  </td>

                  <td className="px-4 py-3 font-mono truncate">
                    {formatEDC(item.edcReferenceNumber)}
                  </td>

                  <td className="px-4 py-3 text-right text-[#8D1231] font-medium">
                    {formatCurrency(item.price)}
                  </td>

                  <td className="px-3 py-2 text-center whitespace-nowrap">
                    {formatDate(item.purchaseDate)}
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

                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => onEdit?.(item.id)}
                        className="px-3 py-1 text-xs rounded border border-gray-300 text-gray-700 hover:bg-gray-100"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleOpenDelete(item.id)}
                        className="px-3 py-1 text-xs rounded bg-[#8D1231] text-white hover:bg-[#741026] transition"
                      >
                        Hapus
                      </button>
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
      <ConfirmDeleteModal
        open={openDelete}
        title="Delete Purchase"
        description="Are you sure want to delete this purchase data? This action cannot be undone."
        onCancel={handleCloseDelete}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
