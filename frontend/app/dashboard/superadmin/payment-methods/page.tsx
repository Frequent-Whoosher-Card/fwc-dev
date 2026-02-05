"use client";

import { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";

import {
  getPaymentMethods,
  deletePaymentMethod,
  createPaymentMethod,
  updatePaymentMethod,
  PaymentMethod,
  PaymentMethodCreatePayload,
  PaymentMethodUpdatePayload,
} from "@/lib/services/payment-method.service";

const LIMIT = 10;

export default function PaymentMethodPage() {
  const [allData, setAllData] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PaymentMethod | null>(null);

  const [formData, setFormData] = useState({ name: "", notes: "" });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);

  const filteredData = useMemo(() => {
    if (!debouncedSearch.trim()) return allData;
    const q = debouncedSearch.trim().toLowerCase();
    return allData.filter((item) => item.name.toLowerCase().includes(q));
  }, [allData, debouncedSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / LIMIT));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * LIMIT;
    return filteredData.slice(start, start + LIMIT);
  }, [filteredData, currentPage]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await getPaymentMethods();
      setAllData(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat metode pembayaran");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) {
      errors.name = "Nama wajib diisi";
    } else if (formData.name.trim().length > 100) {
      errors.name = "Nama maksimal 100 karakter";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setFormData({ name: "", notes: "" });
    setFormErrors({});
  };

  const handleCreate = async () => {
    if (!validateForm()) return;
    try {
      setSubmitting(true);
      const payload: PaymentMethodCreatePayload = {
        name: formData.name.trim(),
        notes: formData.notes.trim() || undefined,
      };
      await createPaymentMethod(payload);
      toast.success("Metode pembayaran berhasil dibuat");
      setShowCreateModal(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.error?.message || "Gagal membuat metode pembayaran",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedItem || !validateForm()) return;
    try {
      setSubmitting(true);
      const payload: PaymentMethodUpdatePayload = {
        name: formData.name.trim(),
        notes: formData.notes.trim() || null,
      };
      await updatePaymentMethod(selectedItem.id, payload);
      toast.success("Metode pembayaran berhasil diupdate");
      setShowEditModal(false);
      setSelectedItem(null);
      resetForm();
      fetchData();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.error?.message || "Gagal mengupdate metode pembayaran",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    try {
      await deletePaymentMethod(selectedItem.id);
      toast.success("Metode pembayaran berhasil dihapus");
      setShowDeleteModal(false);
      setSelectedItem(null);
      fetchData();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.error?.message || "Gagal menghapus metode pembayaran",
      );
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Metode Pembayaran</h1>
        <div className="flex items-center gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama..."
            className="h-10 w-full md:w-96 rounded-lg border border-gray-300 px-4 text-sm focus:border-[#8D1231] focus:ring-1 focus:ring-[#8D1231]"
          />
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="flex items-center justify-center gap-2 rounded-lg bg-[#8D1231] px-5 py-2 text-sm text-white hover:bg-[#73122E] md:w-auto"
          >
            <Plus size={16} />
            Tambah
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50 text-[11px] font-semibold uppercase text-gray-600">
            <tr>
              <th className="w-[200px] px-4 py-3 text-left">Nama</th>
              <th className="px-4 py-3 text-left">Notes</th>
              <th className="w-[140px] px-4 py-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : !paginatedData.length ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                  Tidak ada data
                </td>
              </tr>
            ) : (
              paginatedData.map((item) => (
                <tr
                  key={item.id}
                  className="border-t transition hover:bg-gray-50"
                >
                  <td className="px-4 py-2 text-gray-900">{item.name}</td>
                  <td className="max-w-[200px] truncate px-4 py-2 text-gray-600" title={item.notes || ""}>
                    {item.notes || "-"}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setFormData({
                            name: item.name,
                            notes: item.notes || "",
                          });
                          setShowEditModal(true);
                        }}
                        className="flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-700 hover:bg-gray-200"
                      >
                        <Pencil size={12} />
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setShowDeleteModal(true);
                        }}
                        className="flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-xs text-red-600 hover:bg-red-100"
                      >
                        <Trash2 size={12} />
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filteredData.length > LIMIT && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Menampilkan {(currentPage - 1) * LIMIT + 1} -{" "}
            {Math.min(currentPage * LIMIT, filteredData.length)} dari{" "}
            {filteredData.length}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded-md bg-gray-100 px-3 py-1 text-sm disabled:opacity-50"
            >
              Sebelumnya
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setCurrentPage(p)}
                className={`rounded-md px-3 py-1 text-sm ${
                  currentPage === p
                    ? "bg-[#8D1231] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded-md bg-gray-100 px-3 py-1 text-sm disabled:opacity-50"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold">Tambah Metode Pembayaran</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Nama <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Transfer Bank, Tunai"
                  className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                    formErrors.name
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:ring-[#8D1231]"
                  }`}
                />
                {formErrors.name && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.name}</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Catatan (opsional)"
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8D1231]"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                disabled={submitting}
                className="rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleCreate}
                disabled={submitting}
                className="rounded-md bg-[#8D1231] px-4 py-2 text-sm text-white hover:bg-[#73122E] disabled:opacity-50"
              >
                {submitting ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold">Ubah Metode Pembayaran</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Nama <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                    formErrors.name
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:ring-[#8D1231]"
                  }`}
                />
                {formErrors.name && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.name}</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Catatan (opsional)"
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8D1231]"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedItem(null);
                  resetForm();
                }}
                disabled={submitting}
                className="rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleEdit}
                disabled={submitting}
                className="rounded-md bg-[#8D1231] px-4 py-2 text-sm text-white hover:bg-[#73122E] disabled:opacity-50"
              >
                {submitting ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold">Konfirmasi Hapus</h2>
            <p className="mb-2 text-sm text-gray-700">
              Yakin ingin menghapus metode pembayaran ini?
            </p>
            <div className="mb-4 rounded-lg bg-gray-50 p-3">
              <span className="font-medium">Nama:</span> {selectedItem.name}
            </div>
            <p className="mb-6 text-xs text-red-600">Tindakan ini tidak dapat dibatalkan.</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedItem(null);
                }}
                className="rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                className="rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
