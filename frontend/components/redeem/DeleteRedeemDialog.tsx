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
  /* Reason for deletion */
  const [reasonCategory, setReasonCategory] = useState('');
  const [reasonCustom, setReasonCustom] = useState('');
  const [bookingCode, setBookingCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Predefined reason options
  const reasonOptions = [
    { value: 'salah_seri', label: 'Salah input nomor seri kartu' },
    { value: 'pembatalan_kereta', label: 'Pembatalan Kereta' },
    { value: 'lainnya', label: 'Lainnya' },
  ];

  // Build final reason message
  const getFinalReason = () => {
    if (reasonCategory === 'lainnya') {
      return reasonCustom.trim();
    }
    if (reasonCategory === 'pembatalan_kereta') {
      return bookingCode.trim()
        ? `Alasan : Pembatalan Kereta\nKode Booking : ${bookingCode.trim()}`
        : '';
    }
    const selected = reasonOptions.find(opt => opt.value === reasonCategory);
    return selected ? selected.label : '';
  };

  const finalReason = getFinalReason();
  const isReasonValid =
    reasonCategory === 'lainnya'
      ? reasonCustom.trim().length >= 10
      : reasonCategory === 'pembatalan_kereta'
        ? bookingCode.trim().length > 0
        : finalReason.length >= 3;

  if (!isOpen || !data) return null;

  const handleDelete = async () => {
    if (!isReasonValid) {
      if (reasonCategory === 'lainnya') {
        toast.error('Mohon isi alasan tambahan minimal 10 karakter');
      } else if (reasonCategory === 'pembatalan_kereta') {
        toast.error('Mohon isi Kode Booking Kereta');
      } else {
        toast.error('Mohon pilih alasan penghapusan');
      }
      return;
    }

    setIsLoading(true);
    try {
      const result = await redeemService.deleteRedeem(data.id, finalReason);

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

      setReasonCategory('');
      setReasonCustom('');
      setBookingCode('');
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

        {/* Transaction Details */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2">
          <div>
            <p className="text-sm text-gray-600">Nomor Transaksi</p>
            <p className="font-mono font-semibold text-gray-900">
              {data.transactionNumber}
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

        {/* Reason Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Alasan Penghapusan <span className="text-red-500">*</span>
          </label>
          <select
            value={reasonCategory}
            onChange={(e) => {
              setReasonCategory(e.target.value);
              if (e.target.value !== 'lainnya') {
                setReasonCustom('');
              }
              if (e.target.value !== 'pembatalan_kereta') {
                setBookingCode('');
              }
            }}
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">-- Pilih Alasan --</option>
            {reasonOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Booking code input for "Pembatalan Kereta" */}
          {reasonCategory === 'pembatalan_kereta' && (
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kode Booking Kereta
              </label>
              <input
                type="text"
                value={bookingCode}
                onChange={(e) => setBookingCode(e.target.value)}
                placeholder="Masukkan kode booking kereta"
                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          )}

          {/* Custom reason input for "Lainnya" */}
          {reasonCategory === 'lainnya' && (
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jelaskan Alasan Lainnya
              </label>
              <textarea
                value={reasonCustom}
                onChange={(e) => setReasonCustom(e.target.value)}
                placeholder="Ketik alasan penghapusan..."
                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none h-20"
              />
              <div className="mt-1 text-xs text-gray-500">
                {reasonCustom.trim().length} karakter (minimal 10)
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => { setReasonCategory(''); setReasonCustom(''); setBookingCode(''); onClose(); }}
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={handleDelete}
            disabled={isLoading || !isReasonValid}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Processing...' : 'Hapus'}
          </button>
        </div>
      </div>
    </div>
  );
}
