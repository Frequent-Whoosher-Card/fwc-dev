"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useStockOutForm } from "@/hooks/useStockOutForm";

interface BaseStockOutEditProps {
  programType: "FWC" | "VOUCHER";
}

export default function BaseStockOutEdit({
  programType,
}: BaseStockOutEditProps) {
  const router = useRouter();
  const params = useParams();
  const id =
    typeof params === "object" && params !== null ? (params as any).id : "";

  const {
    form,
    setForm,
    categories,
    types,
    stations,
    loading,
    saving,
    status,
    handleSubmit,
    isEditable,
  } = useStockOutForm({ programType, id });

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500">
        Loading data stock out...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 px-6">
        <button
          onClick={() => router.back()}
          className="rounded-lg border p-2 hover:bg-gray-100"
        >
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-lg font-semibold">
          Edit Stock Out ({programType})
        </h2>
      </div>

      <div className="px-6">
        <div className="rounded-xl border bg-white p-6 space-y-4 shadow-sm">
          {!isEditable && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm mb-4">
              Transaksi ini sudah berstatus <strong>{status}</strong> dan tidak
              dapat diubah lagi.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Tanggal
              </label>
              <input
                type="date"
                disabled={!isEditable}
                className="w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-[#8D1231] focus:border-transparent disabled:bg-gray-50"
                value={form.movementAt}
                onChange={(e) =>
                  setForm({ ...form, movementAt: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Stasiun Tujuan
              </label>
              <select
                disabled={!isEditable}
                className="w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-[#8D1231] focus:border-transparent disabled:bg-gray-50"
                value={form.stationId}
                onChange={(e) =>
                  setForm({ ...form, stationId: e.target.value })
                }
              >
                <option value="">Pilih Stasiun</option>
                {stations.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.stationName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-400 block mb-1">
                Category (Read Only)
              </label>
              <select
                disabled
                className="w-full rounded-lg border px-4 py-2 bg-gray-50 text-gray-500"
                value={form.cardCategoryId}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.categoryName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-400 block mb-1">
                Type (Read Only)
              </label>
              <select
                disabled
                className="w-full rounded-lg border px-4 py-2 bg-gray-50 text-gray-500"
                value={form.cardTypeId}
              >
                {types.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.typeName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Serial Awal (5 digit terakhir)
              </label>
              <input
                type="text"
                disabled={!isEditable}
                placeholder="Contoh: 1"
                className="w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-[#8D1231] focus:border-transparent disabled:bg-gray-50"
                value={form.startSerial}
                onChange={(e) =>
                  setForm({ ...form, startSerial: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Serial Akhir (5 digit terakhir)
              </label>
              <input
                type="text"
                disabled={!isEditable}
                placeholder="Contoh: 100"
                className="w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-[#8D1231] focus:border-transparent disabled:bg-gray-50"
                value={form.endSerial}
                onChange={(e) =>
                  setForm({ ...form, endSerial: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Catatan (Note)
            </label>
            <textarea
              disabled={!isEditable}
              className="w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-[#8D1231] focus:border-transparent disabled:bg-gray-50"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              rows={3}
              placeholder="Tambahkan catatan jika ada"
            />
          </div>

          {isEditable && (
            <div className="flex justify-end pt-4">
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="rounded-lg bg-[#8D1231] px-8 py-2 text-white hover:opacity-90 disabled:opacity-50 transition-opacity font-medium"
              >
                {saving ? "Memperbarui..." : "Update Stock Out"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
