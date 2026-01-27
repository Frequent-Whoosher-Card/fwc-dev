"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmDeleteModal({
  open,
  onCancel,
  onConfirm,
}: Props) {
  /* ======================
     ESC KEY HANDLER
  ====================== */
  useEffect(() => {
    if (!open) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      }
    };

    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "auto";
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onCancel}
    >
      <div
        className="w-[380px] rounded-xl bg-white p-6 text-center shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ICON */}
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#8D1231]/10">
          <AlertTriangle className="text-[#8D1231]" />
        </div>

        {/* TITLE */}
        <h2 className="text-lg font-semibold text-gray-800">Delete Data</h2>

        {/* DESC */}
        <p className="mt-2 text-sm text-gray-600">
          Are you sure want to delete this Data?
          <br />
          This action cannot be undone.
        </p>

        {/* ACTION */}
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={onCancel}
            className="
              rounded-md bg-gray-200 px-5 py-2 text-sm
              transition hover:bg-gray-300 active:scale-95
            "
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className="
              rounded-md bg-red-600 px-5 py-2 text-sm text-white
              transition hover:bg-red-700 active:scale-95
            "
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
