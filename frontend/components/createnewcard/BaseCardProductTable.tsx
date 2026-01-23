'use client';

import { useRouter } from 'next/navigation';
import { CardProduct } from '@/types/card';
import { ProgramType } from '@/lib/services/card.base.service';

interface Props {
    programType: ProgramType;
    data: CardProduct[];
    onDelete?: (id: string) => void;
}

export default function BaseCardProductTable({ programType, data, onDelete }: Props) {
    const router = useRouter();

    const handleEdit = (id: string) => {
        router.push(`/dashboard/superadmin/createnewcard/${programType.toLowerCase()}/${id}/edit`);
    };

    const formatRupiah = (number: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(number);
    };

    return (
        <div className="rounded-xl border bg-white overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                        <tr className="text-left text-gray-600 uppercase text-xs tracking-wide">
                            <th className="px-6 py-3">Category</th>
                            <th className="px-6 py-3 text-center">Type</th>
                            <th className="px-6 py-3 text-center">Serial</th>
                            <th className="px-6 py-3 text-center">Days</th>
                            <th className="px-6 py-3 text-center">Price</th>
                            <th className="px-6 py-3 text-center">Quota</th>
                            <th className="px-6 py-3 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {data.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-10 text-center text-gray-400">
                                    Belum ada data
                                </td>
                            </tr>
                        ) : (
                            data.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-medium">{item.category?.categoryName || '-'}</td>
                                    <td className="px-6 py-4 text-center">{item.type?.typeName || '-'}</td>
                                    <td className="px-6 py-4 text-center font-mono text-xs">{item.serialTemplate}</td>
                                    <td className="px-6 py-4 text-center">{item.masaBerlaku}</td>
                                    <td className="px-6 py-4 text-center">{formatRupiah(item.price)}</td>
                                    <td className="px-6 py-4 text-center font-medium">{item.totalQuota.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-3">
                                            <button
                                                onClick={() => handleEdit(item.id)}
                                                className="rounded border border-blue-600 px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                                            >
                                                Edit
                                            </button>
                                            {onDelete && (
                                                <button
                                                    onClick={() => onDelete(item.id)}
                                                    className="rounded border border-red-600 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
