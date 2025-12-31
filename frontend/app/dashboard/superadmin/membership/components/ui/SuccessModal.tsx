'use client';

import { useEffect } from 'react';
import { CheckCircle } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function SuccessModal({ open, onClose }: Props) {
  /* ======================
     ESC + SCROLL LOCK
  ====================== */
  useEffect(() => {
    if (!open) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="
          w-[380px] rounded-xl bg-white p-6 text-center shadow-xl
          animate-in fade-in zoom-in-95
        "
        onClick={(e) => e.stopPropagation()}
      >
        {/* ICON */}
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="text-green-600" size={28} />
        </div>

        {/* TITLE */}
        <h2 className="text-xl font-semibold text-gray-800">
          Data Saved
        </h2>

        {/* DESC */}
        <p className="mt-2 text-sm text-gray-600">
          The new member’s data <br />
          has been saved to the database
        </p>

        {/* ACTION */}
        <button
          onClick={onClose}
          className="
            mt-6 rounded-md bg-[#8B1538] px-6 py-2 text-sm text-white
            transition hover:bg-[#73122E] active:scale-95
          "
        >
          OK
        </button>
      </div>
    </div>
  );
}
