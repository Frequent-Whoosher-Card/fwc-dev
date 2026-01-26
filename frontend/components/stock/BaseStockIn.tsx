"use client";

import { useRouter } from "next/navigation";
import { Eye } from "lucide-react";
import { DeleteConfirmModal } from "./DeleteConfirmModal";
import SwitchTab, { SwitchTabItem } from "@/components/SwitchTab";
import { StockFilterReusable } from "./StockFilterReusable";
import { StockPagination } from "./StockPagination";
import { useStockIn } from "@/hooks/useStockIn";

interface BaseStockInProps {
  programType: "FWC" | "VOUCHER";
}

export default function BaseStockIn({ programType }: BaseStockInProps) {
  const router = useRouter();

  const tabs: SwitchTabItem[] = [
    { label: "FWC", path: "/dashboard/superadmin/stock/fwc/in" },
    { label: "Voucher", path: "/dashboard/superadmin/stock/voucher/in" },
  ];

  const {
    data,
    pagination,
    setPagination,
    loading,
    filters,
    deleteModal,
    handleExportPDF,
  } = useStockIn({ programType });

  const {
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    category,
    setCategory,
    type,
    setType,
  } = filters;

  const {
    openDelete,
    setOpenDelete,
    setSelectedId,
    selectedSerial,
    setSelectedSerial,
    handleDelete,
  } = deleteModal;

  if (programType === "VOUCHER") {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold whitespace-nowrap">
              Stock In (Vendor → Office)
            </h2>
            <SwitchTab items={tabs} />
          </div>
        </div>
        <div className="rounded-lg border bg-white p-20 text-center text-gray-400">
          Data Voucher belum tersedia
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold whitespace-nowrap">
            Stock In (Vendor → Office)
          </h2>
          <SwitchTab items={tabs} />
        </div>

        <StockFilterReusable
          values={{
            category,
            type,
            startDate: fromDate,
            endDate: toDate,
          }}
          onFilterChange={(newValues) => {
            if (newValues.category !== undefined)
              setCategory(newValues.category);
            if (newValues.type !== undefined) setType(newValues.type);
            if (newValues.startDate !== undefined)
              setFromDate(newValues.startDate);
            if (newValues.endDate !== undefined) setToDate(newValues.endDate);
            setPagination((p) => ({ ...p, page: 1 }));
          }}
          onReset={() => {
            setCategory("all");
            setType("all");
            setFromDate("");
            setToDate("");
            setPagination((p) => ({ ...p, page: 1 }));
          }}
          onExportPDF={handleExportPDF}
          onAdd={() =>
            router.push(
              `/dashboard/superadmin/stock/${programType.toLowerCase()}/in/add`,
            )
          }
          showFields={{
            category: true,
            type: true,
            dateRange: true,
            exportPDF: true,
            add: true,
          }}
          addLabel="Tambah"
        />
      </div>

      <div className="rounded-lg border bg-white overflow-x-auto">
        <table className="w-full min-w-200 text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="p-3">No</th>
              <th className="p-3">Tanggal</th>
              <th className="p-3">Category</th>
              <th className="p-3">Type</th>
              <th className="p-3">Stock</th>
              <th className="p-3">View</th>
              <th className="p-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="p-6 text-center">
                  Loading...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6 text-center">
                  Tidak ada data
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr key={row.id} className="border-b-2 hover:bg-gray-50">
                  <td className="px-3 py-2 text-center">
                    {(pagination.page - 1) * pagination.limit + index + 1}
                  </td>
                  <td className="px-3 py-2 text-center whitespace-nowrap">
                    {new Date(row.tanggal)
                      .toLocaleDateString("id-ID")
                      .replace(/\//g, "-")}
                  </td>
                  <td className="px-3 py-2 text-center">{row.category}</td>
                  <td className="px-3 py-2 text-center">{row.type}</td>
                  <td className="px-3 py-2 text-center font-medium">
                    {row.stock.toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() =>
                        router.push(
                          `/dashboard/superadmin/stock/${programType.toLowerCase()}/in/${row.id}/view`,
                        )
                      }
                      className="mx-auto flex items-center justify-center w-8 h-8 border border-gray-300 rounded-md text-gray-500 hover:bg-[#8D1231] hover:text-white transition-colors duration-200"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                  <td className="px-3 py-2 text-center space-x-2">
                    <button
                      onClick={() => {
                        setSelectedId(row.id);
                        let serialRange = "-";
                        if (
                          Array.isArray(row.sentSerialNumbers) &&
                          row.sentSerialNumbers.length > 0
                        ) {
                          const first = row.sentSerialNumbers[0];
                          const last =
                            row.sentSerialNumbers[
                              row.sentSerialNumbers.length - 1
                            ];
                          serialRange =
                            first === last ? first : `${first} - ${last}`;
                        }
                        setSelectedSerial(serialRange);
                        setOpenDelete(true);
                      }}
                      className="rounded-md border border-[#8D1231] px-3 py-1 text-xs font-medium text-[#8D1231] hover:bg-[#8D1231] hover:text-white transition-colors"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
          setSelectedSerial("");
        }}
        onConfirm={handleDelete}
        title="Konfirmasi Hapus Data"
        description="Apakah Anda yakin ingin menghapus data ini"
        serialNumber={selectedSerial}
      />
    </div>
  );
}
