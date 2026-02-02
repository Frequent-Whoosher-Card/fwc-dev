"use client";

import { CheckCircle2, Loader2, X } from "lucide-react";

interface ReceiveConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
  stationName?: string;
  quantity?: number;
}

export function ReceiveConfirmModal({
  open,
  onClose,
  onConfirm,
  loading = false,
  stationName = "-",
  quantity = 0,
}: ReceiveConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600">
            <CheckCircle2 size={24} />
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* CONTENT */}
        <div className="text-left space-y-2 mb-8">
          <h3 className="text-xl font-bold text-gray-900">
            Konfirmasi Penerimaan
          </h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            Apakah Anda yakin ingin menerima transfer kartu berikut? Kartu akan
            otomatis masuk ke stok stasiun tujuan Anda.
          </p>
        </div>

        {/* DETAILS CARD */}
        <div className="bg-gray-50 border rounded-xl p-4 mb-8 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Dari Stasiun
            </span>
            <span className="text-sm font-bold text-gray-800">
              {stationName}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Jumlah Kartu
            </span>
            <span className="text-sm font-bold text-[#8D1231] bg-[#8D1231]/10 px-2 py-0.5 rounded">
              {quantity.toLocaleString()} Pcs
            </span>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onConfirm}
            disabled={loading}
            className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-green-600 font-bold text-white hover:bg-green-700 transition-all shadow-lg shadow-green-200 active:scale-95 disabled:opacity-50 disabled:grayscale"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <CheckCircle2 size={20} />
            )}
            {loading ? "Memproses..." : "Ya, Terima Kartu"}
          </button>

          <button
            onClick={onClose}
            disabled={loading}
            className="w-full h-12 text-sm font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}
