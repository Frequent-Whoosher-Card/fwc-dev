"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import {
  getCardById,
  updateCard,
  getEditableCardStatuses,
} from "@/lib/services/card.service";
import CardDetailInfo from "@/components/stock/CardDetailInfo";
import { CardStatus } from "@/types/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STATUS_MAP } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";

export default function EditCardPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const programType = searchParams.get("type") || "FWC";

  const [card, setCard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [status, setStatus] = useState<CardStatus | "">("");
  const [note, setNote] = useState("");
  const [statusOptions, setStatusOptions] = useState<
    { id: string; label: string; code: string }[]
  >([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [cardRes, statusesRes] = await Promise.all([
          getCardById(id),
          getEditableCardStatuses(),
        ]);

        setCard(cardRes);
        setStatusOptions(statusesRes);

        setStatus(cardRes.status as CardStatus);
        setNote(cardRes.notes || "");
      } catch (err: any) {
        toast.error(err.message || "Gagal mengambil data kartu");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!status) return;

    setSaving(true);
    try {
      await updateCard(id, {
        status: status as CardStatus,
        notes: note,
      });
      toast.success("Status kartu berhasil diperbarui");
      router.back();
    } catch (error: any) {
      toast.error(error?.message || "Gagal memperbarui status kartu");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8D1231]"></div>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500">Data kartu tidak ditemukan</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-[#8D1231] hover:underline"
        >
          Kembali
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 px-6 pt-6">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-800">Edit Status Kartu</h1>
          <p className="text-sm text-gray-500">
            Perbarui status dan catatan untuk kartu ini
          </p>
        </div>
      </div>

      <div className="px-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Card Details */}
        <div className="lg:col-span-2">
          <CardDetailInfo card={card} />
        </div>

        {/* Right Column: Edit Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border shadow-sm p-6 sticky top-6">
            <h3 className="font-semibold text-gray-700 mb-4 pb-4 border-b">
              Form Perubahan Status
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status Saat Ini
                </label>
                <div className="px-3 py-2 bg-gray-50 rounded-lg border text-gray-500 text-sm font-medium">
                  {statusOptions.find((s) => s.code === card.status)?.label ||
                    card.status}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status Baru <span className="text-red-500">*</span>
                </label>
                <Select
                  value={status}
                  onValueChange={(val) => setStatus(val as CardStatus)}
                >
                  <SelectTrigger
                    className={cn(
                      "w-full h-10 transition-all duration-200",
                      status && STATUS_MAP[status]
                        ? STATUS_MAP[status].className
                        : "border-gray-300",
                    )}
                  >
                    <SelectValue placeholder="Pilih Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((opt) => {
                      const statusConfig = STATUS_MAP[opt.code];
                      return (
                        <SelectItem
                          key={opt.code}
                          value={opt.code}
                          className={cn(
                            "cursor-pointer my-1",
                            statusConfig?.className,
                          )}
                        >
                          <span className="font-medium">{opt.label}</span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catatan
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full rounded-lg border-gray-300 focus:border-[#8D1231] focus:ring-[#8D1231]"
                  rows={4}
                  placeholder="Tambahkan catatan perubahan status..."
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="flex-1 rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={saving}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-[#8D1231] px-4 py-2 text-sm font-medium text-white hover:bg-[#7a102b] disabled:opacity-50 transition-all shadow-md hover:shadow-lg"
                  disabled={saving}
                >
                  {saving ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
