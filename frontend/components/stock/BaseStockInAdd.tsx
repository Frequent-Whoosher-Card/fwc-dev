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
  } = useStockInForm({ programType });

  const sopItems = [
    "Saat proses stock in tidak dapat menambahkan serial number baru manual saat serial number lama yang di generate belum habis.",
    "Jika di dalam satu batch generate kartu ada beberapa kartu yang rusak, itu tetap harus dimasukin ke stok in dulu dan harus diubah statusnya menjadi damage di stok in.",
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

          {/* SERIAL */}
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
              <label className="text-sm font-medium">Last Serial</label>
              <input
                className="w-full rounded-lg border px-4 py-2"
                value={form.lastSerial}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    lastSerial: e.target.value,
                  }))
                }
                disabled={!form.productId}
                placeholder="Masukkan full serial atau suffix"
              />
              {maxAvailableSerial && (
                <p className="mt-1 text-xs text-gray-500">
                  Tersedia sampai serial:{" "}
                  <span className="font-mono">{maxAvailableSerial}</span>
                </p>
              )}
            </div>
          </div>

          {/* SUBMIT */}
          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={saving}
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
