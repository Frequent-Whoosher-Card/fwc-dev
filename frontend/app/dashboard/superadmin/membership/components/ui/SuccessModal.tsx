"use client";

import { useEffect } from "react";
import { CheckCircle } from "lucide-react";

interface SuccessModalProps {
  open: boolean;

  /** OPTIONAL */
  title?: string;
  message?: string;

  /** Kalau ada → MODE REVIEW */
  data?: Record<string, any>;

  /** Back / Close */
  onClose?: () => void;

  /** OK / Confirm */
  onConfirm?: () => void;

  /** Loading state for async actions */
  loading?: boolean;
}

export default function SuccessModal({
  open,
  title = "Data Saved",
  message = "The new member’s data has been saved to the database",
  data,
  onClose,
  onConfirm,
  loading = false,
}: SuccessModalProps) {
  /* ======================
     ESC + SCROLL LOCK
  ====================== */
  useEffect(() => {
    if (!open) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose?.();
      }
    };

    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "auto";
    };
  }, [open, onClose]);

  if (!open) return null;

  const isReviewMode = !!data;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={() => onClose?.()}
    >
      <div
        className="
          w-full max-w-3xl rounded-xl bg-white p-8 shadow-xl
          animate-in fade-in zoom-in-95
        "
        onClick={(e) => e.stopPropagation()}
      >
        {/* ICON */}
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="text-green-600" size={28} />
        </div>

        {/* TITLE */}
        <h2 className="text-xl font-semibold text-gray-800 text-center">
          {title}
        </h2>

        {/* MESSAGE */}
        <p className="mt-2 text-sm text-gray-600 text-center">
          {message}
        </p>

        {/* REVIEW DATA */}
        {isReviewMode && (
          <div className="mt-6 max-h-[360px] overflow-y-auto rounded-lg border border-gray-300">
            
            {/* HEADER TABLE (KCIC RED) */}
            <div className="grid grid-cols-2 bg-[#8D1231] text-white text-sm font-bold border-b">
              <div className="px-4 py-3 border-r border-white/30">
                Informasi
              </div>
              <div className="px-4 py-3">
                Data Penumpang
              </div>
            </div>

            {/* ROWS */}
            {Object.entries(data).map(([key, value], index) => (
              <div
                key={key}
                className={`
                  grid grid-cols-2 text-sm
                  ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  border-b last:border-b-0
                `}
              >
                {/* FIELD */}
                <div className="px-4 py-2 font-semibold text-gray-700 border-r border-gray-300">
                  {key}
                </div>

                {/* VALUE */}
                <div className="px-4 py-2 text-gray-900 font-medium break-words">
                  {value || "-"}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ACTION */}
        <div className="mt-6 flex gap-3">
          {onClose && (
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-md border px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isReviewMode ? "Back" : "Close"}
            </button>
          )}

          <button
            onClick={onConfirm ?? onClose}
            disabled={loading}
            className="
              flex-1 rounded-md bg-[#8B1538] px-4 py-2 text-sm text-white
              transition hover:bg-[#73122E] active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed
              flex items-center justify-center gap-2
            "
          >
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Processing...</span>
              </>
            ) : (
              "OK"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
