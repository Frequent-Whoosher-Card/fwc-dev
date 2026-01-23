'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import ConfirmModal from '@/components/ConfirmModal';

interface VoucherProduct {
  id: string;
  masaBerlaku: number;
  price: number;
  totalQuota: number;
  serialTemplate: string;
  category: { categoryName: string };
  type: { typeName: string };
}

interface Props {
  data: VoucherProduct[];
  onDelete: (id: string) => Promise<void>;
}

export default function CardProductVoucherTable({ data, onDelete }: Props) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleConfirmDelete = async () => {
    if (!selectedId) return;
    setLoading(true);
    try {
      await onDelete(selectedId);
    } finally {
      setLoading(false);
      setSelectedId(null);
    }
  };

  if (!data || data.length === 0) {
    return <div className="rounded-xl border bg-white py-6 text-center text-gray-400">Belum ada voucher</div>;
  }

  return (
    <>
      <div className="rounded-xl border bg-white overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr className="text-xs uppercase tracking-wide text-gray-600">
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-center">Masa Berlaku</th>
              <th className="px-4 py-3 text-right">Harga</th>
              <th className="px-4 py-3 text-center">Kuota</th>
              <th className="px-4 py-3 text-left">Serial</th>
              <th className="px-4 py-3 text-center">Aksi</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">{item.category.categoryName}</td>
                <td className="px-4 py-3">{item.type.typeName}</td>
                <td className="px-4 py-3 text-center">{item.masaBerlaku} hari</td>
                <td className="px-4 py-3 text-right">Rp {item.price.toLocaleString('id-ID')}</td>
                <td className="px-4 py-3 text-center">{item.totalQuota}</td>
                <td className="px-4 py-3 font-mono text-xs">{item.serialTemplate}</td>

                {/* AKSI */}
                <td className="px-4 py-3 text-center">
                  <div className="flex justify-center gap-2">
                    {/* EDIT */}
                    <button
                      onClick={() => router.push(`/dashboard/superadmin/createnewcard/voucher/${item.id}/edit`)}
                      className="
        rounded-md border border-blue-500 px-3 py-1 text-xs
        text-blue-600 transition-colors duration-200
        hover:bg-blue-500 hover:text-white
      "
                    >
                      Edit
                    </button>

                    {/* DELETE */}
                    <button
                      onClick={() => setSelectedId(item.id)}
                      className="
        rounded-md border border-[#8D1231] px-3 py-1 text-xs
        text-[#8D1231] transition-colors duration-200
        hover:bg-[#8D1231] hover:text-white
      "
                    >
                      Hapus
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        open={!!selectedId}
        title="Hapus Voucher"
        description="Voucher yang dihapus tidak dapat dikembalikan. Lanjutkan?"
        confirmText="Ya, Hapus"
        cancelText="Batal"
        loading={loading}
        onCancel={() => setSelectedId(null)}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
