'use client';

import { CheckCircle } from 'lucide-react';

interface SuccessModalProps {
  open: boolean;
  title?: string;
  message?: string;
  onClose: () => void;
}

export default function SuccessModal({
  open,
  title = 'Data Saved',
  message = 'The new member’s data has been saved to the database',
  onClose,
}: SuccessModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-[380px] rounded-xl bg-white p-6 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
          <CheckCircle size={28} className="text-green-600" />
        </div>

        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-2 text-sm text-gray-600">
          {message}
        </p>

        <button
          onClick={onClose}
          className="mt-6 w-full rounded-md bg-[#8B1538] py-2 text-sm font-medium text-white hover:bg-[#73122E]"
        >
          Close
        </button>
      </div>
    </div>
  );
}
