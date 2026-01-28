"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  open: boolean;
  name: string;
  identity: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmDeleteModal({
  open,
  name,
  identity,
  onCancel,
  onConfirm,
}: Props) {
  useEffect(() => {
    if (!open) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onCancel}
    >
      <div
        className="w-[420px] rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ICON */}
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <AlertTriangle className="text-red-600" />
        </div>

        {/* TITLE */}
        <h2 className="text-lg font-semibold text-center">Delete Data</h2>

        {/* MESSAGE */}
        <p className="mt-2 text-sm text-center text-gray-600">
          Are you sure you want to delete this member?
        </p>

        {/* INFO BOX */}
        <div className="mt-4 rounded-lg bg-gray-50 p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Name</span>
            <span className="font-medium">{name}</span>
          </div>
          <div className="mt-2 flex justify-between">
            <span className="text-gray-500">Identity Number</span>
            <span className="font-medium">{identity}</span>
          </div>
        </div>

        {/* ACTION */}
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={onCancel}
            className="rounded-md bg-gray-100 px-6 py-2 text-sm"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className="rounded-md bg-[#8D1231] px-6 py-2 text-sm text-white hover:bg-[#73122E]"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
