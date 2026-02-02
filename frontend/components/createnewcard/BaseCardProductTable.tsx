import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { type CardProduct } from "@/types/card";
import { type ProgramType } from "@/lib/services/card.base.service";

interface Props {
  programType: ProgramType;
  data: CardProduct[];
  onDelete?: (id: string) => void;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  totalData?: number;
}

export default function BaseCardProductTable({
  programType,
  data,
  onDelete,
  page = 1,
  totalPages = 1,
  onPageChange,
  totalData = 0,
}: Props) {
  const router = useRouter();

  const handleEdit = (id: string) => {
    router.push(
      `/dashboard/superadmin/createnewcard/${programType.toLowerCase()}/${id}/edit`,
    );
  };

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(number);
  };

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="flex items-center justify-end px-6 py-4 border-b bg-gray-50">
          <span className="inline-flex items-center gap-2 rounded-lg border border-[#8D1231]/20 bg-[#8D1231]/5 px-3 py-1 text-sm font-medium text-[#8D1231]">
            Total Data: <b>{totalData}</b>
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[#8D1231] text-white">
              <tr className="text-left uppercase text-xs tracking-wide">
                <th className="px-6 py-3">No</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3 text-center">Type</th>
                <th className="px-6 py-3 text-center">Serial</th>
                <th className="px-6 py-3 text-center">Days</th>
                <th className="px-6 py-3 text-center">Price</th>
                <th className="px-6 py-3 text-center">Quota</th>
                {programType === "VOUCHER" && (
                  <>
                    <th className="px-6 py-3 text-center">Max. Generate</th>
                    <th className="px-6 py-3 text-center">Diskon</th>
                  </>
                )}
                <th className="px-6 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.length === 0 ? (
                <tr>
                  <td
                    colSpan={programType === "VOUCHER" ? 9 : 7}
                    className="px-6 py-10 text-center text-gray-400"
                  >
                    Belum ada data
                  </td>
                </tr>
              ) : (
                data.map((item, index) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium">
                      {(page - 1) * 10 + index + 1}
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {item.category?.categoryName || "-"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {item.type?.typeName || "-"}
                    </td>
                    <td className="px-6 py-4 text-center font-mono text-xs">
                      {item.serialTemplate}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {item.masaBerlaku}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {formatRupiah(item.price)}
                    </td>
                    <td className="px-6 py-4 text-center font-medium">
                      {item.totalQuota.toLocaleString()}
                    </td>
                    {programType === "VOUCHER" && (
                      <>
                        <td className="px-6 py-4 text-center font-medium">
                          {item.maxQuantity
                            ? item.maxQuantity.toLocaleString()
                            : "No Limit"}
                        </td>
                        <td className="px-6 py-4 text-center font-medium">
                          {item.isDiscount ? "Ya" : "Tidak"}
                        </td>
                      </>
                    )}
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => handleEdit(item.id)}
                          title="Edit"
                          className="rounded border border-blue-600 px-3 py-1 text-xs font-medium text-blue-600 transition-colors duration-200 hover:bg-blue-600 hover:text-white"
                        >
                          Edit
                        </button>
                        {onDelete && (
                          <button
                            onClick={() => onDelete(item.id)}
                            disabled={item.hasGeneratedCards}
                            title={
                              item.hasGeneratedCards
                                ? "Sudah di-generate number"
                                : "Delete"
                            }
                            className={`rounded border px-3 py-1 text-xs font-medium transition-colors duration-200 ${
                              item.hasGeneratedCards
                                ? "border-gray-300 text-gray-400 cursor-not-allowed bg-gray-50"
                                : "border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                            }`}
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

      {/* PAGINATION */}
      {totalPages > 1 && onPageChange && (
        <div className="flex justify-center gap-2 text-sm pt-2">
          <button
            disabled={page === 1}
            onClick={() => onPageChange(page - 1)}
            className="p-1 disabled:opacity-40 hover:bg-gray-100 rounded transition-colors"
          >
            <ChevronLeft size={18} />
          </button>

          {pageNumbers.map((p) => (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`px-3 py-1 rounded transition-colors ${
                p === page
                  ? "bg-[#8D1231] text-white font-semibold"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {p}
            </button>
          ))}

          <button
            disabled={page === totalPages}
            onClick={() => onPageChange(page + 1)}
            className="p-1 disabled:opacity-40 hover:bg-gray-100 rounded transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
