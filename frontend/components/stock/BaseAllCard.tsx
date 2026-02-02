"use client";

import { useRouter } from "next/navigation";
import StatusBadge from "@/components/ui/status-badge";
import { StockFilterReusable } from "./StockFilterReusable";
import { StockPagination } from "./StockPagination";
import SwitchTab, { SwitchTabItem } from "@/components/SwitchTab";
import { useAllCards } from "@/hooks/useAllCards";
import { useContext } from "react";
import { UserContext } from "@/app/dashboard/superadmin/dashboard/dashboard-layout";

interface BaseAllCardProps {
  programType: "FWC" | "VOUCHER";
}

export default function BaseAllCard({ programType }: BaseAllCardProps) {
  const router = useRouter();
  const userContext = useContext(UserContext);
  const role = userContext?.role || "superadmin";

  const tabs: SwitchTabItem[] = [
    { label: "FWC", path: `/dashboard/${role}/stock/fwc/all` },
    { label: "Voucher", path: `/dashboard/${role}/stock/voucher/all` },
  ];

  const {
    data,
    loading,
    pagination,
    setPagination,
    statusOptions,
    filters,
    handleExportPDF,
  } = useAllCards({ programType });

  const {
    status,
    setStatus,
    category,
    setCategory,
    type,
    setType,
    station,
    setStation,
    search,
    setSearch,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
  } = filters;

  // Removed early return to show filters even if data is empty

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-semibold whitespace-nowrap">
            All Card ({programType})
          </h2>
          <SwitchTab items={tabs} />
        </div>

        <StockFilterReusable
          programType={programType}
          values={{
            status,
            category,
            type,
            station,
            search,
            startDate,
            endDate,
          }}
          onFilterChange={(newValues) => {
            if (newValues.status !== undefined)
              setStatus(newValues.status as any);
            if (newValues.category !== undefined) {
              setCategory(newValues.category);
              setType("");
            }
            if (newValues.type !== undefined) setType(newValues.type);
            if (newValues.station !== undefined) setStation(newValues.station);
            if (newValues.search !== undefined) setSearch(newValues.search);
            if (newValues.startDate !== undefined)
              setStartDate(newValues.startDate);
            if (newValues.endDate !== undefined) setEndDate(newValues.endDate);
            setPagination((p) => ({ ...p, page: 1 }));
          }}
          onReset={() => {
            setStatus("all");
            setCategory("");
            setType("");
            setStation("");
            setSearch("");
            setStartDate("");
            setEndDate("");
            setPagination((p) => ({ ...p, page: 1 }));
          }}
          onExportPDF={handleExportPDF}
          onAdd={() =>
            router.push(
              `/dashboard/${role}/stock/${programType.toLowerCase()}/all/transfer`,
            )
          }
          showFields={{
            status: true,
            category: true,
            type: true,
            station: true,
            search: true,
            dateRange: true,
            exportPDF: true,
            add: true,
          }}
          statusOptions={statusOptions}
          addLabel="Transfer Kartu"
        />
      </div>

      <div className="rounded-lg border bg-white overflow-hidden">
        <div className="flex items-center justify-end px-4 py-3 border-b bg-gray-50">
          <span className="inline-flex items-center gap-2 rounded-lg border border-[#8D1231]/20 bg-[#8D1231]/5 px-3 py-1 text-sm font-medium text-[#8D1231]">
            Total Data: <b>{pagination.total || 0}</b>
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[1400px] w-full text-sm">
            <thead className="bg-[#8D1231] text-white">
              <tr>
                <th className="px-4 py-3">No</th>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3">Serial</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Dari Stasiun</th>
                <th className="px-4 py-3">Ke Stasiun</th>
                <th className="px-4 py-3">Expired Date</th>
                <th className="px-4 py-3">Status</th>
                {programType === "VOUCHER" && (
                  <th className="px-4 py-3">Diskon</th>
                )}
                <th className="px-4 py-3">Note</th>
                <th className="px-4 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={11}
                    className="px-4 py-10 text-center text-gray-500"
                  >
                    Loading...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td
                    colSpan={11}
                    className="px-4 py-10 text-center text-gray-500"
                  >
                    Tidak ada data
                  </td>
                </tr>
              ) : (
                data.map((row, i) => (
                  <tr
                    key={row.id}
                    className="border-b odd:bg-white even:bg-gray-50"
                  >
                    <td className="px-4 py-3 text-center">
                      {(pagination.page - 1) * pagination.limit + i + 1}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      {new Date(row.date)
                        .toLocaleDateString("id-ID")
                        .replace(/\//g, "-")}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      {row.serialNumber}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.cardCategoryName}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.cardTypeName}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.previousStationName}
                    </td>
                    <td className="px-4 py-3 text-center">{row.stationName}</td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      {row.expiredDate
                        ? new Date(row.expiredDate)
                            .toLocaleDateString("id-ID")
                            .replace(/\//g, "-")
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={row.status} />
                    </td>
                    {programType === "VOUCHER" && (
                      <td className="px-4 py-3 text-center">
                        {row.isDiscount ? "Ya" : "Tidak"}
                      </td>
                    )}
                    <td className="px-4 py-3 text-center">{row.note}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() =>
                            router.push(
                              `/dashboard/${role}/stock/${programType.toLowerCase()}/all/${row.id}/edit`,
                            )
                          }
                          className="h-8 px-3 rounded-md border text-xs font-medium border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white transition-colors duration-200 flex items-center justify-center"
                        >
                          Edit Status
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
    </div>
  );
}
