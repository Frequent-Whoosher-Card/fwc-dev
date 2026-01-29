"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";

/* ======================
   TYPES
====================== */
interface BulkPurchaseItem {
  id: string;
  cardId: string;
  price: number;
  card: {
    id: string;
    serialNumber: string;
    cardProduct: {
      category: { categoryName: string };
      type: { typeName: string };
    };
  };
}

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
  data: VoucherTransaction[];
  loading: boolean;
  pagination: Pagination;
  onPageChange: (page: number) => void;
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
}: Props) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

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
              <th className="px-4 py-3 text-left w-12"></th>
              <th className="px-4 py-3 text-left">Customer Name</th>
              <th className="px-4 py-3 text-left">Identity Number</th>
              <th className="px-4 py-3 text-left">Voucher Category</th>
              <th className="px-4 py-3 text-left">Voucher Type</th>
              <th className="px-4 py-3 text-left">Serial Number / Quantity</th>
              <th className="px-4 py-3 text-left">Reference EDC</th>
              <th className="px-4 py-3 text-right">Voucher Price</th>
              <th className="px-4 py-3 text-center">Purchase Date</th>
              <th className="px-4 py-3 text-center">Shift Date</th>
              <th className="px-4 py-3 text-left">Operator Name</th>
              <th className="px-4 py-3 text-left">Station</th>
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
              data.map((item) => {
                const isBulkPurchase =
                  item.programType === "VOUCHER" &&
                  item.bulkPurchaseItems &&
                  item.bulkPurchaseItems.length > 0;
                const isExpanded = expandedRows.has(item.id);
                const quantity = isBulkPurchase
                  ? item.bulkPurchaseItems!.length
                  : 1;

                return (
                  <>
                    <tr
                      key={item.id}
                      className="border-t hover:bg-gray-50 transition"
                    >
                      <td className="px-2 py-3 text-center">
                        {isBulkPurchase && (
                          <button
                            type="button"
                            onClick={() => toggleRow(item.id)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            {isExpanded ? (
                              <ChevronUp size={16} />
                            ) : (
                              <ChevronDown size={16} />
                            )}
                          </button>
                        )}
                      </td>

                      <td className="px-4 py-3 truncate">
                        {item.member?.name ?? "-"}
                      </td>

                      <td className="px-4 py-3 font-mono truncate">
                        {item.member?.identityNumber ?? "-"}
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

                      <td className="px-4 py-3 font-mono">
                        {isBulkPurchase ? (
                          <span className="inline-flex items-center gap-1">
                            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                              {quantity} items
                            </span>
                            {!isExpanded && (
                              <span className="text-gray-500 text-[10px]">
                                ({item.bulkPurchaseItems![0]?.card.serialNumber}
                                {quantity > 1 ? ` +${quantity - 1}` : ""})
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="truncate">
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
                    </tr>

                    {/* Expanded bulk purchase items */}
                    {isBulkPurchase && isExpanded && (
                      <tr key={`${item.id}-expanded`} className="bg-gray-50">
                        <td colSpan={12} className="px-4 py-3">
                          <div className="space-y-2">
                            <div className="text-xs font-semibold text-gray-600 mb-2">
                              Voucher Items ({quantity}):
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                              {item.bulkPurchaseItems!.map((bulkItem, idx) => (
                                <div
                                  key={bulkItem.id}
                                  className="bg-white border rounded p-2 text-xs"
                                >
                                  <div className="font-mono">
                                    {idx + 1}. {bulkItem.card.serialNumber}
                                  </div>
                                  <div className="text-gray-600 mt-1">
                                    {bulkItem.card.cardProduct.category.categoryName}{" "}
                                    - {bulkItem.card.cardProduct.type.typeName}
                                  </div>
                                  <div className="text-[#8D1231] font-medium mt-1">
                                    Rp {bulkItem.price.toLocaleString("id-ID")}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
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
    </div>
  );
}
