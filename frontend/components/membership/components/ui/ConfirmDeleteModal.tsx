"use client";

import { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";

interface ConfirmDeleteModalProps {
  open: boolean;
  memberName: string;
  memberNik: string;
  onConfirm: (notes: string) => void;
  onCancel: () => void;
}

export default function ConfirmDeleteModal({
  open,
  memberName,
  memberNik,
  onConfirm,
  onCancel,
}: ConfirmDeleteModalProps) {
  const [deleteReason, setDeleteReason] = useState("");

  useEffect(() => {
    if (open) setDeleteReason("");
  }, [open]);

  if (!open) return null;

  const handleConfirm = () => {
    const trimmed = deleteReason.trim();
    if (!trimmed) return;
    onConfirm(trimmed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-full bg-red-100 p-2">
            <AlertTriangle className="text-red-600" size={24} />
          </div>
          <h3 className="text-lg font-semibold">Konfirmasi Penghapusan</h3>
        </div>

        <p className="mb-4 text-sm text-gray-600">
          Apakah Anda yakin ingin menghapus member ini?
        </p>

        <div className="mb-4 rounded-md bg-gray-50 p-4 text-sm">
          <div className="mb-1">
            <span className="font-medium">Nama:</span> {memberName}
          </div>
          <div>
            <span className="font-medium">NIK:</span> {memberNik}
          </div>
        </div>

        <div className="mb-6">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Alasan penghapusan <span className="text-red-500">*</span>
          </label>
          <textarea
            value={deleteReason}
            onChange={(e) => setDeleteReason(e.target.value)}
            placeholder="Wajib diisi"
            rows={3}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600"
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!deleteReason.trim()}
            className="rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
          >
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
}
