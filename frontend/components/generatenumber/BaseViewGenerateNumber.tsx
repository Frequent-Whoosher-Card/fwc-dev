'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useGenerateNumber } from '@/hooks/useGenerateNumber';
import SwitchTab, { SwitchTabItem } from '@/components/SwitchTab';

export default function BaseViewGenerateNumber() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { batch, loadingBatch, fetchHistoryDetail, handleExportZip } = useGenerateNumber();

    const tabs: SwitchTabItem[] = [
        { label: 'FWC', path: '/dashboard/superadmin/generatenumber/fwc' },
        { label: 'Voucher', path: '/dashboard/superadmin/generatenumber/voucher' },
    ];

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

    useEffect(() => {
        if (id) {
            fetchHistoryDetail(id);
        }
    }, [id, fetchHistoryDetail]);

    if (loadingBatch) {
        return <div className="p-6">Loading...</div>;
    }

    if (!batch) {
        return (
            <div className="p-6 space-y-4">
                <p className="text-red-500">Data tidak ditemukan</p>
                <button onClick={() => router.back()} className="underline text-[#8D1231]">
                    Kembali
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 px-6">
            {/* HEADER */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="rounded-lg border p-2 hover:bg-gray-100">
                        <ArrowLeft size={18} />
                    </button>
                    <h2 className="text-lg font-semibold">Detail Serial Number + Barcode</h2>
                </div>

                <div className="flex items-center gap-4">
                    <SwitchTab items={tabs} />
                    <button
                        onClick={() => handleExportZip(batch)}
                        className="rounded-lg bg-[#8D1231] px-6 py-2 text-white"
                    >
                        Export ZIP
                    </button>
                </div>
            </div>

            {/* INFO */}
            <div className="rounded-xl border bg-white p-4 text-sm space-y-1">
                <p>
                    <b>Tanggal:</b> {batch.date}
                </p>
                <p>
                    <b>Product:</b> {batch.productLabel}
                </p>
                <p>
                    <b>Range:</b> {batch.start} – {batch.end}
                </p>
                <p>
                    <b>Total:</b> {batch.serials.length}
                </p>
            </div>

            {/* TABLE */}
            <div className="rounded-xl border bg-white overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 w-16 text-center">No</th>
                                <th className="px-4 py-3 text-left">Serial</th>
                                <th className="px-4 py-3 text-left">Barcode</th>
                            </tr>
                        </thead>
                        <tbody>
                            {batch.serials.map((item, index) => (
                                <tr key={item.serial} className="border-b">
                                    <td className="px-4 py-2 text-center">{index + 1}</td>
                                    <td className="px-4 py-2 font-mono">{item.serial}</td>
                                    <td className="px-4 py-2">
                                        {item.barcodeUrl ? (
                                            <img src={`${API_BASE_URL}${item.barcodeUrl}`} alt={item.serial} className="h-12" />
                                        ) : (
                                            <span className="text-gray-400 text-xs">Barcode tidak tersedia</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="px-4 py-3 text-sm text-gray-500">Total: {batch.serials.length}</div>
            </div>
        </div>
    );
}
