"use client";

import { useRouter } from "next/navigation";
import { Eye } from "lucide-react";
import { DeleteConfirmModal } from "./DeleteConfirmModal";
import SwitchTab, { SwitchTabItem } from "@/components/SwitchTab";
import { StockFilterReusable } from "./StockFilterReusable";
import { StockPagination } from "./StockPagination";
import { useStockIn } from "@/hooks/useStockIn";
import { useLanguage } from "@/hooks/useLanguage";

interface BaseStockInProps {
  programType: "FWC" | "VOUCHER";
}

export default function BaseStockIn({ programType }: BaseStockInProps) {
  const router = useRouter();
  const { t } = useLanguage();

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        {/* Header removed, controlled by parent page */}

        <StockFilterReusable
          programType={programType}
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
            setCategory([]);
            setType([]);
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
          addLabel={t("tambah")}
        />
      </div>

      <div className="rounded-lg border bg-white overflow-hidden">
        <div className="flex items-center justify-end px-4 py-3 border-b bg-gray-50">
          <span className="inline-flex items-center gap-2 rounded-lg border border-[#8D1231]/20 bg-[#8D1231]/5 px-3 py-1 text-sm font-medium text-[#8D1231]">
            {t("total_data")}: <b>{pagination.total || 0}</b>
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-sm">
            <thead className="bg-[#8D1231] text-white">
              <tr>
                <th className="p-3">{t("no")}</th>
                <th className="p-3">{t("date")}</th>
                <th className="p-3">{t("category")}</th>
                <th className="p-3">{t("type")}</th>
                <th className="p-3">{t("quantity")}</th>
                <th className="p-3">{t("serial_number")}</th>
                <th className="p-3">View</th>
                <th className="p-3">{t("action")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center">
                    {t("loading")}
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center">
                    {t("no_data")}
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
                    <td className="px-3 py-2 text-center whitespace-nowrap">
                      {row.sentSerialNumbers && row.sentSerialNumbers.length > 0
                        ? row.sentSerialNumbers.length === 1
                          ? row.sentSerialNumbers[0]
                          : `${row.sentSerialNumbers[0]} - ${
                              row.sentSerialNumbers[
                                row.sentSerialNumbers.length - 1
                              ]
                            }`
                        : "-"}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={() =>
                          router.push(
                            `/dashboard/superadmin/stock/in/${row.id}/view?type=${programType}`,
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
                        {t("hapus")}
                      </button>
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
