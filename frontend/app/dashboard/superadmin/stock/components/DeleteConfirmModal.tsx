'use client';

import { AlertTriangle } from 'lucide-react';

interface DeleteConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmModal({
  open,
  onClose,
  onConfirm,
}: DeleteConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-white p-6 text-center shadow-lg">
        {/* ICON */}
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <AlertTriangle className="text-red-500" size={24} />
        </div>

        {/* TITLE */}
        <h3 className="mb-2 text-lg font-semibold">Delete Data</h3>

        {/* DESC */}
        <p className="mb-6 text-sm text-gray-600">
          Are you sure want to delete this data?
          <br />
          This action cannot be undone.
        </p>

        {/* ACTION */}
        <div className="flex justify-center gap-3">
          <button
            onClick={onClose}
            className="rounded-md bg-gray-200 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className="rounded-md bg-red-500 px-5 py-2 text-sm font-medium text-white hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
