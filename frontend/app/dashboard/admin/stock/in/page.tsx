"use client";

import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { StockProvider } from "@/app/dashboard/superadmin/stock/context/StockContext";
import { StockSummary } from "@/components/stock/StockSummary";

type CardCategory = "Gold" | "Silver" | "KAI";
type CardType = "JaBan" | "JaKa" | "KaBan" | "";

interface StockIn {
  id: string;
  tanggal: string;
  category: CardCategory;
  type: CardType;
  stock: number;
}

export default function AdminStockInPage() {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [stockData, setStockData] = useState<StockIn[]>([]);

  const [form, setForm] = useState<Omit<StockIn, "id">>({
    tanggal: "",
    category: "Gold",
    type: "",
    stock: 0,
  });

  const handleSubmit = () => {
    if (!form.tanggal || form.stock <= 0) return;

    setStockData((prev) => [...prev, { ...form, id: Date.now().toString() }]);

    setForm({ tanggal: "", category: "Gold", type: "", stock: 0 });
    setShowForm(false);
    toast.success("Stock berhasil ditambahkan");
  };

  return (
    <StockProvider>
      <div className="space-y-6">
        <StockSummary />

        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Stock In</h2>
          <button
            onClick={() => setShowForm(true)}
            className="rounded bg-[#8D1231] px-4 py-2 text-sm text-white"
          >
            Tambah
          </button>
        </div>

        {showForm && (
          <div className="rounded border bg-white p-4 space-y-3">
            <input
              type="date"
              className="w-full rounded border p-2"
              value={form.tanggal}
              onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
            />
            <input
              type="number"
              className="w-full rounded border p-2"
              placeholder="Jumlah stock"
              value={form.stock}
              onChange={(e) =>
                setForm({ ...form, stock: Number(e.target.value) })
              }
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowForm(false)}>Batal</button>
              <button
                onClick={handleSubmit}
                className="rounded bg-[#8D1231] px-4 py-2 text-sm text-white"
              >
                Simpan
              </button>
            </div>
          </div>
        )}

        <table className="w-full text-sm border bg-white">
          <thead>
            <tr>
              <th className="p-3 text-left">Tanggal</th>
              <th className="p-3 text-left">Stock</th>
              <th className="p-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {stockData.map((row) => (
              <tr key={row.id} className="border-t">
                <td className="p-3">{row.tanggal}</td>
                <td className="p-3">{row.stock}</td>
                <td className="p-3 text-center">
                  <button
                    onClick={() =>
                      router.push(`/dashboard/admin/stock/in/${row.id}/edit`)
                    }
                    className="mr-2 underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() =>
                      setStockData((prev) =>
                        prev.filter((i) => i.id !== row.id),
                      )
                    }
                    className="text-red-500 underline"
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </StockProvider>
  );
}
