"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useStockOutForm } from "@/hooks/useStockOutForm";
import StockSopCard from "./StockSopCard";

interface BaseStockOutAddProps {
  programType: "FWC" | "VOUCHER";
}

export default function BaseStockOutAdd({ programType }: BaseStockOutAddProps) {
  const router = useRouter();
  const {
    form,
    setForm,
    products,
    stations,
    loading,
    saving,
    handleSubmit,
    maxAvailableSerial,
    handleQuantityChange,
    handleEndSerialChange,
  } = useStockOutForm({ programType });

  const sopItems = [
    "Pastikan fisik kartu telah siap dikirim sebelum membuat data Stock Out.",
    "Verifikasi kembali 'Stasiun Tujuan' untuk mencegah kesalahan distribusi.",
    "Hanya kartu dengan status 'IN_OFFICE' (tersedia di kantor) yang dapat dipilih.",
    "Lengkapi nomor Nota Dinas dan BAST secara akurat untuk keperluan administrasi.",
  ];

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

      <div className="px-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 rounded-xl border bg-white p-6 space-y-4">
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
            <div className="col-span-2">
              <label className="text-sm font-medium">Card Product</label>
              <select
                className="w-full rounded-lg border px-4 py-2"
                value={form.productId}
                onChange={(e) =>
                  setForm({ ...form, productId: e.target.value })
                }
              >
                <option value="">Pilih Card Product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.category?.categoryName} - {p.type?.typeName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Nota Dinas</label>
              <input
                type="text"
                className="w-full rounded-lg border px-4 py-2"
                value={form.notaDinas || ""}
                onChange={(e) =>
                  setForm({ ...form, notaDinas: e.target.value })
                }
                placeholder="Masukkan No Nota Dinas"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Upload Nota Dinas</label>
              <input
                type="file"
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#8D1231]/10 file:text-[#8D1231] hover:file:bg-[#8D1231]/20"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setForm({ ...form, notaDinasFile: e.target.files[0] });
                  }
                }}
              />
              {form.notaDinasFile && (
                <p className="text-xs text-green-600 mt-1">
                  File dipilih: {form.notaDinasFile.name}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">BAST</label>
              <input
                type="text"
                className="w-full rounded-lg border px-4 py-2"
                value={form.bast || ""}
                onChange={(e) => setForm({ ...form, bast: e.target.value })}
                placeholder="Masukkan No BAST"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Upload BAST</label>
              <input
                type="file"
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#8D1231]/10 file:text-[#8D1231] hover:file:bg-[#8D1231]/20"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setForm({ ...form, bastFile: e.target.files[0] });
                  }
                }}
              />
              {form.bastFile && (
                <p className="text-xs text-green-600 mt-1">
                  File dipilih: {form.bastFile.name}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Jumlah (Qty)</label>
              <input
                type="number"
                className="w-full rounded-lg border px-4 py-2"
                value={form.quantity}
                onChange={(e) => handleQuantityChange(e.target.value)}
                placeholder="Masukkan jumlah kartu"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Initial Serial</label>
              <input
                type="text"
                className="w-full rounded-lg border px-4 py-2 bg-gray-100"
                value={form.startSerial}
                readOnly
                placeholder="Otomatis dari stok tersedia"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Last Serial</label>
              <input
                type="text"
                className="w-full rounded-lg border px-4 py-2"
                value={form.endSerial}
                onChange={(e) => handleEndSerialChange(e.target.value)}
                placeholder="Masukkan Last Serial"
              />
              {maxAvailableSerial && (
                <p className="text-xs text-gray-500 mt-1">
                  Tersedia sampai serial: {maxAvailableSerial}
                </p>
              )}
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

        {/* SOP */}
        <div>
          <StockSopCard items={sopItems} title="SOP Stock Out" />
        </div>
      </div>
    </div>
  );
}
