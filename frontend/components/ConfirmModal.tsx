'use client';

interface ConfirmModalProps {
  open: boolean;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  variant?: 'danger' | 'primary' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({ 
  open, 
  title = 'Konfirmasi', 
  description = 'Apakah Anda yakin?', 
  confirmText = 'Ya, Lanjutkan', 
  cancelText = 'Batal', 
  loading = false, 
  variant = 'danger',
  onConfirm, 
  onCancel 
}: ConfirmModalProps) {
  if (!open) return null;

  const getButtonColor = () => {
      switch(variant) {
          case 'primary': return 'bg-blue-600 hover:bg-blue-700 text-white';
          case 'warning': return 'bg-orange-600 hover:bg-orange-700 text-white';
          case 'info': return 'bg-gray-800 hover:bg-gray-900 text-white';
          case 'danger': 
          default: return 'bg-red-600 hover:bg-red-700 text-white';
      }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-md scale-100 rounded-xl bg-white p-6 shadow-2xl transition-transform">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>

        <p className="mt-2 text-sm text-gray-600 leading-relaxed">{description}</p>

        <div className="mt-6 flex justify-end gap-3">
          <button 
            onClick={onCancel} 
            disabled={loading} 
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {cancelText}
          </button>

          <button 
            onClick={onConfirm} 
            disabled={loading} 
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${getButtonColor()}`}
          >
            {loading ? 'Memproses...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
