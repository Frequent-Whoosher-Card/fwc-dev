"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useStockOutView } from "@/hooks/useStockOutView";
import StatusBadge from "@/components/ui/status-badge";
import { ProgramType } from "@/lib/services/card.base.service";

interface BaseStockOutViewProps {
  programType?: ProgramType;
}

export default function BaseStockOutView({
  programType,
}: BaseStockOutViewProps) {
  const params = useParams();
  const id =
    typeof params === "object" && params !== null ? (params as any).id : "";
  const router = useRouter();

  const { data, loading } = useStockOutView(id, programType || "FWC");
  const [viewingFile, setViewingFile] = useState(false);

  const handleViewFile = async (url: string) => {
    try {
      setViewingFile(true);
      // Construct full URL if needed, usually backend returns relative or full.
      // If relative, axios base URL handles it if we strip the prefix or just use it as is if valid endpoint.
      // But typically we need the backend to serve it.
      // Assuming 'url' from backend is like '/uploads/...' or full http.

      // Use service to fetch blob with auth
      const blob = await import("@/lib/services/stock.service").then((m) =>
        m.default.downloadFile(url),
      );

      const objectUrl = window.URL.createObjectURL(blob);
      window.open(objectUrl, "_blank");
    } catch (error) {
      console.error("Failed to view file", error);
      import("react-hot-toast").then((m) =>
        m.default.error("Gagal membuka file"),
      );
    } finally {
      setViewingFile(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500">
        Loading detail stock out...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 px-6">
        <button
          onClick={() => router.back()}
          className="rounded-lg border p-2 hover:bg-gray-100"
        >
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-lg font-semibold">Detail Stock Out</h2>
      </div>

      <div className="px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 rounded-xl border bg-white p-6">
          <div>
            <p className="text-sm text-gray-500">Category</p>
            <p className="font-medium">{data.cardCategory.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Type</p>
            <p className="font-medium">{data.cardType.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Station</p>
            <p className="font-medium">{data.stationName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Tanggal</p>
            <p className="font-medium">
              {data.movementAt
                ? new Date(data.movementAt).toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })
                : "-"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Batch</p>
            <p className="font-medium">{data.batchId || "-"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Nota Dinas</p>
            <div className="space-y-1">
              <p className="font-medium">{data.notaDinas || "-"}</p>
              {data.notaDinasFile && (
                <button
                  onClick={() => handleViewFile(data.notaDinasFile!.url)}
                  className="inline-flex items-center gap-2 text-xs text-blue-600 hover:text-blue-700 hover:underline bg-blue-50 px-2 py-1.5 rounded-md border border-blue-100 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  Lihat File
                </button>
              )}
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500">BAST</p>
            <div className="space-y-1">
              <p className="font-medium">{data.bast || "-"}</p>
              {data.bastFile && (
                <button
                  onClick={() => handleViewFile(data.bastFile!.url)}
                  className="inline-flex items-center gap-2 text-xs text-blue-600 hover:text-blue-700 hover:underline bg-blue-50 px-2 py-1.5 rounded-md border border-blue-100 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  Lihat File
                </button>
              )}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-sm">Status:</span>
              <StatusBadge status={data.status} />
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500">Quantity</p>
            <p className="font-medium">{data.quantity.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Created By</p>
            <p className="font-medium">{data.createdByName}</p>
          </div>
          <div className="md:col-span-3">
            <p className="text-sm text-gray-500">Note</p>
            <p className="font-medium">{data.note || "-"}</p>
          </div>
        </div>
      </div>

      <div className="px-6">
        <div className="rounded-xl border bg-white overflow-hidden overflow-x-auto">
          <div className="border-b px-4 py-3 font-medium bg-gray-50 flex justify-between items-center min-w-[600px]">
            <span>Serial Number</span>
            <span className="text-xs font-normal text-gray-500">
              Total: {data.sentSerialNumbers.length}
            </span>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead className="bg-[#8D1231] text-white">
                <tr>
                  <th className="px-4 py-2 text-center w-16">No</th>
                  <th className="px-4 py-2 text-left w-1/2 whitespace-nowrap">
                    Serial
                  </th>
                  <th className="px-4 py-2 text-center w-32">Status</th>
                  <th className="px-4 py-2 w-auto"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.sentSerialNumbers.length > 0 ? (
                  data.sentSerialNumbers.map((serial, index) => {
                    let statusLabel = "IN_TRANSIT";
                    let statusColor = "bg-yellow-100 text-yellow-700";

                    if (data.status === "PENDING") {
                      statusLabel = "IN_TRANSIT";
                      statusColor =
                        "bg-purple-100 text-purple-800 border-purple-300";
                    } else if (data.status === "APPROVED") {
                      if (data.receivedSerialNumbers?.includes(serial)) {
                        statusLabel = "IN_STATION";
                        statusColor =
                          "bg-indigo-100 text-indigo-800 border-indigo-300";
                      } else if (data.lostSerialNumbers?.includes(serial)) {
                        statusLabel = "LOST";
                        statusColor = "bg-red-100 text-red-800 border-red-300";
                      } else if (data.damagedSerialNumbers?.includes(serial)) {
                        statusLabel = "DAMAGED";
                        statusColor =
                          "bg-orange-100 text-orange-800 border-orange-300";
                      }
                    }

                    return (
                      <tr key={serial} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-center text-gray-400">
                          {index + 1}
                        </td>
                        <td className="px-4 py-2 font-mono whitespace-nowrap">
                          {serial}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] uppercase font-bold whitespace-nowrap ${statusColor}`}
                          >
                            {statusLabel.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-4 py-2"></td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-6 text-center text-gray-500"
                    >
                      Tidak ada serial number
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
