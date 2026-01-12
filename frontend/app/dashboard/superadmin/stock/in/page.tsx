"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import axios from "@/lib/axios";
import { DeleteConfirmModal } from "../components/DeleteConfirmModal";
import { Eye, FileDown } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface StockInItem {
  id: string;
  tanggal: string;
  rawTanggal: string;
  category: string;
  type: string;
  stock: number;
}

export default function StockInPage() {
  const router = useRouter();

  const [stockIn, setStockIn] = useState<StockInItem[]>([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // =========================
  // FETCH DATA (FILTER AKTIF & AMAN)
  // =========================
  useEffect(() => {
    const fetchStockIn = async () => {
      setLoading(true);
      try {
        const params: Record<string, string> = {};

        // =========================
        // FILTER TANGGAL (UTC SAFE)
        // =========================
        if (fromDate) {
          const start = new Date(fromDate);
          start.setHours(0, 0, 0, 0);
          params.startDate = start.toISOString();
        }

        if (toDate) {
          const end = new Date(toDate);
          end.setHours(23, 59, 59, 999);
          params.endDate = end.toISOString();
        }
        // UTC

        const res = await axios.get("/stock/in", { params });

        const data = res.data?.data?.items || [];

        setStockIn(
          data.map((item: any) => ({
            id: item.id,
            tanggal: new Date(item.movementAt).toLocaleDateString("id-ID"),
            rawTanggal: item.movementAt,
            category: item.cardCategory?.name || "-",
            type: item.cardType?.name || "-",
            stock: item.quantity,
          }))
        );
      } catch (err) {
        toast.error("Gagal mengambil data stock-in");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStockIn();
  }, [fromDate, toDate]);

  // =========================
  // EXPORT PDF
  // =========================
  const handleExportPDF = () => {
    if (stockIn.length === 0) {
      toast.error("Tidak ada data untuk diexport");
      return;
    }

    const doc = new jsPDF("p", "mm", "a4");

    // =========================
    // TITLE (TANPA UNICODE)
    // =========================
    const title = "Laporan Stock In (Vendor ke Office)";
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(title, pageWidth / 2, 18, { align: "center" });

    // GARIS PEMISAH
    doc.setLineWidth(0.3);
    doc.line(14, 22, pageWidth - 14, 22);

    // =========================
    // TABLE
    // =========================
    autoTable(doc, {
      startY: 26,
      head: [["Tanggal", "Category", "Type", "Stock Masuk"]],
      body: stockIn.map((item) => [
        item.tanggal,
        item.category,
        item.type || "-",
        item.stock.toLocaleString(),
      ]),
      styles: {
        font: "helvetica",
        fontSize: 10,
        cellPadding: 3,
        halign: "center",
      },
      headStyles: {
        fillColor: [141, 18, 49],
        textColor: 255,
        fontStyle: "bold",
      },
    });

    doc.save("laporan-stock-in.pdf");
  };

  // =========================
  // DELETE
  // =========================
  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/stock/in/${id}`);
      setStockIn((prev) => prev.filter((item) => item.id !== id));
      toast.success("Stock berhasil dihapus");
    } catch {
      toast.error("Gagal menghapus stock");
    } finally {
      setOpenDelete(false);
      setSelectedId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="text-lg font-semibold">Stock In (Vendor → Office)</h2>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Dari</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="rounded-md border px-3 py-1.5 text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Sampai</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="rounded-md border px-3 py-1.5 text-sm"
            />
          </div>

          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-gray-100"
          >
            <FileDown size={16} />
            PDF
          </button>

          <button
            onClick={() => router.push("/dashboard/superadmin/stock/in/add")}
            className="rounded-md bg-[#8D1231] px-4 py-2 text-sm font-medium text-white"
          >
            Tambah
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="rounded-lg border bg-white overflow-x-auto">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading...</div>
        ) : (
          <table className="w-full text-sm min-w-[800px]">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="p-3 text-center">No</th>
                <th className="p-3 text-center">Tanggal</th>
                <th className="p-3 text-center">Category</th>
                <th className="p-3 text-center">Type</th>
                <th className="p-3 text-center">Stock Masuk</th>
                <th className="p-3 text-center">View</th>
                <th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {stockIn.map((row, i) => (
                <tr key={row.id} className="border-b">
                  <td className="p-3 text-center">{i + 1}</td>
                  <td className="p-3 text-center">{row.tanggal}</td>
                  <td className="p-3 text-center">{row.category}</td>
                  <td className="p-3 text-center">{row.type}</td>
                  <td className="p-3 text-center font-medium">
                    {row.stock.toLocaleString()}
                  </td>
                  <td className="p-3 text-center">
                    <Eye
                      size={16}
                      className="mx-auto cursor-pointer text-gray-500 hover:text-blue-600"
                      onClick={() =>
                        router.push(
                          `/dashboard/superadmin/stock/in/view/${row.id}`
                        )
                      }
                    />
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => {
                        setSelectedId(row.id);
                        setOpenDelete(true);
                      }}
                      className="rounded-md border border-red-500 px-3 py-1 text-sm text-red-500 hover:bg-red-500 hover:text-white"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}

              {stockIn.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-gray-500">
                    Tidak ada data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        <DeleteConfirmModal
          open={openDelete}
          onClose={() => {
            setOpenDelete(false);
            setSelectedId(null);
          }}
          onConfirm={() => selectedId && handleDelete(selectedId)}
        />
      </div>
    </div>
  );
}
