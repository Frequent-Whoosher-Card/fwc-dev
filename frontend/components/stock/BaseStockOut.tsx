"use client";

import { useRouter } from "next/navigation";
import { Eye } from "lucide-react";
import { DeleteConfirmModal } from "./DeleteConfirmModal";
import { StockFilterReusable } from "./StockFilterReusable";
import { StockPagination } from "./StockPagination";
import SwitchTab, { SwitchTabItem } from "@/components/SwitchTab";
import StatusBadge from "@/components/ui/status-badge";
import { useStockOut } from "@/hooks/useStockOut";
import { useLanguage } from "@/hooks/useLanguage";

interface BaseStockOutProps {
  programType: "FWC" | "VOUCHER";
}

export default function BaseStockOut({ programType }: BaseStockOutProps) {
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
        {/* Header removed, controlled by parent page */}

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
            setCategory([]);
            setType([]);
            setStation([]);
            setFromDate("");
            setToDate("");
            setPagination((p) => ({ ...p, page: 1 }));
          }}
          onExportPDF={handleExportPDF}
          onAdd={() =>
            router.push(
              `/dashboard/superadmin/stock/out/add?type=${programType}`,
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
          addLabel={t("tambah")}
        />
      </div>

      <div className="rounded-lg border bg-white overflow-hidden">
        <div className="flex items-center justify-end px-4 py-3 border-b bg-gray-50">
          <span className="inline-flex items-center gap-2 rounded-lg border border-[#8D1231]/20 bg-[#8D1231]/5 px-3 py-1 text-sm font-medium text-[#8D1231]">
            {t("total_data")}: <b>{pagination.total || 0}</b>
            <span className="text-gray-400 mx-1">|</span>
            Total Qty: <b>{pagination.totalQuantity || 0}</b>
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] border-collapse text-sm">
            <thead className="bg-[#8D1231] text-white">
              <tr>
                <th className="px-3 py-2 text-center">{t("no")}</th>
                <th className="px-3 py-2 text-center">{t("date")}</th>
                <th className="px-3 py-2 text-center">{t("card_category")}</th>
                <th className="px-3 py-2 text-center">{t("card_type")}</th>
                <th className="px-3 py-2 text-center">{t("batch")}</th>
                <th className="px-3 py-2 text-center">{t("nota_dinas")}</th>
                <th className="px-3 py-2 text-center">{t("bast")}</th>
                <th className="px-3 py-2 text-center">Pemohon</th>
                <th className="px-3 py-2 text-center">Penerima</th>
                <th className="px-3 py-2 text-center">{t("stasiun")}</th>
                <th className="px-3 py-2 text-center">{t("quantity")}</th>
                <th className="px-3 py-2 text-center whitespace-nowrap">
                  {t("serial_number")}
                </th>
                <th className="px-3 py-2 text-center">{t("status")}</th>
                <th className="px-3 py-2 text-center">{t("note")}</th>
                <th className="px-4 py-3 text-center">View</th>
                <th className="px-3 py-2 text-center">{t("action")}</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={14}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    {t("loading")}
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td
                    colSpan={14}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    {t("no_stock_out_data")}
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
                      <div className="flex items-center justify-center gap-2">
                        <span>{row.notaDinas || "-"}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span>{row.bast || "-"}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center">
                      {(row as any).requesterName || "-"}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {(row as any).receiverName || "-"}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {row.stationName ? (
                        <span className="rounded px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700">
                          {row.stationName}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {row.quantity || 0}
                    </td>
                    <td className="px-3 py-2 text-center font-medium whitespace-nowrap">
                      {row.sentSerialNumbers?.length > 0
                        ? `${row.sentSerialNumbers[0]} - ${row.sentSerialNumbers[row.sentSerialNumbers.length - 1]}`
                        : "-"}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-3 py-2 text-center max-w-[200px] truncate">
                      {row.note || "-"}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button
                        onClick={() =>
                          router.push(
                            `/dashboard/superadmin/stock/out/${row.id}/view?type=${programType}`,
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
                                `/dashboard/superadmin/stock/out/${row.id}/edit?type=${programType}`,
                              );
                          }}
                          className={`rounded-md border px-3 py-1 text-xs transition-colors duration-200 ${row.status === "APPROVED" ? "border-gray-300 text-gray-400 bg-gray-100 cursor-not-allowed" : "border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white"}`}
                        >
                          {t("edit")}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedId(row.id);
                            setOpenDelete(true);
                          }}
                          className="rounded-md border border-[#8D1231] px-3 py-1 text-xs text-[#8D1231] hover:bg-[#8D1231] hover:text-white"
                        >
                          {t("hapus")}
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
