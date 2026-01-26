'use client';

import { RedeemItem } from '@/lib/services/redeem/redeemService';
import Image from 'next/image';

interface RedeemDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: RedeemItem | null;
  product?: 'FWC' | 'VOUCHER';
}

export default function RedeemDetailModal({
  isOpen,
  onClose,
  data,
  product = 'FWC',
}: RedeemDetailModalProps) {
  if (!isOpen || !data) return null;
  // You can use product to adjust transaction number/fields if needed

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatCurrency = (nominal: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(nominal);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Detail Redeem</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          {/* Transaction Header */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Nomor Transaksi</p>
                <p className="font-mono font-bold text-blue-600">
                  {data.transactionNumber}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Waktu</p>
                <p className="font-medium">{formatDate(data.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Operator</p>
                <p className="font-medium">
                  {data.operator?.fullName || 'Petugas'}
                </p>
              </div>
            </div>
          </div>

          {/* Card Information */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Data Kartu</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">No. Seri</p>
                <p className="font-mono font-medium">{data.card.serialNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">NIK</p>
                <p className="font-medium">
                  {data.card.member?.identityNumber || '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Nama Pelanggan</p>
                <p className="font-medium">
                  {data.card.member?.name || '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Kategori</p>
                <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                  {data.card.category ||
                    data.card.cardProduct?.category?.categoryName ||
                    '-'}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tipe Kartu</p>
                <p className="font-medium">
                  {data.card.cardType ||
                    data.card.cardProduct?.type?.typeName ||
                    '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status Kartu</p>
                <span
                  className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                    data.card.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {data.card.isActive ? 'Aktif' : 'Tidak Aktif'}
                </span>
              </div>
            </div>
          </div>

          {/* Redeem Details */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Detail Redeem</h3>
            <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-xs text-gray-600">Tipe Redeem</p>
                <p className="font-bold text-lg">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      data.redeemType === 'SINGLE'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}
                  >
                    {data.redeemType === 'SINGLE' ? 'Single' : 'Roundtrip'}
                  </span>
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-xs text-gray-600">Kuota Dipakai</p>
                <p className="font-bold text-lg text-red-600">-{data.quotaUsed || (data.redeemType === 'SINGLE' ? 1 : 2)}</p>
              </div>
            </div>
          </div>

          {/* Nominal */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Nominal Redeem</p>
            <p className="text-2xl font-bold text-yellow-800">
              {formatCurrency(data.nominal || data.quotaUsed * 1000)}
            </p>
          </div>

          {/* Station & Location */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Stasiun</p>
              <p className="font-medium">
                {data.station?.name || data.station?.stationName || '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Kota</p>
              <p className="font-medium">{data.station?.city || '-'}</p>
            </div>
          </div>

          {/* Notes */}
          {data.notes && (
            <div>
              <p className="text-sm text-gray-600 mb-2">Catatan</p>
              <div className="bg-gray-50 p-3 rounded text-sm text-gray-700 break-words">
                {data.notes}
              </div>
            </div>
          )}

          {/* Last Redeem Photo */}
          {data.fileObject && (
            <div>
              <p className="text-sm text-gray-600 mb-2">Foto Last Redeem</p>
              <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
                <Image
                  src={data.fileObject.path}
                  alt="Last Redeem Photo"
                  fill
                  className="object-contain"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Diupload: {formatDate(data.fileObject.createdAt)}
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="border-t pt-4">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
