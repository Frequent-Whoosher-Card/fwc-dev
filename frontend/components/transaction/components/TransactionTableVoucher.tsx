"use client";

import { useState, Fragment, useEffect } from "react";
import { ChevronLeft, ChevronRight, X, AlertTriangle, CheckCircle, Eye } from "lucide-react";
import { deletePurchase, getBulkPurchaseItems, type BulkPurchaseItem } from "@/lib/services/purchase.service";

/* ======================
   TYPES
====================== */

interface VoucherTransaction {
  id: string;
  purchaseDate: string;
  shiftDate?: string | null;
  price: number;
  edcReferenceNumber: string;
  programType?: "FWC" | "VOUCHER" | null;
  card: {
    serialNumber: string;
    cardProduct: {
      category: { categoryName: string };
      type: { typeName: string };
    };
  } | null;
  bulkPurchaseItems?: BulkPurchaseItem[];
  bulkPurchaseItemsCount?: number; // Actual total count from backend

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
  data: VoucherTransaction[];
  loading: boolean;
  pagination: Pagination;
  onPageChange: (page: number) => void;
  onDelete?: () => void;
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

const formatEDC = (edc?: string | null) =>
  edc ? `EDC${edc}` : "-";

/* ======================
   COMPONENT
====================== */
export default function TransactionTableVoucher({
  data,
  loading,
  pagination,
  onPageChange,
  onDelete,
  canDelete = false,
}: Props) {
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<VoucherTransaction | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  
  // Voucher list modal state
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [selectedVoucherTransaction, setSelectedVoucherTransaction] = useState<VoucherTransaction | null>(null);
  const [voucherModalPage, setVoucherModalPage] = useState(1);
  const [voucherItems, setVoucherItems] = useState<BulkPurchaseItem[]>([]);
  const [loadingVoucherItems, setLoadingVoucherItems] = useState(false);
  const [voucherItemsPagination, setVoucherItemsPagination] = useState({
    total: 0,
    page: 1,
    limit: 100,
    totalPages: 1,
  });
  const VOUCHER_PER_PAGE = 100;

  const handleOpenDelete = (transaction: VoucherTransaction) => {
    setSelectedTransaction(transaction);
    setDeleteReason("");
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
      await deletePurchase(selectedTransaction.id, trimmed);
      setOpenDelete(false);
      setSelectedTransaction(null);
      setDeleteReason("");
      setShowSuccessModal(true);
      if (onDelete) onDelete();
    } catch (error) {
      console.error("Delete failed:", error);
      alert(error instanceof Error ? error.message : "Gagal menghapus transaksi voucher");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleOpenVoucherModal = async (transaction: VoucherTransaction) => {
    setSelectedVoucherTransaction(transaction);
    setVoucherModalPage(1);
    setShowVoucherModal(true);
    // Fetch first page of voucher items
    await fetchVoucherItems(transaction.id, 1);
  };

  const handleCloseVoucherModal = () => {
    setShowVoucherModal(false);
    setSelectedVoucherTransaction(null);
    setVoucherModalPage(1);
    setVoucherItems([]);
    setVoucherItemsPagination({
      total: 0,
      page: 1,
      limit: 100,
      totalPages: 1,
    });
  };

  const fetchVoucherItems = async (purchaseId: string, page: number) => {
    try {
      setLoadingVoucherItems(true);
      const result = await getBulkPurchaseItems(purchaseId, {
        page,
        limit: VOUCHER_PER_PAGE,
      });
      setVoucherItems(result.items);
      setVoucherItemsPagination(result.pagination);
    } catch (error) {
      console.error("Error fetching voucher items:", error);
      setVoucherItems([]);
    } finally {
      setLoadingVoucherItems(false);
    }
  };

  // Fetch voucher items when page changes
  useEffect(() => {
    if (showVoucherModal && selectedVoucherTransaction) {
      fetchVoucherItems(selectedVoucherTransaction.id, voucherModalPage);
    }
  }, [voucherModalPage, showVoucherModal, selectedVoucherTransaction]);

  const pageNumbers = Array.from(
    { length: pagination.totalPages },
    (_, i) => i + 1,
  ).slice(Math.max(0, pagination.page - 3), pagination.page + 2);

  return (
    <div className="space-y-4">
      {/* TABLE */}
      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full text-xs border-collapse">
          <thead className="bg-gray-100">
            <tr className="text-[11px] font-semibold text-gray-600">
              <th className="px-4 py-3 text-left">Customer Name</th>
              <th className="px-4 py-3 text-left">Identity Number</th>
              <th className="px-4 py-3 text-left">Perusahaan</th>
              <th className="px-4 py-3 text-left">Voucher Category</th>
              <th className="px-4 py-3 text-left">Voucher Type</th>
              <th className="px-4 py-3 text-left">Serial Number Awal / Quantity</th>
              <th className="px-4 py-3 text-left">Reference EDC</th>
              <th className="px-4 py-3 text-right">Voucher Price</th>
              <th className="px-4 py-3 text-center">Purchase Date</th>
              <th className="px-4 py-3 text-center">Shift Date</th>
              <th className="px-4 py-3 text-left">Operator Name</th>
              <th className="px-4 py-3 text-left">Station</th>
              <th className="px-4 py-3 text-left">Tipe Karyawan</th>
              <th className="px-4 py-3 text-center">Actions</th>
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
              data.map((item) => {
                const isBulkPurchase =
                  item.programType === "VOUCHER" &&
                  item.bulkPurchaseItems &&
                  item.bulkPurchaseItems.length > 0;
                // Use bulkPurchaseItemsCount if available (from backend), otherwise fallback to array length
                const quantity = isBulkPurchase
                  ? (item.bulkPurchaseItemsCount ?? item.bulkPurchaseItems!.length)
                  : 1;

                return (
                  <tr
                    key={item.id}
                    className="border-t hover:bg-gray-50 transition"
                  >
                    <td className="px-4 py-3 truncate">
                      {item.member?.name ?? "-"}
                    </td>

                    <td className="px-4 py-3 font-mono truncate">
                      {item.member?.identityNumber ?? "-"}
                    </td>

                    <td className="px-4 py-3 truncate">
                      {item.member?.companyName ?? "-"}
                    </td>

                    <td className="px-4 py-3">
                      {isBulkPurchase
                        ? item.bulkPurchaseItems![0]?.card.cardProduct.category
                            .categoryName ?? "-"
                        : item.card?.cardProduct?.category?.categoryName ?? "-"}
                    </td>

                    <td className="px-4 py-3">
                      {isBulkPurchase
                        ? item.bulkPurchaseItems![0]?.card.cardProduct.type
                            .typeName ?? "-"
                        : item.card?.cardProduct?.type?.typeName ?? "-"}
                    </td>

                    <td className="px-4 py-3">
                      {isBulkPurchase ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs truncate max-w-[120px]">
                            {item.bulkPurchaseItems![0]?.card.serialNumber ?? "-"}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenVoucherModal(item)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800 hover:bg-blue-200 transition shrink-0"
                          >
                            <Eye size={14} />
                            {quantity} items
                          </button>
                        </div>
                      ) : (
                        <span className="font-mono truncate">
                          {item.card?.serialNumber ?? "-"}
                        </span>
                      )}
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
                      <div className="flex items-center justify-center gap-2">
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => handleOpenDelete(item)}
                            className="px-3 py-1 text-xs rounded bg-[#8D1231] text-white hover:bg-[#741026]"
                          >
                            Hapus
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
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
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="text-red-600" size={22} />
            </div>
            <h2 className="text-center text-lg font-semibold text-gray-800">
              Hapus Transaksi Voucher
            </h2>
            <p className="mt-1 text-center text-sm text-gray-600">
              Yakin ingin menghapus transaksi voucher ini? Kartu akan dikembalikan ke status IN_STATION.
            </p>

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

            <div className="mt-4 rounded-lg bg-gray-50 px-4 py-3 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Customer Name</span>
                <span className="max-w-[240px] truncate font-medium text-gray-800">
                  {selectedTransaction?.member?.name ?? "-"}
                </span>
              </div>
              <div className="mt-1 flex justify-between gap-3">
                <span className="text-gray-500">Jumlah Voucher</span>
                <span className="max-w-[240px] truncate font-medium text-gray-800">
                  {selectedTransaction?.bulkPurchaseItems?.length ?? 0} items
                </span>
              </div>
              <div className="mt-1 flex justify-between gap-3">
                <span className="text-gray-500">Total Price</span>
                <span className="max-w-[240px] truncate font-medium text-gray-800">
                  {selectedTransaction ? formatCurrency(selectedTransaction.price) : "-"}
                </span>
              </div>
            </div>
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={handleCloseDelete}
                disabled={deleteLoading}
                className="h-9 w-24 rounded-md bg-gray-100 text-sm text-gray-700 hover:bg-gray-200 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteLoading || deleteReason.trim().length < 15}
                className="rounded-md bg-[#8D1231] px-5 py-2 text-sm text-white transition hover:bg-[#73122E] active:scale-95 disabled:opacity-50"
              >
                {deleteLoading ? "Menghapus..." : "Hapus"}
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
            <h2 className="text-xl font-semibold">Berhasil</h2>
            <p className="mt-2 text-sm text-gray-600">
              Transaksi voucher berhasil dihapus
            </p>
            <button
              type="button"
              onClick={() => setShowSuccessModal(false)}
              className="mt-4 rounded-md bg-[#8D1231] px-6 py-2 text-sm text-white hover:bg-[#73122E]"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* VOUCHER LIST MODAL */}
      {showVoucherModal && selectedVoucherTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-[90vw] max-w-4xl max-h-[90vh] rounded-xl bg-white shadow-xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  Daftar Voucher
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Total: {selectedVoucherTransaction.bulkPurchaseItemsCount ?? selectedVoucherTransaction.bulkPurchaseItems?.length ?? 0} voucher
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseVoucherModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {loadingVoucherItems ? (
                <div className="text-center py-10 text-gray-400">
                  Loading voucher items...
                </div>
              ) : voucherItems.length > 0 ? (
                <>
                  {/* Info Kategori dan Tipe (sekali saja) */}
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <div>
                        <span className="text-gray-600 font-medium">Kategori:</span>{" "}
                        <span className="text-gray-900">
                          {voucherItems[0]?.card.cardProduct.category.categoryName || "-"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 font-medium">Tipe:</span>{" "}
                        <span className="text-gray-900">
                          {voucherItems[0]?.card.cardProduct.type.typeName || "-"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 font-medium">Harga:</span>{" "}
                        <span className="text-[#8D1231] font-semibold">
                          Rp {voucherItems[0]?.price.toLocaleString("id-ID") || "0"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* List Serial Number */}
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                    {voucherItems.map((bulkItem) => (
                      <div
                        key={bulkItem.id}
                        className="bg-white border border-gray-200 rounded-md p-2 hover:shadow-sm transition text-center"
                      >
                        <div className="font-mono text-[11px] font-semibold text-gray-900 break-all">
                          {bulkItem.card.serialNumber}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {voucherItemsPagination.totalPages > 1 && (
                    <div className="flex items-center justify-center gap-3 mt-6 pt-6 border-t">
                      <button
                        type="button"
                        disabled={voucherModalPage === 1 || loadingVoucherItems}
                        onClick={() => setVoucherModalPage(p => p - 1)}
                        className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft size={18} />
                      </button>

                      <div className="flex items-center gap-2">
                        {Array.from({ length: voucherItemsPagination.totalPages }, (_, i) => i + 1)
                          .filter(page => {
                            const total = voucherItemsPagination.totalPages;
                            return (
                              page === 1 ||
                              page === total ||
                              (page >= voucherModalPage - 1 && page <= voucherModalPage + 1)
                            );
                          })
                          .map((page, idx, arr) => (
                            <Fragment key={page}>
                              {idx > 0 && arr[idx - 1] !== page - 1 && (
                                <span className="px-2 text-gray-400">...</span>
                              )}
                              <button
                                type="button"
                                onClick={() => setVoucherModalPage(page)}
                                disabled={loadingVoucherItems}
                                className={`px-3 py-1 rounded-lg text-sm ${
                                  page === voucherModalPage
                                    ? "bg-[#8D1231] text-white font-semibold"
                                    : "border border-gray-300 hover:bg-gray-50"
                                } disabled:opacity-50`}
                              >
                                {page}
                              </button>
                            </Fragment>
                          ))}
                      </div>

                      <button
                        type="button"
                        disabled={voucherModalPage === voucherItemsPagination.totalPages || loadingVoucherItems}
                        onClick={() => setVoucherModalPage(p => p + 1)}
                        className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  )}

                  {/* Page Info */}
                  <div className="text-center text-xs text-gray-500 mt-4">
                    Menampilkan {((voucherModalPage - 1) * VOUCHER_PER_PAGE) + 1} - {Math.min(voucherModalPage * VOUCHER_PER_PAGE, voucherItemsPagination.total)} dari {voucherItemsPagination.total} voucher
                  </div>
                </>
              ) : (
                <div className="text-center py-10 text-gray-400">
                  Tidak ada voucher
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
