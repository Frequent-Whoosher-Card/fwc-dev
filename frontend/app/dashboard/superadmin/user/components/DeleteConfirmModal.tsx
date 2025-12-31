'use client';

interface Props {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function DeleteConfirmModal({
  open,
  onCancel,
  onConfirm,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-[420px] rounded-xl bg-white p-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <span className="text-2xl text-red-500">!</span>
        </div>

        <h3 className="text-lg font-semibold">
          Delete Data
        </h3>

        <p className="mt-2 text-sm text-gray-500">
          Are you sure want to delete this Data?
          <br />
          This action cannot be undone.
        </p>

        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={onCancel}
            className="h-10 rounded-md bg-gray-200 px-6 text-sm text-gray-700"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className="h-10 rounded-md bg-red-500 px-6 text-sm text-white hover:opacity-90"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
