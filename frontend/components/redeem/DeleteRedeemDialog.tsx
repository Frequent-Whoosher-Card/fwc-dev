'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { redeemService, RedeemItem } from '@/lib/services/redeem/redeemService';

interface DeleteRedeemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  data: RedeemItem | null;
  onSuccess: () => void;
}

export default function DeleteRedeemDialog({
  isOpen,
  onClose,
  data,
  onSuccess,
}: DeleteRedeemDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen || !data) return null;

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const result = await redeemService.deleteRedeem(data.id);

      toast.custom(
        (t) => (
          <div className="bg-white p-4 rounded-lg shadow-lg border-l-4 border-green-500 max-w-sm">
            <p className="font-semibold text-green-700 mb-2">✓ Redeem Dihapus</p>
            <p className="text-sm text-gray-700 mb-1">
              Nomor Transaksi: <strong>{data.transactionNumber}</strong>
            </p>
            <p className="text-sm text-gray-700">
              Kuota dikembalikan: <strong>+{typeof result.restoredQuota === 'number' ? result.restoredQuota : 0}</strong>
            </p>
          </div>
        ),
        { duration: 5000 }
      );

      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Gagal menghapus redeem');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-sm w-full p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Hapus Redeem?
          </h2>
        </div>

        {/* Warning Box */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex gap-3">
            <svg
              className="w-6 h-6 text-yellow-600 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="font-semibold text-yellow-800">Perhatian!</p>
              <p className="text-sm text-yellow-700 mt-1">
                Tindakan ini akan menghapus redeem dan mengembalikan kuota ke
                kartu. Pastikan ini adalah tindakan yang benar.
              </p>
            </div>
          </div>
        </div>

        {/* Transaction Details */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2">
          <div>
            <p className="text-sm text-gray-600">Nomor Transaksi</p>
            <p className="font-mono font-semibold text-gray-900">
              {data.transactionNumber}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Nomor Seri Kartu</p>
            <p className="font-mono text-gray-900">
              {data.card.serialNumber}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Nama Pelanggan</p>
            <p className="text-gray-900">
              {data.card?.member?.name || '-'}
            </p>
          </div>
          <div className="pt-2 border-t">
            <p className="text-sm text-gray-600">Kuota yang Akan Dikembalikan</p>
            <p className="text-lg font-bold text-green-600">
              +{data.quotaUsed}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={handleDelete}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : 'Hapus'}
          </button>
        </div>

        {/* Additional Info */}
        <p className="text-xs text-gray-500 text-center mt-4">
          Redeem yang dihapus akan ditandai sebagai soft delete dan dapat
          dipulihkan dari backup sistem.
        </p>
      </div>
    </div>
  );
}
