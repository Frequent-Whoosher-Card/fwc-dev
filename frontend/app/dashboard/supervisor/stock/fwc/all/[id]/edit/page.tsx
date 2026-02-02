"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Info,
  Tag,
  MapPin,
  Database,
  Loader2,
} from "lucide-react";
import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";
import { ThemedSelect } from "@/components/ui/ThemedSelect";

// Status mapping: UI Label (Indo) -> Backend Enum
const STATUS_MAP = [
  { id: "1", name: "Sedang Diajukan", code: "ON_REQUEST" },
  { id: "2", name: "Office", code: "IN_OFFICE" },
  { id: "3", name: "Dalam Pengiriman", code: "IN_TRANSIT" },
  { id: "4", name: "Stasiun", code: "IN_STATION" },
  { id: "5", name: "Hilang", code: "LOST" },
  { id: "6", name: "Rusak", code: "DAMAGED" },
  { id: "7", name: "Aktif", code: "SOLD_ACTIVE" },
  { id: "8", name: "Non-Aktif", code: "SOLD_INACTIVE" },
  { id: "9", name: "Transfer", code: "ON_TRANSFER" },
];

export default function EditCardPage() {
  const router = useRouter();
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [card, setCard] = useState<any>(null);
  const [status, setStatus] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [dynamicOptions, setDynamicOptions] = useState<any[]>([]);

  // Fetch status options dynamically (mirrors All Card filter logic)
  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const res = await axiosInstance.get("/cards", {
          params: { page: 1, limit: 100000, programType: "FWC" },
        });
        const items = res.data?.data?.items ?? [];
        const uniqueRaw = Array.from(new Set(items.map((i: any) => i.status)));

        // Map to Indonesian labels and filter STATUS_MAP
        const options = STATUS_MAP.filter(
          (m) => uniqueRaw.includes(m.name) || uniqueRaw.includes(m.code),
        ).map((m) => ({
          id: m.id,
          name: m.name,
          code: m.code,
        }));

        // If the list is empty (no cards yet), provide a fallback set of common ones
        setDynamicOptions(
          options.length > 0 ? options : STATUS_MAP.slice(0, 6),
        );
      } catch (err) {
        console.error("Gagal mengambil opsi status", err);
        setDynamicOptions(STATUS_MAP.slice(0, 6)); // Fallback
      }
    };
    fetchStatuses();
  }, []);

  useEffect(() => {
    if (!id) return;
    const fetchCard = async () => {
      try {
        const res = await axiosInstance.get(`/cards/${id}`);
        const cardData = res.data?.data;
        setCard(cardData);

        // Find matching code if BE returns friendly name, otherwise use as is
        const rawStatus = cardData?.status;
        const matched = STATUS_MAP.find(
          (m) => m.name === rawStatus || m.code === rawStatus,
        );

        setStatus(matched?.code ?? matched?.name ?? "");
        setNote(cardData?.notes ?? "");
      } catch (err) {
        toast.error("Gagal memuat data kartu");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCard();
  }, [id]);

  const handleSave = async () => {
    if (!id) return;
    setSubmitting(true);
    try {
      await axiosInstance.patch(`/cards/${id}`, { status, notes: note });
      toast.success("Status kartu berhasil diperbarui");
      router.push("/dashboard/supervisor/stock/fwc/all");
    } catch (err) {
      toast.error("Gagal memperbarui kartu");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#8D1231]" />
      </div>
    );
  }

  if (!card) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center space-y-4">
        <p className="text-red-500 font-medium">Data kartu tidak ditemukan.</p>
        <button
          onClick={() => router.back()}
          className="text-[#8D1231] hover:underline"
        >
          Kembali
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2.5 border rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Edit Status Kartu FWC
            </h2>
            <p className="text-sm text-gray-500">
              Perbarui informasi status dan catatan kartu fisik.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col: Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50/50 flex items-center gap-2">
              <Info size={18} className="text-[#8D1231]" />
              <h3 className="font-semibold text-gray-700">Informasi Kartu</h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Serial Number
                </p>
                <div className="flex items-center gap-2">
                  <Tag size={16} className="text-gray-400" />
                  <span className="font-mono text-lg font-bold text-[#8D1231]">
                    {card.serialNumber}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Tipe Program
                </p>
                <div className="flex items-center gap-2">
                  <Database size={16} className="text-gray-400" />
                  <span className="font-medium text-gray-700">
                    {card.cardProduct?.programType || "FWC"}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Produk (Category & Type)
                </p>
                <p className="font-medium text-gray-700">
                  {card.cardProduct?.category?.categoryName || "-"} /{" "}
                  {card.cardProduct?.type?.typeName || "-"}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Stasiun Saat Ini
                </p>
                <div className="flex items-center gap-2 text-blue-600">
                  <MapPin size={16} />
                  <span className="font-bold">
                    {card.station?.stationName || "Office"}
                  </span>
                </div>
              </div>

              {card.previousStation && (
                <div className="space-y-1 md:col-span-2 pt-2 border-t border-dashed">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Stasiun Sebelumnya
                  </p>
                  <p className="text-sm font-medium text-gray-600">
                    {card.previousStation.stationName}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Action Form */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden h-fit sticky top-24">
            <div className="px-6 py-4 border-b bg-gray-50/50">
              <h3 className="font-semibold text-gray-700">Update Status</h3>
            </div>
            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">
                  Status Baru
                </label>
                <ThemedSelect
                  value={status}
                  onChange={setStatus}
                  options={dynamicOptions}
                  placeholder="Pilih Status"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">
                  Catatan
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={4}
                  className="w-full border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#8D1231]/20 focus:border-[#8D1231] outline-none transition-all resize-none"
                  placeholder="Tambahkan catatan jika diperlukan..."
                />
              </div>

              <button
                onClick={handleSave}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-[#8D1231] text-white py-3 rounded-xl font-bold hover:bg-[#a6153a] transition-all shadow-md hover:shadow-lg active:scale-[0.98] disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Save size={20} />
                )}
                {submitting ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
