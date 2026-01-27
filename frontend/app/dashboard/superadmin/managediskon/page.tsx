"use client";

import { useState } from "react";
import { PercentCircle, Save, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

interface DiscountRule {
  id: string;
  minQty: number;
  maxQty: number | null; // null for > X
  discountPercent: number;
}

export default function ManageDiskonPage() {
  const [rules, setRules] = useState<DiscountRule[]>([
    { id: "1", minQty: 0, maxQty: 49, discountPercent: 0 },
    { id: "2", minQty: 50, maxQty: 100, discountPercent: 10 },
    { id: "3", minQty: 101, maxQty: 500, discountPercent: 15 },
    { id: "4", minQty: 501, maxQty: null, discountPercent: 20 },
  ]);

  const [loading, setLoading] = useState(false);

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Pengaturan diskon berhasil disimpan");
    }, 1000);
  };

  const updateRule = (id: string, field: keyof DiscountRule, value: any) => {
    setRules((prev) =>
      prev.map((rule) => {
        if (rule.id === id) {
          return { ...rule, [field]: value };
        }
        return rule;
      }),
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Manage Diskon</h2>
          <p className="text-sm text-gray-500 text-pretty">
            Atur persentase diskon berdasarkan jumlah pembelian kartu / voucher.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-[#8D1231] px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#a6153a] disabled:opacity-50"
        >
          <Save size={18} />
          {loading ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      </div>

      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50 border-b">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Rentang Jumlah (Qty)
              </th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Diskon (%)
              </th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500 text-right">
                Preview Label
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rules.map((rule) => (
              <tr
                key={rule.id}
                className="group hover:bg-gray-50/50 transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={rule.minQty}
                        onChange={(e) =>
                          updateRule(
                            rule.id,
                            "minQty",
                            parseInt(e.target.value) || 0,
                          )
                        }
                        className="w-20 rounded-lg border bg-gray-50 px-3 py-1.5 text-sm focus:border-[#8D1231] focus:ring-1 focus:ring-[#8D1231] outline-none transition-all"
                      />
                      <span className="text-gray-400">sampai</span>
                      {rule.maxQty !== null ? (
                        <input
                          type="number"
                          value={rule.maxQty}
                          onChange={(e) =>
                            updateRule(
                              rule.id,
                              "maxQty",
                              parseInt(e.target.value) || 0,
                            )
                          }
                          className="w-20 rounded-lg border bg-gray-50 px-3 py-1.5 text-sm focus:border-[#8D1231] focus:ring-1 focus:ring-[#8D1231] outline-none transition-all"
                        />
                      ) : (
                        <span className="text-sm font-medium text-gray-600 px-2 italic">
                          Tak Terhingga
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <input
                        type="number"
                        value={rule.discountPercent}
                        onChange={(e) =>
                          updateRule(
                            rule.id,
                            "discountPercent",
                            parseInt(e.target.value) || 0,
                          )
                        }
                        className="w-24 rounded-lg border bg-gray-50 pl-3 pr-8 py-1.5 text-sm font-semibold text-gray-700 focus:border-[#8D1231] focus:ring-1 focus:ring-[#8D1231] outline-none transition-all"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                        %
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF1F2] px-3 py-1 text-xs font-bold text-[#8D1231]">
                    <PercentCircle size={12} />
                    {rule.maxQty !== null
                      ? `${rule.minQty} - ${rule.maxQty} Qty: ${rule.discountPercent}% OFF`
                      : `> ${rule.minQty - 1} Qty: ${rule.discountPercent}% OFF`}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
        <div className="flex gap-3">
          <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-blue-600 text-xs font-bold">i</span>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-blue-900">
              Informasi Pengaturan Diskon
            </p>
            <p className="text-xs text-blue-800 leading-relaxed">
              Pengaturan ini akan diterapkan secara otomatis pada saat checkout
              pembelian kartu atau voucher. Pastikan rentang jumlah (Qty) tidak
              saling tumpang tindih untuk menghindari kesalahan kalkulasi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
