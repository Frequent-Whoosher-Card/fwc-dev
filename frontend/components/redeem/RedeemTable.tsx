'use client';

import { RedeemItem } from '@/lib/services/redeem/redeemService';
import { useMemo } from 'react';

interface RedeemTableProps {
  data: RedeemItem[];
  onUploadLastDoc: (item: RedeemItem) => void;
  onDelete: (item: RedeemItem) => void;
  canDelete: boolean;
  isLoading: boolean;
}

export default function RedeemTable({
  data,
  onUploadLastDoc,
  onDelete,
  canDelete,
  isLoading,
}: RedeemTableProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
    <div className="w-full overflow-x-auto border border-gray-200 rounded-lg">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b-2 border-gray-200">
            <th className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">
              Tanggal Redeem
            </th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">
              Nama Pelanggan
            </th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">
              NIK
            </th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">
              ID Transaksi
            </th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">
              Serial Kartu
            </th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">
              Kategori Kartu
            </th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">
              Tipe Kartu
            </th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">
              Tipe Perjalanan
            </th>
            <th className="px-4 py-3 text-center font-semibold text-gray-700 whitespace-nowrap">
              Kuota Terpakai
            </th>
            <th className="px-4 py-3 text-center font-semibold text-gray-700 whitespace-nowrap">
              Sisa Kuota
            </th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">
              Stasiun
            </th>
            <th className="px-4 py-3 text-center font-semibold text-gray-700 whitespace-nowrap">
              Last Redeem
            </th>
            <th className="px-4 py-3 text-center font-semibold text-gray-700 whitespace-nowrap">
              Aksi
            </th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={12} className="px-4 py-8 text-center text-gray-500">
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              </td>
            </tr>
          ) : !data || data.length === 0 ? (
            <tr>
              <td colSpan={12} className="px-4 py-8 text-center text-gray-500">
                Tidak ada data redeem
              </td>
            </tr>
          ) : (
            data.map((item) => {
              // Sisa kuota diambil dari card.quotaTicket
              const sisaKuota = item.card?.quotaTicket ?? 0;
              // Tombol last redeem hanya aktif jika sisa kuota = 0
              const isQuotaEmpty = sisaKuota === 0;
              
              return (
              <tr
                key={item.id}
                className="border-b border-gray-200 hover:bg-gray-50 transition"
              >
                <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                  {formatDate(item.createdAt)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                  {item.card?.member?.name || '-'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap font-mono">
                  {item.card?.member?.identityNumber || '-'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap font-mono">
                  {item.transactionNumber}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap font-mono">
                  {item.card?.serialNumber || '-'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                    {item.card?.cardProduct?.category?.categoryName || '-'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                  {item.card?.cardProduct?.type?.typeName || '-'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      item.redeemType === 'SINGLE'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}
                  >
                    {item.redeemType === 'SINGLE'
                      ? 'Single Journey'
                      : 'Roundtrip'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 text-center whitespace-nowrap">
                  {item.quotaUsed || (item.redeemType === 'SINGLE' ? 1 : 2)}
                </td>
                <td className="px-4 py-3 text-sm text-center whitespace-nowrap">
                  <span className={`${isQuotaEmpty ? 'text-red-600' : 'text-green-600'}`}>
                    {sisaKuota}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                  {item.station?.stationName || '-'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-center">
                  {/* Tombol last redeem selalu terlihat, disabled jika sisa kuota > 0 */}
                  <button
                    onClick={() => isQuotaEmpty && onUploadLastDoc(item)}
                    className={`px-3 py-1 rounded text-xs font-medium transition ${
                      isQuotaEmpty
                        ? 'bg-green-600 text-white hover:bg-green-700 cursor-pointer'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                    title={
                      isQuotaEmpty
                        ? 'Upload Foto Last Redeem'
                        : 'Tombol akan aktif jika kuota telah habis'
                    }
                    disabled={!isQuotaEmpty}
                  >
                    Last Redeem
                  </button>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-center">
                  {canDelete && (
                    <button
                      onClick={() => onDelete(item)}
                      className="px-3 py-1 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700 transition"
                    >
                      Hapus
                    </button>
                  )}
                </td>
              </tr>
            );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
