'use client';

import { AlertTriangle } from 'lucide-react';

interface DeleteConfirmModalProps {
  open: boolean;
  serialNumber?: string;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmModal({ open, serialNumber, onClose, onConfirm }: DeleteConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-white p-6 text-center shadow-lg">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <AlertTriangle className="text-red-500" size={24} />
        </div>

        <h3 className="mb-2 text-lg font-semibold text-gray-800">Konfirmasi Hapus Data</h3>

        <p className="mb-6 text-sm text-gray-600 leading-relaxed">
          Apakah Anda yakin ingin menghapus data stok keluar
          {serialNumber ? (
            <>
              <br />
              dengan serial number <span className="font-semibold text-gray-800">{serialNumber}</span>?
            </>
          ) : (
            '?'
          )}
          <br />
          <span className="text-red-600">Tindakan ini tidak dapat dibatalkan.</span>
        </p>

        <div className="flex justify-center gap-3">
          <button onClick={onClose} className="rounded-md bg-gray-200 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300">
            Batal
          </button>

          <button onClick={onConfirm} className="rounded-md bg-red-600 px-5 py-2 text-sm font-medium text-white hover:bg-red-700">
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
}
