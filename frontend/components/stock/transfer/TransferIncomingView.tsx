"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Eye } from "lucide-react";
import { StockPagination } from "../StockPagination";
import StatusBadge from "@/components/ui/status-badge";
import { useTransferIncoming } from "@/hooks/useTransferIncoming";
import SwitchTab, { SwitchTabItem } from "@/components/SwitchTab";
import { useContext } from "react";
import { UserContext } from "@/app/dashboard/superadmin/dashboard/dashboard-layout";

interface TransferIncomingViewProps {
  programType: "FWC" | "VOUCHER";
}

export default function TransferIncomingView({
  programType,
}: TransferIncomingViewProps) {
  const router = useRouter();
  const userContext = useContext(UserContext);
  const role = userContext?.role || "superadmin";
  const stationId = userContext?.stationId;

  const tabs: SwitchTabItem[] = [
    { label: "FWC", path: `/dashboard/${role}/stock/fwc/transfer` },
    { label: "Voucher", path: `/dashboard/${role}/stock/voucher/transfer` },
  ];

  const { data, loading, pagination, setPagination, filters } =
    useTransferIncoming({
      programType,
      stationId: role === "supervisor" ? stationId : undefined,
    });

  const { status, setStatus, search, setSearch } = filters;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 px-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold">
              Transfer Masuk ({programType})
            </h2>
          </div>
          {/* SwitchTab removed, controlled by parent page */}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-lg border">
          <div className="w-full sm:w-auto">
            <label className="text-xs font-medium text-gray-500 mb-1 block">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="w-full sm:w-48 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#8D1231] focus:outline-none"
            >
              <option value="all">Semua Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Diterima</option>
              <option value="REJECTED">Ditolak</option>
            </select>
          </div>

          <div className="flex-1 w-full">
            <label className="text-xs font-medium text-gray-500 mb-1 block">
              Cari
            </label>
            <input
              type="text"
              placeholder="Cari stasiun atau note..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#8D1231] focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="px-6">
        <div className="rounded-lg border bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#8D1231] text-white">
                <tr>
                  <th className="px-4 py-3 text-center w-16">No</th>
                  <th className="px-4 py-3 text-center">Tanggal Kirim</th>
                  <th className="px-4 py-3 text-center">Dari Stasiun</th>
                  <th className="px-4 py-3 text-center">Kategori</th>
                  <th className="px-4 py-3 text-center">Tipe</th>
                  <th className="px-4 py-3 text-center">Jumlah</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-10 text-center text-gray-500"
                    >
                      Loading...
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-10 text-center text-gray-500"
                    >
                      Tidak ada transfer masuk
                    </td>
                  </tr>
                ) : (
                  data.map((row, i) => (
                    <tr
                      key={row.id}
                      className="border-b hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 text-center text-gray-600">
                        {(pagination.page - 1) * pagination.limit + i + 1}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {new Date(row.movementAt).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3 text-center font-medium">
                        {row.station?.stationName || "-"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {row.category?.categoryName || "-"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {row.cardType?.typeName || "-"}
                      </td>
                      <td className="px-4 py-3 text-center font-bold">
                        {row.quantity}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() =>
                            router.push(
                              `/dashboard/${role}/stock/${programType.toLowerCase()}/transfer/${row.id}`,
                            )
                          }
                          className="mx-auto flex items-center justify-center w-8 h-8 rounded-full border hover:bg-[#8D1231] hover:text-white transition"
                          title="Lihat Detail & Terima"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4">
          <StockPagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={(p) =>
              setPagination((prev) => ({ ...prev, page: p }))
            }
          />
        </div>
      </div>
    </div>
  );
}
