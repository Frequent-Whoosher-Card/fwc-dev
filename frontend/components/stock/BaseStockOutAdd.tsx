"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useStockOutForm } from "@/hooks/useStockOutForm";

interface BaseStockOutAddProps {
  programType: "FWC" | "VOUCHER";
}

export default function BaseStockOutAdd({ programType }: BaseStockOutAddProps) {
  const router = useRouter();
  const {
    form,
    setForm,
    categories,
    types,
    stations,
    loading,
    saving,
    handleSubmit,
  } = useStockOutForm({ programType });

  if (loading) {
    return (
      <div className="p-6 text-gray-500 text-center">
        Loading master data...
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
          Tambah Stock Out ({programType})
        </h2>
      </div>

      <div className="px-6">
        <div className="rounded-xl border bg-white p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Tanggal</label>
              <input
                type="date"
                className="w-full rounded-lg border px-4 py-2"
                value={form.movementAt}
                onChange={(e) =>
                  setForm({ ...form, movementAt: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium">Stasiun Tujuan</label>
              <select
                className="w-full rounded-lg border px-4 py-2"
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
              <label className="text-sm font-medium">Category</label>
              <select
                className="w-full rounded-lg border px-4 py-2"
                value={form.cardCategoryId}
                onChange={(e) =>
                  setForm({ ...form, cardCategoryId: e.target.value })
                }
              >
                <option value="">Pilih Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.categoryName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Type</label>
              <select
                className="w-full rounded-lg border px-4 py-2"
                value={form.cardTypeId}
                onChange={(e) =>
                  setForm({ ...form, cardTypeId: e.target.value })
                }
              >
                <option value="">Pilih Type</option>
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
              <label className="text-sm font-medium">Batch</label>
              <input
                type="text"
                className="w-full rounded-lg border px-4 py-2"
                value={form.batchId}
                onChange={(e) => setForm({ ...form, batchId: e.target.value })}
                placeholder="Masukkan Batch ID"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Nota Dinas</label>
              <input
                type="text"
                className="w-full rounded-lg border px-4 py-2"
                value={form.notaDinas}
                onChange={(e) =>
                  setForm({ ...form, notaDinas: e.target.value })
                }
                placeholder="Masukkan No Nota Dinas"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">BAST</label>
              <input
                type="text"
                className="w-full rounded-lg border px-4 py-2"
                value={form.bast}
                onChange={(e) => setForm({ ...form, bast: e.target.value })}
                placeholder="Masukkan No BAST"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Jumlah (Qty)</label>
              <input
                type="number"
                className="w-full rounded-lg border px-4 py-2"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                placeholder="Masukkan jumlah kartu"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Catatan</label>
            <textarea
              className="w-full rounded-lg border px-4 py-2"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              rows={3}
              placeholder="Tambahkan catatan jika ada"
            />
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="rounded-lg bg-[#8D1231] px-8 py-2 text-white hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Menyimpan..." : "Simpan Stock Out"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
