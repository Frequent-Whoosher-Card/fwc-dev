"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Eye, Download } from "lucide-react";
import { useGenerateNumber } from "@/hooks/useGenerateNumber";
import SwitchTab, { SwitchTabItem } from "@/components/SwitchTab";
import { useLanguage } from "@/hooks/useLanguage";

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
    handleExportZip,
  } = useGenerateNumber({ programType });

  const { t } = useLanguage();

  const pageNumbers = pagination
    ? Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
    : [];

  const formatDateDMY = (dateString: string) => {
    const d = new Date(dateString);
    return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
  };

  return (
    <div className="space-y-8">
      {/* 
        REMOVED: SwitchTab 
        Reason: Replaced by global ProductTypeSelector in parent page.
      */}

      {/* FORM */}
      <div className="flex flex-col xl:flex-row gap-8 items-start">
        {/* FORM */}
        <div className="w-full max-w-xl flex-shrink-0 rounded-xl border bg-white p-6 space-y-4">
          <div className="text-sm font-medium text-gray-700">
            {t("choose_product")}
          </div>
          <select
            className="w-full rounded-lg border px-4 py-2 disabled:bg-gray-100"
            value={selectedProductId}
            disabled={loading}
            onChange={(e) => handleSelectProduct(e.target.value)}
          >
            <option value="">{t("select_card_product")}</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.category.categoryName} - {p.type.typeName}
              </option>
            ))}
          </select>

          <div className="text-sm font-medium text-gray-700">
            {t("next_serial_number")}
          </div>
          <input
            className="w-full rounded-lg border px-4 py-2 font-mono bg-gray-100"
            value={startNumber}
            disabled
          />

          <div className="space-y-1">
            <div className="text-sm font-medium text-gray-700">
              {t("quantity_label")}
            </div>
            <input
              className="w-full rounded-lg border px-4 py-2 font-mono disabled:bg-gray-100"
              placeholder={
                programType === "VOUCHER"
                  ? t("placeholder_qty_voucher")
                  : t("placeholder_qty_card")
              }
              value={quantity}
              disabled={loading}
              onChange={(e) => setQuantity(e.target.value.replace(/\D/g, ""))}
            />
            {programType === "VOUCHER" && selectedProduct && (
              <div className="text-xs text-gray-500 px-1">
                {selectedProduct.maxQuantity ? (
                  <div className="grid grid-cols-[70px_10px_1fr] gap-y-1">
                    <span className="text-gray-600">Max Limit</span>
                    <span>:</span>
                    <b>{selectedProduct.maxQuantity.toLocaleString()}</b>

                    <span className="text-gray-600">Terpakai</span>
                    <span>:</span>
                    <b>
                      {(selectedProduct.generatedCount || 0).toLocaleString()}
                    </b>

                    <span className="text-gray-600">Sisa Quota</span>
                    <span>:</span>
                    <b className="text-[#8D1231]">
                      {(
                        selectedProduct.maxQuantity -
                        (selectedProduct.generatedCount || 0)
                      ).toLocaleString()}
                    </b>
                  </div>
                ) : (
                  "No limit: diisi manual"
                )}
              </div>
            )}
          </div>

          {calculatedEndSerial && (
            <div className="text-sm font-mono">
              {t("last_serial")} <b>{calculatedEndSerial}</b>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading || !selectedProductId}
            className="flex items-center justify-center gap-2 rounded-lg bg-[#8D1231] px-6 py-2 text-white disabled:opacity-60 disabled:cursor-not-allowed w-full"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                {t("generating")}
              </>
            ) : (
              t("generate_btn")
            )}
          </button>
        </div>

        {/* SOP / GUIDELINES */}
        <div className="w-full rounded-xl border bg-gray-50/50 p-6 space-y-4 h-fit">
          <div className="flex items-center gap-2 text-[#8D1231] font-semibold border-b border-gray-200 pb-2">
            <div className="p-1.5 bg-[#8D1231]/10 rounded-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6" />
                <path d="M16 13H8" />
                <path d="M16 17H8" />
                <path d="M10 9H8" />
              </svg>
            </div>
            SOP Generate Number {programType === "VOUCHER" ? "Voucher" : "FWC"}
          </div>

          <div className="space-y-4 text-sm text-gray-600">
            <div className="space-y-1">
              <strong className="text-gray-900 block">1. Pilih Produk</strong>
              <p>
                Tentukan kategori dan tipe{" "}
                {programType === "VOUCHER" ? "Voucher" : "Kartu FWC"} yang akan
                di-generate. Pastikan Master Data sudah tersedia.
              </p>
            </div>
            <div className="space-y-1">
              <strong className="text-gray-900 block">
                2.{" "}
                {programType === "VOUCHER"
                  ? "Cek Serial & Kuota"
                  : "Cek Serial"}
              </strong>
              <p>
                Sistem otomatis mengisi <i>Next Serial</i>.
                {programType === "VOUCHER"
                  ? " Perhatikan sisa kuota agar tidak melebihi batas yang ditentukan."
                  : " Pastikan nomor urut serial number sudah sesuai."}
              </p>
            </div>
            <div className="space-y-1">
              <strong className="text-gray-900 block">3. Input Quantity</strong>
              <p>
                Masukkan jumlah{" "}
                {programType === "VOUCHER" ? "Voucher" : "Kartu"} yang
                diinginkan. Cek <i>Last Serial</i> untuk memastikan rentang
                nomor benar.
              </p>
            </div>
            <div className="space-y-1">
              <strong className="text-gray-900 block">
                4. Generate & Download
              </strong>
              <p>
                Tekan tombol Generate. Setelah sukses, download file ZIP (Excel
                + Gambar) dari tabel History di bawah.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-md border border-blue-100 flex gap-2">
              <svg
                className="w-4 h-4 text-blue-500 flex-shrink-0"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" x2="12" y1="8" y2="12" />
                <line x1="12" x2="12.01" y1="16" y2="16" />
              </svg>
              <span>
                Pastikan koneksi internet stabil saat melakukan generate dalam
                jumlah besar.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="rounded-xl border bg-white overflow-hidden">
        {pagination && (
          <div className="flex items-center justify-end px-4 py-3 border-b bg-gray-50">
            <span className="inline-flex items-center gap-2 rounded-lg border border-[#8D1231]/20 bg-[#8D1231]/5 px-3 py-1 text-sm font-medium text-[#8D1231]">
              {t("total_data")}: <b>{pagination.total || 0}</b>
            </span>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[#8D1231] text-white">
              <tr className="text-left uppercase text-xs tracking-wide">
                <th className="px-4 py-3">{t("no")}</th>
                <th className="px-4 py-3">{t("date")}</th>
                <th className="px-4 py-3">{t("category")}</th>
                <th className="px-4 py-3">{t("serial_number")}</th>
                <th className="px-4 py-3 text-center">{t("quantity")}</th>
                <th className="px-4 py-3 text-center">{t("created_by")}</th>
                <th className="px-4 py-3 text-center">{t("discount")}</th>
                <th className="px-4 py-3 text-center">{t("action")}</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {loadingHistory ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-gray-400">
                    {t("loading")}
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-gray-400">
                    {t("no_data")}
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
                            ? t("yes")
                            : t("no_val")
                          : "-"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleExportZip(item.id)}
                            className="rounded border border-green-600 p-1 text-green-600 hover:bg-green-600 hover:text-white transition-colors duration-200"
                            title={t("download_zip")}
                          >
                            <Download size={18} />
                          </button>
                          <button
                            onClick={() =>
                              router.push(
                                `/dashboard/superadmin/generatenumber/${item.id}/view`,
                              )
                            }
                            className="rounded border border-[#8D1231] p-1 text-[#8D1231] hover:bg-[#8D1231] hover:text-white transition-colors duration-200"
                            title={t("view_detail")}
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="rounded border border-red-600 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-600 hover:text-white transition-colors duration-200"
                          >
                            {t("hapus")}
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
            <span className="text-sm font-medium">{t("generating")}</span>
          </div>
        </div>
      )}
    </div>
  );
}
