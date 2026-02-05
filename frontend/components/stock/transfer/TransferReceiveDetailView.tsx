"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { useTransferReceive } from "@/hooks/useTransferReceive";
import StatusBadge from "@/components/ui/status-badge";
import { ReceiveConfirmModal } from "./ReceiveConfirmModal";
import toast from "react-hot-toast";
import { useContext } from "react";
import { UserContext } from "@/app/dashboard/superadmin/dashboard/dashboard-layout";

interface TransferReceiveDetailViewProps {
  id: string;
}

export default function TransferReceiveDetailView({
  id,
}: TransferReceiveDetailViewProps) {
  const router = useRouter();
  const userContext = useContext(UserContext);
  const role = userContext?.role || "superadmin";
  const { data, loading, submitting, confirmReceive } = useTransferReceive(id);
  const [showConfirm, setShowConfirm] = useState(false);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-64 flex-col items-center justify-center space-y-4">
        <p className="text-gray-500">Data transfer tidak ditemukan</p>
        <button
          onClick={() => router.back()}
          className="text-sm text-[#8D1231] hover:underline"
        >
          Kembali
        </button>
      </div>
    );
  }

  const isPending = data.status === "PENDING";

  const handleReceive = async () => {
    const success = await confirmReceive();
    if (success) {
      toast.success("Transfer berhasil diterima");
      setShowConfirm(false);
      // router.push(`/dashboard/${role}/stock/${data.programType.toLowerCase()}/transfer`);
      // For now just back to transfer list
      router.push(`/dashboard/${role}/stock/transfer`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 px-6">
        <button
          onClick={() => router.back()}
          className="p-2 border rounded-md hover:bg-gray-100 transition"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-xl font-semibold">Validasi Penerimaan Transfer</h2>
      </div>

      <div className="max-w-4xl mx-auto space-y-6 px-6 pb-12">
        {/* Info Card */}
        <div className="bg-white p-6 rounded-xl border shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                Status Transfer
              </p>
              <div className="mt-1">
                <StatusBadge status={data.status} />
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                Tanggal Kirim
              </p>
              <p className="mt-1 font-medium text-sm">
                {new Date(data.movementAt).toLocaleDateString("id-ID", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Dari Stasiun</p>
                <p className="font-semibold text-lg text-[#8D1231]">
                  {data.station?.stationName || "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Ke Stasiun (Tujuan)</p>
                <p className="font-semibold text-lg text-blue-700">
                  {data.toStation?.stationName || "-"}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Kategori</p>
                  <p className="font-medium">
                    {data.category?.categoryName || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tipe</p>
                  <p className="font-medium">
                    {data.cardType?.typeName || "-"}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Jumlah Kartu</p>
                <p className="font-bold text-2xl">
                  {data.quantity}{" "}
                  <span className="text-sm font-normal text-gray-400">Pcs</span>
                </p>
              </div>
            </div>
          </div>

          {data.note && (
            <div className="bg-gray-50 p-4 rounded-lg border border-dashed">
              <p className="text-xs font-medium text-gray-400 uppercase mb-1">
                Catatan Pengirim
              </p>
              <p className="text-sm text-gray-700">{data.note}</p>
            </div>
          )}
        </div>

        {/* Serials Section */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b">
            <h3 className="font-semibold text-gray-700 text-sm">
              Daftar Serial Number
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {data.sentSerialNumbers?.length > 0 ? (
                data.sentSerialNumbers.map((s: string) => (
                  <div
                    key={s}
                    className="px-3 py-2 bg-gray-50 rounded border text-center text-xs font-mono text-gray-600"
                  >
                    {s}
                  </div>
                ))
              ) : (
                <p className="col-span-full text-center text-gray-400 text-sm py-4 italic">
                  List serial number tidak tersedia dalam ringkasan ini.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action Button */}
        {isPending && (
          <div className="flex justify-center pt-4">
            <button
              onClick={() => setShowConfirm(true)}
              disabled={submitting}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-bold transition shadow-lg hover:shadow-green-200 disabled:opacity-50 active:scale-95"
            >
              <CheckCircle2 size={24} />
              Konfirmasi Terima Kartu
            </button>
          </div>
        )}
      </div>

      <ReceiveConfirmModal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleReceive}
        loading={submitting}
        stationName={data.station?.stationName}
        quantity={data.quantity}
      />
    </div>
  );
}
