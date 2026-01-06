'use client';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ConfirmDeleteModal({
  open,
  onClose,
  onConfirm,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40">
      <div className="rounded-md bg-white p-4">
        <p className="mb-4 text-sm">
          Are you sure?
        </p>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="text-sm">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded bg-red-600 px-3 py-1 text-sm text-white"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
