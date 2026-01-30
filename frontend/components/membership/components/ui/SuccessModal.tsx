import { CheckCircle } from "lucide-react";

interface SuccessModalProps {
  open: boolean;
  onClose: () => void;
}

export default function SuccessModal({ open, onClose }: SuccessModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex flex-col items-center">
          <div className="mb-4 rounded-full bg-green-100 p-3">
            <CheckCircle className="text-green-600" size={48} />
          </div>
          <h3 className="text-lg font-semibold">Success!</h3>
          <p className="mt-2 text-center text-sm text-gray-600">
            Member has been deleted successfully.
          </p>
        </div>

        <div className="flex justify-center">
          <button
            onClick={onClose}
            className="rounded-md bg-[#8D1231] px-6 py-2 text-sm text-white hover:bg-[#73122E]"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
