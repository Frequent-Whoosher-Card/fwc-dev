"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useStockInForm } from "@/hooks/useStockInForm";
import StockSopCard from "./StockSopCard";

interface BaseStockInAddProps {
  programType: "FWC" | "VOUCHER";
}

export default function BaseStockInAdd({ programType }: BaseStockInAddProps) {
  const router = useRouter();
  const {
    form,
    setForm,
    products,
    loadingSerial,
    saving,
    fetchAvailableSerial,
    handleSubmit,
    maxAvailableSerial,
    handleQuantityChange,
    handleEndSerialChange,
    isOverLimit,
    vcrSettleFile, // [NEW]
    setVcrSettleFile, // [NEW]
  } = useStockInForm({ programType });

  const sopItems = [
    "Penambahan Serial Number manual tidak dapat dilakukan jika stok dari hasil generate sebelumnya belum habis digunakan.",
    "Jika terdapat kartu rusak dalam satu batch generate, kartu tersebut wajib tetap di-input ke Stock In, kemudian ubah statusnya menjadi 'Damaged'.",
  ];

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex items-center gap-4 px-6">
        <button
          onClick={() => router.back()}
          className="rounded-lg border p-2 hover:bg-gray-100"
        >
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-lg font-semibold">Add Stock-In ({programType})</h2>
      </div>

      {/* CONTENT GRID */}
      <div className="px-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* FORM */}
        <div className="lg:col-span-2 rounded-xl border bg-white p-6 space-y-6">
          {/* DATE */}
          <div>
            <label className="text-sm font-medium">Date</label>
            <input
              type="date"
              className="w-full rounded-lg border px-4 py-2"
              value={form.tanggal}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  tanggal: e.target.value,
                }))
              }
            />
          </div>

          {/* CARD PRODUCT */}
          <div>
            <label className="text-sm font-medium">Card Product</label>
            <select
              className="w-full rounded-lg border px-4 py-2"
              value={form.productId}
              onChange={(e) => {
                const productId = e.target.value;

                setForm((prev) => ({
                  ...prev,
                  productId,
                  initialSerial: "",
                  lastSerial: "",
                }));

                if (productId) {
                  fetchAvailableSerial(productId);
                }
              }}
            >
              <option value="">-- Pilih Card Product --</option>
              {products
                .filter((p) => p.isActive !== false)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.category?.categoryName} - {p.type?.typeName}
                  </option>
                ))}
            </select>
          </div>

          {/* SERIAL & QUANTITY */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Initial Serial</label>
              <input
                className="w-full rounded-lg border px-4 py-2 bg-gray-50"
                value={form.initialSerial}
                disabled
                placeholder={
                  loadingSerial ? "Loading..." : "Otomatis dari stok tersedia"
                }
              />
            </div>

            <div>
              <label className="text-sm font-medium">Jumlah (Qty)</label>
              <input
                type="number"
                className="w-full rounded-lg border px-4 py-2"
                value={form.quantity}
                onChange={(e) => handleQuantityChange(e.target.value)}
                placeholder="Masukkan jumlah kartu"
                disabled={!form.productId}
                max={10000}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Last Serial</label>
              <input
                className={`w-full rounded-lg border px-4 py-2 ${
                  isOverLimit ? "border-red-500 bg-red-50 text-red-700" : ""
                }`}
                value={form.lastSerial}
                onChange={(e) => handleEndSerialChange(e.target.value)}
                disabled={!form.productId}
                placeholder="Masukkan full serial atau suffix"
              />
              {isOverLimit && (
                <p className="mt-1 text-xs text-red-600 font-medium">
                  Last serial melebihi ketersediaan.
                </p>
              )}
              {maxAvailableSerial && !isOverLimit && (
                <p className="mt-1 text-xs text-gray-500">
                  Tersedia sampai serial:{" "}
                  <span className="font-mono">{maxAvailableSerial}</span>
                </p>
              )}
            </div>
          </div>

          {/* NEW FIELDS SEPARATOR */}
          <div className="border-t pt-4"></div>

          {/* VENDOR NAME */}
          <div>
            <label className="text-sm font-medium">Vendor Name</label>
            <input
              className="w-full rounded-lg border px-4 py-2"
              value={form.vendorName}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, vendorName: e.target.value }))
              }
              placeholder="Masukkan nama vendor (Optional)"
            />
          </div>

          {/* VCR SETTLE & COSTS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">VCR Settle Number</label>
              <input
                className="w-full rounded-lg border px-4 py-2"
                value={form.vcrSettle}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, vcrSettle: e.target.value }))
                }
                placeholder="Nomor VCR Settle"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Biaya Produksi (Rp)</label>
              <input
                type="number"
                className="w-full rounded-lg border px-4 py-2"
                value={form.costs}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, costs: e.target.value }))
                }
                placeholder="0"
              />
            </div>
          </div>

          {/* FILE UPLOAD FOR VCR SETTLE */}
          <div>
            <label className="text-sm font-medium">
              Bukti VCR Settle (PDF/Image)
            </label>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setVcrSettleFile(e.target.files[0]);
                  }
                }}
                className="w-full rounded-lg border px-4 py-2 file:mr-4 file:rounded-full file:border-0 file:bg-[#8D1231]/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#8D1231] hover:file:bg-[#8D1231]/20"
              />
              {vcrSettleFile && (
                <button
                  onClick={() => setVcrSettleFile(null)}
                  className="text-xs text-red-600 hover:underline"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          {/* SUBMIT */}
          <div className="flex justify-end pt-4">
            <button
              onClick={handleSubmit}
              disabled={saving || isOverLimit}
              className="rounded-lg bg-[#8D1231] px-8 py-2 text-white hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Loading..." : "Add Stock"}
            </button>
          </div>
        </div>

        {/* SOP SIDEBAR */}
        <div className="lg:col-span-1">
          <StockSopCard items={sopItems} title="SOP Stock In" />
        </div>
      </div>
    </div>
  );
}
