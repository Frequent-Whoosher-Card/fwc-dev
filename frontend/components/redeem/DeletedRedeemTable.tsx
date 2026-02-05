"use client";

import { useState } from 'react';
import { RedeemItem } from '@/lib/services/redeem/redeemService';

interface DeletedRedeemTableProps {
    data: RedeemItem[];
    isLoading: boolean;
    noDataMessage?: string;
    currentPage: number;
    totalPages: number;
    totalCount: number;
    onPageChange: (page: number) => void;
    product?: 'FWC' | 'VOUCHER';
}

export default function DeletedRedeemTable({
    data,
    isLoading,
    noDataMessage,
    currentPage,
    totalPages,
    totalCount,
    onPageChange,
    product,
}: DeletedRedeemTableProps) {
    const [openNotesId, setOpenNotesId] = useState<string | null>(null);
    const [notesContent, setNotesContent] = useState<string | null>(null);

    const handleViewNotes = (item: RedeemItem) => {
        setOpenNotesId(item.id);
        setNotesContent(item.notes || '-');
    };

    const handleCloseNotes = () => {
        setOpenNotesId(null);
        setNotesContent(null);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Pagination helper
    const pageNumbers = Array.from(
        { length: totalPages },
        (_, i) => i + 1
    ).slice(Math.max(0, currentPage - 3), currentPage + 2);

    return (
        <div className="w-full mt-8">
            <div className="bg-red-50 px-4 py-3 border border-red-200 rounded-t-lg flex justify-between items-center">
                <h3 className="text-red-800 font-semibold">Riwayat Penghapusan</h3>
                <span className="text-xs font-semibold text-red-700 bg-red-100 px-2 py-1 rounded border border-red-200">
                    Total Data : {totalCount}
                </span>
            </div>
            <div className="overflow-x-auto border border-t-0 border-red-200 rounded-b-lg scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                <table className="min-w-[900px] md:min-w-full text-sm">
                    <thead>
                        <tr className="bg-red-50/50 border-b border-red-100">
                            <th className="px-2 md:px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Tanggal Dihapus</th>
                            {product === 'VOUCHER' ? (
                                <>
                                    <th className="px-2 md:px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Nama PIC</th>
                                    <th className="px-2 md:px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">NIK PIC</th>
                                    <th className="px-2 md:px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Nama Pelanggan</th>
                                    <th className="px-2 md:px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">NIK Pelanggan</th>
                                </>
                            ) : (
                                <>
                                    <th className="px-2 md:px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Nama Pelanggan</th>
                                    <th className="px-2 md:px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">NIK</th>
                                </>
                            )}
                            <th className="px-2 md:px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Nomor Transaksi</th>
                            <th className="px-2 md:px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Serial Kartu</th>
                            <th className="px-2 md:px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Kategori Kartu</th>
                            <th className="px-2 md:px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Tipe Kartu</th>
                            {product !== 'VOUCHER' && (
                                <th className="px-2 md:px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Tipe Perjalanan</th>
                            )}
                            <th className="px-2 md:px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Operator</th>
                            <th className="px-2 md:px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Stasiun</th>
                            <th className="px-2 md:px-4 py-3 text-center font-semibold text-gray-700 whitespace-nowrap">Alasan Hapus</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan={product === 'VOUCHER' ? 12 : 11} className="px-4 py-8 text-center text-gray-500">
                                    <div className="flex justify-center">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
                                    </div>
                                </td>
                            </tr>
                        ) : !data || data.length === 0 ? (
                            <tr>
                                <td colSpan={product === 'VOUCHER' ? 12 : 11} className="px-4 py-8 text-center text-gray-500">
                                    {noDataMessage || 'Tidak ada data yang dihapus'}
                                </td>
                            </tr>
                        ) : (
                            data.map((item) => (
                                <tr
                                    key={item.id}
                                    className="border-b border-gray-100 hover:bg-red-50 transition"
                                >
                                    <td className="px-2 md:px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                                        {/* Note: item.updatedAt usually reflects deletion time in soft delete if updated */}
                                        {formatDate(item.updatedAt)}
                                    </td>
                                    {product === 'VOUCHER' ? (
                                        <>
                                            <td className="px-2 md:px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                                                {item.card?.member?.name || '-'}
                                            </td>
                                            <td className="px-2 md:px-4 py-3 text-sm text-gray-900 whitespace-nowrap font-mono">
                                                {item.card?.member?.identityNumber || '-'}
                                            </td>
                                            <td className="px-2 md:px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                                                {item.passengers?.[0]?.passengerName || '-'}
                                            </td>
                                            <td className="px-2 md:px-4 py-3 text-sm text-gray-900 whitespace-nowrap font-mono">
                                                {item.passengers?.[0]?.nik || '-'}
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="px-2 md:px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                                                {item.card?.member?.name || '-'}
                                            </td>
                                            <td className="px-2 md:px-4 py-3 text-sm text-gray-900 whitespace-nowrap font-mono">
                                                {item.card?.member?.identityNumber || '-'}
                                            </td>
                                        </>
                                    )}
                                    <td className="px-2 md:px-4 py-3 text-sm text-gray-900 whitespace-nowrap font-mono">
                                        {item.transactionNumber || '-'}
                                    </td>
                                    <td className="px-2 md:px-4 py-3 text-sm text-gray-900 whitespace-nowrap font-mono">
                                        {item.card?.serialNumber || '-'}
                                    </td>
                                    <td className="px-2 md:px-4 whitespace-nowrap">
                                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                                            {item.card?.cardProduct?.category?.categoryName || '-'}
                                        </span>
                                    </td>
                                    <td className="px-2 md:px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                                        {item.card?.cardProduct?.type?.typeName || '-'}
                                    </td>
                                    {product !== 'VOUCHER' && (
                                        <td className="px-2 md:px-4 whitespace-nowrap">
                                            <span
                                                className={`px-2 py-1 rounded text-xs font-medium ${item.redeemType === 'SINGLE'
                                                    ? 'bg-orange-50 text-orange-800'
                                                    : 'bg-purple-50 text-purple-800'
                                                    }`}
                                            >
                                                {item.redeemType === 'SINGLE'
                                                    ? 'Single Journey'
                                                    : 'Roundtrip'}
                                            </span>
                                        </td>
                                    )}
                                    <td className="px-2 md:px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                                        {item.operator?.fullName || '-'}
                                    </td>
                                    <td className="px-2 md:px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                                        {item.station?.stationName || '-'}
                                    </td>
                                    <td className="px-2 md:px-4 py-3 text-center whitespace-nowrap">
                                        {item.notes ? (
                                            <button
                                                className="px-3 py-1 rounded text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 transition"
                                                onClick={() => handleViewNotes(item)}
                                            >
                                                Lihat Alasan
                                            </button>
                                        ) : (
                                            <span className="text-gray-400 text-xs italic">Tanpa Alasan</span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {!isLoading && totalPages > 1 && (
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-600">
                    <button
                        disabled={currentPage === 1}
                        onClick={() => {
                            if (currentPage > 1) {
                                onPageChange(currentPage - 1);
                            }
                        }}
                        className="px-2 disabled:opacity-40 hover:text-red-700 transition"
                    >
                        Previous
                    </button>

                    {pageNumbers.map((p) => (
                        <button
                            key={p}
                            onClick={() => {
                                onPageChange(p);
                            }}
                            className={`px-3 py-1 rounded ${p === currentPage
                                ? 'bg-red-100 text-red-800 font-semibold'
                                : 'hover:bg-gray-100'
                                }`}
                        >
                            {p}
                        </button>
                    ))}

                    <button
                        disabled={currentPage === totalPages}
                        onClick={() => {
                            if (currentPage < totalPages) {
                                onPageChange(currentPage + 1);
                            }
                        }}
                        className="px-2 disabled:opacity-40 hover:text-red-700 transition"
                    >
                        Next
                    </button>
                </div>
            )}

            {/* Modal Notes */}
            {openNotesId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
                        <h2 className="text-lg font-semibold mb-4 text-red-800">Alasan Penghapusan</h2>
                        <div className="mb-6 whitespace-pre-line text-gray-800 bg-gray-50 p-4 rounded border border-gray-200 min-h-[100px]">
                            {notesContent}
                        </div>
                        <div className="flex justify-end">
                            <button
                                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
                                onClick={handleCloseNotes}
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
