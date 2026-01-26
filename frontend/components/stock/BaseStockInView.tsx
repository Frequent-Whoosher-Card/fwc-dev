"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useStockInView } from "@/hooks/useStockInView";

export default function BaseStockInView() {
  const params = useParams();
  const id =
    typeof params === "object" && params !== null ? (params as any).id : "";
  const router = useRouter();

  const { data, loading, updating, updateStatusBatch } = useStockInView(id);

  const [selectMode, setSelectMode] = useState(false);
  const [selectedSerials, setSelectedSerials] = useState<string[]>([]);

  const toggleSerial = (serial: string) => {
    setSelectedSerials((prev) =>
      prev.includes(serial)
        ? prev.filter((s) => s !== serial)
        : [...prev, serial],
    );
  };

  const handleDamage = async () => {
    const success = await updateStatusBatch(selectedSerials, "DAMAGED");
    if (success) {
      setSelectedSerials([]);
      setSelectMode(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500">
        Loading detail stock...
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
        <h2 className="text-lg font-semibold">Detail Stock In</h2>
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
        </div>
      </div>

      <div className="px-6">
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => {
              setSelectMode(!selectMode);
              setSelectedSerials([]);
            }}
            className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-100"
          >
            {selectMode ? "Batal Pilih" : "Pilih Serial Number"}
          </button>

          {selectMode && (
            <button
              onClick={handleDamage}
              disabled={updating}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
            >
              Damage
            </button>
          )}
        </div>

        <div className="rounded-xl border bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-center w-16">No</th>
                <th className="px-4 py-3 text-left">Serial Number</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>

            <tbody>
              {data.serialItems.length > 0 ? (
                data.serialItems.slice(0, 100).map((item, index) => {
                  const isDamaged = item.status === "DAMAGED";

                  return (
                    <tr
                      key={item.serialNumber}
                      className={`border-b ${isDamaged ? "bg-gray-50 text-gray-400" : ""}`}
                    >
                      <td className="px-4 py-2 text-center">
                        {selectMode && !isDamaged ? (
                          <input
                            type="checkbox"
                            checked={selectedSerials.includes(
                              item.serialNumber,
                            )}
                            onChange={() => toggleSerial(item.serialNumber)}
                          />
                        ) : (
                          index + 1
                        )}
                      </td>

                      <td
                        className={`px-4 py-2 font-mono ${isDamaged ? "line-through opacity-60" : ""}`}
                      >
                        {item.serialNumber}
                      </td>

                      <td className="px-4 py-2">
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-medium ${isDamaged ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-6 text-center text-gray-500"
                  >
                    Tidak ada serial number
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-sm text-gray-500">
          Total Stock Masuk:{" "}
          <span className="font-medium text-gray-700">
            {data.quantity.toLocaleString()}
          </span>
        </p>
      </div>
    </div>
  );
}
