"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { CardProduct } from "@/types/card";
import { cardFWCService } from "@/lib/services/card.fwc.service";
import ConfirmModal from "@/components/ConfirmModal";

interface Props {
  data: CardProduct[];
  onRefresh: () => void;
}

export default function CardProductTable({ data, onRefresh }: Props) {
  const router = useRouter();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /* ======================
     DELETE HANDLER
  ====================== */
  const handleConfirmDelete = async () => {
    if (!selectedId) return;

    setLoading(true);
    try {
      await cardFWCService.deleteProduct(selectedId);
      toast.success("Card product berhasil dihapus");
      onRefresh();
    } catch {
      toast.error("Gagal menghapus card product");
    } finally {
      setLoading(false);
      setSelectedId(null);
    }
  };

  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl border bg-white py-6 text-center text-gray-400">
        Belum ada card product
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border bg-white overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-[#8D1231] text-white">
            <tr>
              <th className="px-4 py-3 text-center">Category</th>
              <th className="px-4 py-3 text-center">Type</th>
              <th className="px-4 py-3 text-center">Masa Berlaku</th>
              <th className="px-4 py-3 text-center">Harga</th>
              <th className="px-4 py-3 text-center">Kuota</th>
              <th className="px-4 py-3 text-center">Serial</th>
              <th className="px-4 py-3 text-center">Aksi</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {data.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-center">
                  {p.category?.categoryName ?? "-"}
                </td>

                <td className="px-4 py-3 text-center">
                  {p.type?.typeName ?? "-"}
                </td>

                <td className="px-4 py-3 text-center">{p.masaBerlaku} hari</td>

                <td className="px-4 py-3 text-center">
                  Rp {Number(p.price).toLocaleString("id-ID")}
                </td>

                <td className="px-4 py-3 text-center">{p.totalQuota}</td>

                <td className="px-4 py-3 font-mono text-xs text-center">
                  {p.serialTemplate}
                </td>

                {/* ACTION */}
                <td className="px-4 py-3 text-center">
                  <div className="flex justify-center gap-2">
                    {/* EDIT */}
                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          `/dashboard/superadmin/createnewcard/fwc/${p.id}/edit`,
                        )
                      }
                      className="h-9 px-3 rounded-md border border-blue-500 text-blue-600 text-xs font-medium transition-colors duration-200 hover:bg-blue-600 hover:text-white"
                    >
                      Edit
                    </button>

                    {/* DELETE */}
                    <button
                      type="button"
                      onClick={() => setSelectedId(p.id)}
                      className="h-9 px-3 rounded-md border border-[#8D1231] text-[#8D1231] text-xs font-medium transition-colors duration-200 hover:bg-[#8D1231] hover:text-white"
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

      {/* CONFIRM MODAL */}
      <ConfirmModal
        open={!!selectedId}
        title="Hapus Card Product"
        description="Data yang sudah dihapus tidak dapat dikembalikan. Lanjutkan?"
        confirmText="Ya, Hapus"
        cancelText="Batal"
        loading={loading}
        onCancel={() => setSelectedId(null)}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
