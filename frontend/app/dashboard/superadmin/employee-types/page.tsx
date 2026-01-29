"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";

import {
  getEmployeeTypes,
  deleteEmployeeType,
  createEmployeeType,
  updateEmployeeType,
  EmployeeType,
  EmployeeTypeCreatePayload,
  EmployeeTypeUpdatePayload,
} from "@/lib/services/employee-type.service";

/* ======================
   PAGE
====================== */
export default function EmployeeTypePage() {
  const LIMIT = 10;

  const [data, setData] = useState<EmployeeType[]>([]);
  const [loading, setLoading] = useState(true);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: LIMIT,
    totalPages: 1,
    total: 0,
  });

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<EmployeeType | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  /* ======================
     FETCH DATA
  ====================== */
  const fetchData = async (page: number) => {
    try {
      setLoading(true);

      const res = await getEmployeeTypes({
        page,
        limit: LIMIT,
        search: debouncedSearch || undefined,
      });

      // Backend returns array directly, not paginated structure
      const allData = res.data || [];

      // Manual client-side pagination
      const startIndex = (page - 1) * LIMIT;
      const endIndex = startIndex + LIMIT;
      const paginatedData = allData.slice(startIndex, endIndex);

      setData(paginatedData);
      setPagination({
        page,
        limit: LIMIT,
        total: allData.length,
        totalPages: Math.ceil(allData.length / LIMIT),
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to load employee types");
    } finally {
      setLoading(false);
    }
  };

  /* ======================
     EFFECTS
  ====================== */
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    fetchData(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  // Fetch on page change (triggered by pagination button clicks)
  const handlePageChange = (newPage: number) => {
    setPagination((p) => ({ ...p, page: newPage }));
    fetchData(newPage);
  };

  /* ======================
     FORM HANDLERS
  ====================== */
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.code.trim()) {
      errors.code = "Code is required";
    } else if (formData.code.length < 2 || formData.code.length > 50) {
      errors.code = "Code must be between 2-50 characters";
    }

    if (!formData.name.trim()) {
      errors.name = "Name is required";
    } else if (formData.name.length < 2 || formData.name.length > 100) {
      errors.name = "Name must be between 2-100 characters";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setFormData({ code: "", name: "", description: "" });
    setFormErrors({});
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);

      const payload: EmployeeTypeCreatePayload = {
        code: formData.code.trim(),
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
      };

      await createEmployeeType(payload);
      toast.success("Employee type created successfully");

      setShowCreateModal(false);
      resetForm();
      fetchData(pagination.page);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.error?.message || "Failed to create employee type",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedItem || !validateForm()) return;

    try {
      setSubmitting(true);

      const payload: EmployeeTypeUpdatePayload = {
        code: formData.code.trim(),
        name: formData.name.trim(),
        description: formData.description.trim() || null,
      };

      await updateEmployeeType(selectedItem.id, payload);
      toast.success("Employee type updated successfully");

      setShowEditModal(false);
      setSelectedItem(null);
      resetForm();
      fetchData(pagination.page);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.error?.message || "Failed to update employee type",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;

    try {
      await deleteEmployeeType(selectedItem.id);
      toast.success("Employee type deleted successfully");

      setShowDeleteModal(false);
      setSelectedItem(null);
      fetchData(pagination.page);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.error?.message || "Failed to delete employee type",
      );
    }
  };

  /* ======================
     RENDER
  ====================== */
  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Employee Type Management</h1>

        <div className="flex items-center gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employee type..."
            className="h-10 w-full md:w-96 rounded-lg border border-gray-300 px-4 text-sm focus:border-[#8D1231] focus:ring-1 focus:ring-[#8D1231]"
          />

          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#8D1231] px-5 py-2 text-sm text-white hover:bg-[#73122E] md:w-auto"
          >
            <Plus size={16} />
            Add New
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="w-full table-fixed text-sm">
          <thead className="border-b bg-gray-50 text-[11px] font-semibold uppercase text-gray-600">
            <tr>
              <th className="w-[150px] px-4 py-3 text-left">Code</th>
              <th className="w-[200px] px-4 py-3 text-left">Name</th>
              <th className="w-[300px] px-4 py-3 text-left">Description</th>
              <th className="w-[120px] px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : !data || data.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                  No data found
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr
                  key={item.id}
                  className="border-t transition hover:bg-gray-50"
                >
                  <td className="px-4 py-2 truncate text-gray-900">
                    {item.code}
                  </td>
                  <td className="px-4 py-2 truncate text-gray-900">
                    {item.name}
                  </td>
                  <td className="px-4 py-2 truncate text-gray-700">
                    {item.description || "-"}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-center gap-2">
                      {/* EDIT */}
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setFormData({
                            code: item.code,
                            name: item.name,
                            description: item.description || "",
                          });
                          setShowEditModal(true);
                        }}
                        className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-700 hover:bg-gray-200 flex items-center gap-1"
                      >
                        <Pencil size={12} />
                        Edit
                      </button>

                      {/* DELETE */}
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setShowDeleteModal(true);
                        }}
                        className="rounded-md bg-red-50 px-2 py-1 text-xs text-red-600 hover:bg-red-100 flex items-center gap-1"
                      >
                        <Trash2 size={12} />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {pagination && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} entries
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
              disabled={pagination.page === 1}
              className="rounded-md bg-gray-100 px-3 py-1 text-sm disabled:opacity-50"
            >
              Previous
            </button>

            <div className="flex items-center gap-1">
              {Array.from(
                { length: pagination.totalPages },
                (_, i) => i + 1,
              ).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`rounded-md px-3 py-1 text-sm ${
                    pagination.page === page
                      ? "bg-[#8D1231] text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() =>
                handlePageChange(
                  Math.min(pagination.totalPages, pagination.page + 1),
                )
              }
              disabled={pagination.page === pagination.totalPages}
              className="rounded-md bg-gray-100 px-3 py-1 text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold">Create Employee Type</h2>

            <div className="space-y-4">
              {/* CODE */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  placeholder="e.g., UMUM"
                  className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                    formErrors.code
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:ring-[#8D1231]"
                  }`}
                />
                {formErrors.code && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.code}</p>
                )}
              </div>

              {/* NAME */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Umum"
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

              {/* DESCRIPTION */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Optional description..."
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8D1231]"
                />
              </div>
            </div>

            {/* ACTIONS */}
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                disabled={submitting}
                className="rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={submitting}
                className="rounded-md bg-[#8D1231] px-4 py-2 text-sm text-white hover:bg-[#73122E] disabled:opacity-50"
              >
                {submitting ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold">Edit Employee Type</h2>

            <div className="space-y-4">
              {/* CODE */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                    formErrors.code
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:ring-[#8D1231]"
                  }`}
                />
                {formErrors.code && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.code}</p>
                )}
              </div>

              {/* NAME */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
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

              {/* DESCRIPTION */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8D1231]"
                />
              </div>
            </div>

            {/* ACTIONS */}
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
                Cancel
              </button>
              <button
                onClick={handleEdit}
                disabled={submitting}
                className="rounded-md bg-[#8D1231] px-4 py-2 text-sm text-white hover:bg-[#73122E] disabled:opacity-50"
              >
                {submitting ? "Updating..." : "Update"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold">Confirm Delete</h2>

            <p className="mb-2 text-sm text-gray-700">
              Are you sure you want to delete this employee type?
            </p>

            <div className="mb-4 rounded-lg bg-gray-50 p-3">
              <div className="text-sm">
                <span className="font-medium">Code:</span> {selectedItem.code}
              </div>
              <div className="text-sm">
                <span className="font-medium">Name:</span> {selectedItem.name}
              </div>
            </div>

            <p className="mb-6 text-xs text-red-600">
              This action cannot be undone.
            </p>

            {/* ACTIONS */}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedItem(null);
                }}
                className="rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
