'use client';

import { RedeemItem } from '@/lib/services/redeem/redeemService';
import { useMemo, useState } from 'react';

interface RedeemTableProps {
  data: RedeemItem[];
  onUploadLastDoc: (item: RedeemItem) => void;
  onDelete: (item: RedeemItem) => void;
  canDelete: boolean;
  isLoading: boolean;
  noDataMessage?: string;
}

export default function RedeemTable({
  data,
  onUploadLastDoc,
  onDelete,
  canDelete,
  isLoading,
  noDataMessage,
}: RedeemTableProps) {
  // Debug jumlah data diterima

  const formatDate = (date: string) => {
    if (!date) return '-';
    const d = new Date(date);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  const formatCurrency = (nominal: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(nominal);
  };

  const [openNotesId, setOpenNotesId] = useState<string | null>(null);
  const [notesContent, setNotesContent] = useState<string | null>(null);

  const handleViewNotes = (item: RedeemItem) => {
    setOpenNotesId(item.id);
    setNotesContent(item.notes || '');
  };

  const handleCloseNotes = () => {
    setOpenNotesId(null);
    setNotesContent(null);
  };

  return (
    <div className="w-full overflow-x-auto border border-gray-200 rounded-lg scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
      <table className="min-w-[900px] md:min-w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b-2 border-gray-200">
            <th className="px-2 md:px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Tanggal Redeem</th>
            <th className="px-2 md:px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Nama Pelanggan</th>
            <th className="px-2 md:px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">NIK</th>
            <th className="px-2 md:px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Nomor Transaksi</th>
            <th className="px-2 md:px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Serial Kartu</th>
            <th className="px-2 md:px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Kategori Kartu</th>
            <th className="px-2 md:px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Tipe Kartu</th>
            <th className="px-2 md:px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Tipe Perjalanan</th>
            <th className="px-2 md:px-4 py-3 text-center font-semibold text-gray-700 whitespace-nowrap">Kuota Terpakai</th>
            <th className="px-2 md:px-4 py-3 text-center font-semibold text-gray-700 whitespace-nowrap">Sisa Kuota</th>
            <th className="px-2 md:px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Operator</th>
            <th className="px-2 md:px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Stasiun</th>
            <th className="px-2 md:px-4 py-3 text-center font-semibold text-gray-700 whitespace-nowrap">Notes</th>
            <th className="px-2 md:px-4 py-3 text-center font-semibold text-gray-700 whitespace-nowrap">Last Redeem</th>
            <th className="px-2 md:px-4 py-3 text-center font-semibold text-gray-700 whitespace-nowrap">Aksi</th>
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
                {noDataMessage || 'Tidak ada data redeem'}
              </td>
            </tr>
          ) : (
            data.map((item) => {
              const sisaKuota = item.remainingQuota ?? 0;
              const isQuotaEmpty = sisaKuota === 0;
              return (
                <tr
                  key={item.id}
                  className="border-b border-gray-200 hover:bg-gray-50 transition"
                >
                  <td className="px-2 md:px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                    {formatDate(item.createdAt)}
                  </td>
                  <td className="px-2 md:px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                    {item.card?.member?.name || '-'}
                  </td>
                  <td className="px-2 md:px-4 py-3 text-sm text-gray-900 whitespace-nowrap font-mono">
                    {item.card?.member?.identityNumber || '-'}
                  </td>
                  <td className="px-2 md:px-4 py-3 text-sm text-gray-900 whitespace-nowrap font-mono">
                    {item.transactionNumber || '-'}
                  </td>
                  <td className="px-2 md:px-4 py-3 text-sm text-gray-900 whitespace-nowrap font-mono">
                    {item.card?.serialNumber || '-'}
                  </td>
                  <td className="px-2 md:px-4 whitespace-nowrap">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                      {item.card?.cardProduct?.category?.categoryName || '-'}
                    </span>
                  </td>
                  <td className="px-2 md:px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                    {item.card?.cardProduct?.type?.typeName || '-'}
                  </td>
                  <td className="px-2 md:px-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${item.redeemType === 'SINGLE'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-purple-100 text-purple-800'
                        }`}
                    >
                      {item.redeemType === 'SINGLE'
                        ? 'Single Journey'
                        : 'Roundtrip'}
                    </span>
                  </td>
                  <td className="px-2 md:px-4 py-3 text-sm text-gray-900 text-center whitespace-nowrap">
                    {item.quotaUsed || (item.redeemType === 'SINGLE' ? 1 : 2)}
                  </td>
                  <td className="px-2 md:px-4 py-3 text-sm text-center whitespace-nowrap">
                    <span className={`${isQuotaEmpty ? 'text-red-600' : 'text-green-600'}`}>
                      {sisaKuota}
                    </span>
                  </td>
                  <td className="px-2 md:px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                    {item.operator?.fullName || '-'}
                  </td>
                  <td className="px-2 md:px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                    {item.station?.stationName || '-'}
                  </td>
                  <td className="px-2 md:px-4 py-3 text-center whitespace-nowrap">
                    {item.notes ? (
                      <button
                        className="px-3 py-1 rounded text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition"
                        onClick={() => handleViewNotes(item)}
                      >
                        View Notes
                      </button>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-2 md:px-4 whitespace-nowrap text-center">
                    {/* Tombol last redeem selalu terlihat, disabled jika sisa kuota > 0 */}
                    <button
                      onClick={() => isQuotaEmpty && onUploadLastDoc(item)}
                      className={`px-3 py-1 rounded text-xs font-medium transition ${isQuotaEmpty
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
                  <td className="px-2 md:px-4 whitespace-nowrap text-center">
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
      {/* Modal Notes */}
      {openNotesId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <h2 className="text-lg font-semibold mb-4">Notes</h2>
            <div className="mb-6 whitespace-pre-line text-gray-800">{notesContent}</div>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={handleCloseNotes}
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
