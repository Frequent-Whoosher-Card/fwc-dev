"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { useGenerateNumber } from "@/hooks/useGenerateNumber";
import SwitchTab, { SwitchTabItem } from "@/components/SwitchTab";

interface BaseGenerateNumberProps {
  title: string;
  programType?: string;
}

export default function BaseGenerateNumber({
  title,
  programType,
}: BaseGenerateNumberProps) {
  const router = useRouter();
  const {
    products,
    selectedProductId,
    selectedProduct,
    startNumber,
    quantity,
    setQuantity,
    loading,
    history,
    loadingHistory,
    page,
    pagination,
    calculatedEndSerial,
    handleSelectProduct,
    handleGenerate,
    fetchHistory,
    handleDelete,
  } = useGenerateNumber({ programType });

  const tabs: SwitchTabItem[] = [
    { label: "FWC", path: "/dashboard/superadmin/generatenumber/fwc" },
    { label: "Voucher", path: "/dashboard/superadmin/generatenumber/voucher" },
  ];

  const pageNumbers = pagination
    ? Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
    : [];

  const formatDateDMY = (dateString: string) => {
    const d = new Date(dateString);
    return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        <SwitchTab items={tabs} />
      </div>

      {/* FORM */}
      <div className="rounded-xl border bg-white p-6 space-y-4 max-w-xl">
        <div className="text-sm font-medium text-gray-700">Pilih Product:</div>
        <select
          className="w-full rounded-lg border px-4 py-2 disabled:bg-gray-100"
          value={selectedProductId}
          disabled={loading}
          onChange={(e) => handleSelectProduct(e.target.value)}
        >
          <option value="">-- Pilih Card Product --</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.category.categoryName} - {p.type.typeName}
            </option>
          ))}
        </select>

        <div className="text-sm font-medium text-gray-700">
          Next Serial Number:
        </div>
        <input
          className="w-full rounded-lg border px-4 py-2 font-mono bg-gray-100"
          value={startNumber}
          disabled
        />

        <div className="space-y-1">
          <div className="text-sm font-medium text-gray-700">Jumlah:</div>
          <input
            className="w-full rounded-lg border px-4 py-2 font-mono disabled:bg-gray-100"
            placeholder={
              programType === "VOUCHER" ? "Jumlah generate" : "Jumlah kartu"
            }
            value={quantity}
            disabled={loading}
            onChange={(e) => setQuantity(e.target.value.replace(/\D/g, ""))}
          />
          {programType === "VOUCHER" && selectedProduct && (
            <div className="text-xs text-gray-500 px-1">
              {selectedProduct.maxQuantity ? (
                <div className="flex flex-col gap-1">
                  <span>
                    Max Limit:{" "}
                    <b>{selectedProduct.maxQuantity.toLocaleString()}</b>
                  </span>
                  <span>
                    Terpakai:{" "}
                    <b>
                      {(selectedProduct.generatedCount || 0).toLocaleString()}
                    </b>
                  </span>
                  <span>
                    Sisa Quota:{" "}
                    <b className="text-[#8D1231]">
                      {(
                        selectedProduct.maxQuantity -
                        (selectedProduct.generatedCount || 0)
                      ).toLocaleString()}
                    </b>
                  </span>
                </div>
              ) : (
                "No limit: diisi manual"
              )}
            </div>
          )}
        </div>

        {calculatedEndSerial && (
          <div className="text-sm font-mono">
            Serial terakhir: <b>{calculatedEndSerial}</b>
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={loading || !selectedProductId}
          className="flex items-center justify-center gap-2 rounded-lg bg-[#8D1231] px-6 py-2 text-white disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Generating...
            </>
          ) : (
            "Generate"
          )}
        </button>
      </div>

      {/* TABLE */}
      <div className="rounded-xl border bg-white overflow-hidden">
        {pagination && (
          <div className="flex items-center justify-end px-4 py-3 border-b bg-gray-50">
            <span className="inline-flex items-center gap-2 rounded-lg border border-[#8D1231]/20 bg-[#8D1231]/5 px-3 py-1 text-sm font-medium text-[#8D1231]">
              Total Data: <b>{pagination.total || 0}</b>
            </span>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr className="text-left text-gray-600 uppercase text-xs tracking-wide">
                <th className="px-4 py-3">No</th>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Serial</th>
                <th className="px-4 py-3 text-center">Qty</th>
                <th className="px-4 py-3 text-center">Created By</th>
                <th className="px-4 py-3 text-center">Diskon</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {loadingHistory ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-gray-400">
                    Belum ada data
                  </td>
                </tr>
              ) : (
                history.map((item, index) => {
                  const isDiscount =
                    programType === "VOUCHER"
                      ? products.find(
                          (p) =>
                            p.category.categoryName === item.category?.name &&
                            p.type.typeName === item.type?.name,
                        )?.isDiscount
                      : false;

                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        {(pagination.page - 1) * pagination.limit + index + 1}
                      </td>
                      <td className="px-4 py-3">
                        {formatDateDMY(item.movementAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{item.category?.name}</div>
                        <div className="text-xs text-gray-500">
                          {item.type?.name}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {item.serialNumbers?.[0]} –{" "}
                        {item.serialNumbers?.[item.serialNumbers.length - 1]}
                      </td>
                      <td className="px-4 py-3 text-center">{item.quantity}</td>
                      <td className="px-4 py-3 text-center text-gray-500">
                        {item.createdByName || "-"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {programType === "VOUCHER"
                          ? isDiscount
                            ? "Ya"
                            : "Tidak"
                          : "-"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() =>
                              router.push(
                                `/dashboard/superadmin/generatenumber/${(programType || "fwc").toLowerCase()}/${item.id}/view`,
                              )
                            }
                            className="rounded border border-[#8D1231] p-1 text-[#8D1231] hover:bg-red-50"
                            title="View Detail"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="rounded border border-red-600 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                          >
                            Hapus
                          </button>
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
        {pagination && pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2 text-sm py-4 border-t">
            <button
              disabled={page === 1}
              onClick={() => fetchHistory(page - 1)}
              className="p-1 disabled:opacity-40 hover:bg-gray-100 rounded transition-colors"
            >
              <ChevronLeft size={18} />
            </button>

            {pageNumbers.map((p) => (
              <button
                key={p}
                onClick={() => fetchHistory(p)}
                className={`px-3 py-1 rounded transition-colors ${
                  p === page
                    ? "bg-[#8D1231] text-white font-semibold"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {p}
              </button>
            ))}

            <button
              disabled={page === pagination.totalPages}
              onClick={() => fetchHistory(page + 1)}
              className="p-1 disabled:opacity-40 hover:bg-gray-100 rounded transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      {/* GLOBAL LOADING OVERLAY */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="flex items-center gap-3 rounded-lg bg-white px-6 py-4 shadow-lg">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-[#8D1231]" />
            <span className="text-sm font-medium">Generating serial...</span>
          </div>
        </div>
      )}
    </div>
  );
}
