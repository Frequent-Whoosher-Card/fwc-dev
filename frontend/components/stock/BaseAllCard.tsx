"use client";

import { useRouter } from "next/navigation";
import StatusBadge from "@/components/ui/status-badge";
import { StockFilterReusable } from "./StockFilterReusable";
import { StockPagination } from "./StockPagination";
import SwitchTab, { SwitchTabItem } from "@/components/SwitchTab";
import { useAllCards } from "@/hooks/useAllCards";

interface BaseAllCardProps {
  programType: "FWC" | "VOUCHER";
}

export default function BaseAllCard({ programType }: BaseAllCardProps) {
  const router = useRouter();

  const tabs: SwitchTabItem[] = [
    { label: "FWC", path: "/dashboard/superadmin/stock/fwc/all" },
    { label: "Voucher", path: "/dashboard/superadmin/stock/voucher/all" },
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

  if (programType === "VOUCHER" && data.length === 0 && !loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold whitespace-nowrap">
              All Card ({programType})
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
              `/dashboard/superadmin/stock/${programType.toLowerCase()}/all/add`,
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
          addLabel="Tambah"
        />
      </div>

      <div className="rounded-lg border bg-white overflow-x-auto">
        <table className="min-w-[1400px] w-full text-sm">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-4 py-3">No</th>
              <th className="px-4 py-3">Tanggal</th>
              <th className="px-4 py-3">Serial</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Station</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Note</th>
              <th className="px-4 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-4 py-10 text-center text-gray-500"
                >
                  Loading...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
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
                  <td className="px-4 py-3 text-center">{row.cardTypeName}</td>
                  <td className="px-4 py-3 text-center">{row.stationName}</td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="px-4 py-3 text-center">{row.note}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() =>
                          router.push(
                            `/dashboard/superadmin/stock/${programType.toLowerCase()}/all/${row.id}/edit`,
                          )
                        }
                        className="h-8 px-3 rounded-md border text-xs font-medium border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white transition-colors duration-200 flex items-center justify-center"
                      >
                        Edit
                      </button>
                    </div>
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
    </div>
  );
}
