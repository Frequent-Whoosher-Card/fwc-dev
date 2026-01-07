'use client';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function SuccessModal({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40">
      <div className="rounded-md bg-white p-4">
        <p className="mb-4 text-sm">
          Data saved successfully
        </p>

        <button
          onClick={onClose}
          className="rounded bg-green-600 px-3 py-1 text-sm text-white"
        >
          OK
        </button>
      </div>
    </div>
  );
}
