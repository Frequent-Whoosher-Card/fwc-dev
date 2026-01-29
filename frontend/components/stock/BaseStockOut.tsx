"use client";

import { useRouter } from "next/navigation";
import { Eye } from "lucide-react";
import { DeleteConfirmModal } from "./DeleteConfirmModal";
import { StockFilterReusable } from "./StockFilterReusable";
import { StockPagination } from "./StockPagination";
import SwitchTab, { SwitchTabItem } from "@/components/SwitchTab";
import StatusBadge from "@/components/ui/status-badge";
import { useStockOut } from "@/hooks/useStockOut";

interface BaseStockOutProps {
  programType: "FWC" | "VOUCHER";
}

export default function BaseStockOut({ programType }: BaseStockOutProps) {
  const router = useRouter();

  const tabs: SwitchTabItem[] = [
    { label: "FWC", path: "/dashboard/superadmin/stock/fwc/out" },
    { label: "Voucher", path: "/dashboard/superadmin/stock/voucher/out" },
  ];

  const {
    data,
    pagination,
    setPagination,
    loading,
    filters,
    deleteModal,
    handleExportPDF,
  } = useStockOut({ programType });

  const {
    category,
    setCategory,
    type,
    setType,
    station,
    setStation,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
  } = filters;

  const { openDelete, setOpenDelete, setSelectedId, handleDelete } =
    deleteModal;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold whitespace-nowrap">
            Stock Out (Admin → Stasiun)
          </h2>
          <SwitchTab items={tabs} />
        </div>

        <StockFilterReusable
          programType={programType}
          values={{
            category,
            type,
            station,
            startDate: fromDate,
            endDate: toDate,
          }}
          onFilterChange={(newValues) => {
            if (newValues.category !== undefined)
              setCategory(newValues.category);
            if (newValues.type !== undefined) setType(newValues.type);
            if (newValues.station !== undefined) setStation(newValues.station);
            if (newValues.startDate !== undefined)
              setFromDate(newValues.startDate);
            if (newValues.endDate !== undefined) setToDate(newValues.endDate);
            setPagination((p) => ({ ...p, page: 1 }));
          }}
          onReset={() => {
            setCategory("all");
            setType("all");
            setStation("all");
            setFromDate("");
            setToDate("");
            setPagination((p) => ({ ...p, page: 1 }));
          }}
          onExportPDF={handleExportPDF}
          onAdd={() =>
            router.push(
              `/dashboard/superadmin/stock/${programType.toLowerCase()}/out/add`,
            )
          }
          showFields={{
            category: true,
            type: true,
            station: true,
            dateRange: true,
            exportPDF: true,
            add: true,
          }}
          addLabel="Tambah"
        />
      </div>

      <div className="rounded-lg border bg-white overflow-hidden">
        <div className="flex items-center justify-end px-4 py-3 border-b bg-gray-50">
          <span className="inline-flex items-center gap-2 rounded-lg border border-[#8D1231]/20 bg-[#8D1231]/5 px-3 py-1 text-sm font-medium text-[#8D1231]">
            Total Data: <b>{pagination.total || 0}</b>
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] border-collapse text-sm">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-3 py-2 text-center">No</th>
                <th className="px-3 py-2 text-center">Tanggal</th>
                <th className="px-3 py-2 text-center">Card Category</th>
                <th className="px-3 py-2 text-center">Card Type</th>
                <th className="px-3 py-2 text-center">Batch</th>
                <th className="px-3 py-2 text-center">Nota Dinas</th>
                <th className="px-3 py-2 text-center">BAST</th>
                <th className="px-3 py-2 text-center">Stasiun</th>
                <th className="px-3 py-2 text-center whitespace-nowrap">
                  Serial Number
                </th>
                <th className="px-3 py-2 text-center">Status</th>
                <th className="px-3 py-2 text-center">Note</th>
                <th className="px-4 py-3 text-center">View</th>
                <th className="px-3 py-2 text-center">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={13}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    Loading...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td
                    colSpan={13}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    Tidak ada data stock keluar
                  </td>
                </tr>
              ) : (
                data.map((row, index) => (
                  <tr key={row.id} className="border-b hover:bg-gray-50">
                    <td className="px-3 py-2 text-center">
                      {(pagination.page - 1) * pagination.limit + index + 1}
                    </td>
                    <td className="px-3 py-2 text-center whitespace-nowrap">
                      {new Date(row.movementAt)
                        .toLocaleDateString("id-ID")
                        .replace(/\//g, "-")}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {row.cardCategory.name}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {row.cardType.name || "-"}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {row.batchId || "-"}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {row.notaDinas || "-"}
                    </td>
                    <td className="px-3 py-2 text-center">{row.bast || "-"}</td>
                    <td className="px-3 py-2 text-center">
                      {row.stationName ? (
                        <span className="rounded px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700">
                          {row.stationName}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-3 py-2 text-center font-medium whitespace-nowrap">
                      {row.sentSerialNumbers?.length > 0
                        ? `${row.sentSerialNumbers[0]} - ${row.sentSerialNumbers[row.sentSerialNumbers.length - 1]}`
                        : "-"}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${row.status === "APPROVED" ? "bg-green-100 text-green-700" : row.status === "PENDING" ? "bg-yellow-100 text-yellow-700" : row.status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center max-w-[200px] truncate">
                      {row.note || "-"}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button
                        onClick={() =>
                          router.push(
                            `/dashboard/superadmin/stock/${programType.toLowerCase()}/out/${row.id}/view`,
                          )
                        }
                        className="mx-auto flex items-center justify-center w-8 h-8 border border-gray-300 rounded-md text-gray-500 hover:bg-[#8D1231] hover:text-white transition-colors duration-200"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          disabled={row.status === "APPROVED"}
                          onClick={() => {
                            if (row.status !== "APPROVED")
                              router.push(
                                `/dashboard/superadmin/stock/${programType.toLowerCase()}/out/${row.id}/edit`,
                              );
                          }}
                          className={`rounded-md border px-3 py-1 text-xs transition-colors duration-200 ${row.status === "APPROVED" ? "border-gray-300 text-gray-400 bg-gray-100 cursor-not-allowed" : "border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white"}`}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setSelectedId(row.id);
                            setOpenDelete(true);
                          }}
                          className="rounded-md border border-[#8D1231] px-3 py-1 text-xs text-[#8D1231] hover:bg-[#8D1231] hover:text-white"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <StockPagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={(p) => setPagination((pg) => ({ ...pg, page: p }))}
      />

      <DeleteConfirmModal
        open={openDelete}
        onClose={() => {
          setOpenDelete(false);
          setSelectedId(null);
        }}
        onConfirm={handleDelete}
      />
    </div>
  );
}
