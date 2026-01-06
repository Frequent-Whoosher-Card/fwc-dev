'use client';

import { useEffect } from 'react';
import { CheckCircle } from 'lucide-react';

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
}

export default function SuccessModal({
  open,
  title = 'Data Saved',
  message = 'The new member’s data has been saved to the database',
  data,
  onClose,
  onConfirm,
}: SuccessModalProps) {
  /* ======================
     ESC + SCROLL LOCK
  ====================== */
  useEffect(() => {
    if (!open) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'auto';
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
    w-[480px] rounded-xl bg-white p-6 text-center shadow-xl
    animate-in fade-in zoom-in-95
  "
        onClick={(e) => e.stopPropagation()}
      >
        {/* ICON */}
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="text-green-600" size={28} />
        </div>

        {/* TITLE */}
        <h2 className="text-lg font-semibold text-gray-800">
          {title}
        </h2>

        {/* DESC */}
        {message && (
          <p className="mt-2 text-sm text-gray-600">
            {message}
          </p>
        )}

        {/* REVIEW DATA */}
        {isReviewMode && (
          <div className="mt-4 max-h-[300px] overflow-y-auto text-sm text-left">
            {Object.entries(data).map(([key, value]) => (
              <div
                key={key}
                className="flex justify-between gap-3 border-b py-1"
              >
                <span className="text-gray-500">{key}</span>
                <span className="font-medium">
                  {value || '-'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* ACTION */}
        <div className="mt-6 flex gap-3">
          {onClose && (
            <button
              onClick={onClose}
              className="flex-1 rounded-md border px-4 py-2 text-sm"
            >
              {isReviewMode ? 'Back' : 'Close'}
            </button>
          )}

          <button
            onClick={onConfirm ?? onClose}
            className="
              flex-1 rounded-md bg-[#8B1538] px-4 py-2 text-sm text-white
              transition hover:bg-[#73122E] active:scale-95
            "
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
