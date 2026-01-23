"use client";

import { useRef } from "react";
import { Calendar } from "lucide-react";
import toast from "react-hot-toast";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  Plus,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { getMembers, deleteMember } from "@/lib/services/membership.service";

/* ======================
   HELPER
====================== */
const formatNik = (nik?: string | null) => {
  if (!nik) return "-";
  return `FWC${nik}`;
};

/* ======================
   TYPES (FE CONTRACT)
====================== */
interface Membership {
  id: string;
  membership_date: string;
  name?: string | null;
  nip?: string | null;
  nik?: string | null;
  nationality?: string | null;
  gender?: "Laki - Laki" | "Perempuan" | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  operator_name?: string | null;
  updated_at?: string | null;
}

interface Pagination {
  page: number;
  limit: number;
  totalPages: number;
  total: number;
}

/* ======================
   DATE FORMATTER
====================== */
const formatDate = (iso?: string) => {
  if (!iso) return "-";

  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();

  return `${dd}-${mm}-${yyyy}`;
};

/* ======================
   TABLE UI SYSTEM
====================== */
const th =
  "px-4 py-2 text-xs font-medium text-gray-500 uppercase whitespace-nowrap";

const td = "px-4 py-2 text-sm text-gray-700 whitespace-nowrap";

/* ======================
   DELETE MODAL
====================== */

function ConfirmDeleteModal({
  open,
  member,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  member: {
    name?: string | null;
    nik?: string | null;
  } | null;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[420px] rounded-2xl bg-white p-6 shadow-xl">
        {/* ICON */}
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
          <AlertTriangle className="text-red-600" size={22} />
        </div>

        {/* TITLE */}
        <h2 className="text-center text-lg font-semibold text-gray-800">
          Delete Data
        </h2>

        <p className="mt-1 text-center text-sm text-gray-600">
          Are you sure you want to delete this member?
        </p>

        {/* INFO BOX */}
        <div className="mt-4 rounded-lg bg-gray-50 px-4 py-3 text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-gray-500">Name</span>
            <span className="max-w-[240px] truncate font-medium text-gray-800">
              {member?.name || "-"}
            </span>
          </div>

          <div className="mt-1 flex justify-between gap-3">
            <span className="text-gray-500">Identity Number</span>
            <span className="max-w-[240px] truncate font-mono text-gray-800">
              {member?.nik ? `FWC${member.nik}` : "-"}
            </span>
          </div>
        </div>

        {/* ACTION */}
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={onCancel}
            className="h-9 w-24 rounded-md bg-gray-100 text-sm text-gray-700 hover:bg-gray-200"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className="
    rounded-md bg-[#8D1231] px-5 py-2 text-sm text-white
    transition hover:bg-[#73122E] active:scale-95
  "
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ======================
   SUCCESS MODAL
====================== */
function SuccessModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-[380px] rounded-xl bg-white p-6 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="text-green-600" size={28} />
        </div>

        <h2 className="text-xl font-semibold">Success</h2>
        <p className="mt-2 text-sm text-gray-600">
          Data has been deleted successfully
        </p>

        <button
          onClick={onClose}
          className="mt-6 rounded-md bg-[#8B1538] px-6 py-2 text-sm text-white hover:bg-[#73122E]"
        >
          OK
        </button>
      </div>
    </div>
  );
}

/* ======================
   PAGE
====================== */
export default function MembershipPage() {
  const router = useRouter();
  const LIMIT = 10;

  /* 🔹 ADD THESE TWO LINES HERE 🔹 */
  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);

  const [data, setData] = useState<Membership[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: LIMIT,
    totalPages: 1,
    total: 0,
  });

  const [loading, setLoading] = useState(true);
  // TAMBAHAN
  const [cardCategory, setCardCategory] = useState<"all" | "NIPKAI">("all");
  const [search, setSearch] = useState("");
  const [gender, setGender] = useState<"all" | "L" | "P">("all");
  const [status, setStatus] = useState<"all" | "ACTIVE" | "INACTIVE">("all"); // ✅ TAMBAH
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [selectedMember, setSelectedMember] = useState<{
    id: string;
    name?: string | null;
    nik?: string | null;
  } | null>(null);

  /* ======================
     FETCH DATA
  ====================== */
  const fetchMembers = async (page: number) => {
    try {
      setLoading(true);

      const res = await getMembers({
        page,
        limit: LIMIT,
        search: debouncedSearch || undefined,
        gender: gender !== "all" ? gender : undefined,
        status: status !== "all" ? status : undefined, // ✅ TAMBAH
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        hasNippKai: cardCategory === "NIPKAI" ? true : undefined,
      });

      const mapped: Membership[] = res.data.items.map((item: any) => ({
        id: item.id,
        membership_date: formatDate(item.createdAt), // ✅ from createdAt
        name: item.name,
        nip: item.nippKai ?? null, // ✅ TAMBAH
        nik: item.identityNumber,
        nationality: item.nationality,
        gender: item.gender,
        email: item.email,
        phone: item.phone,
        address: item.alamat,
        operator_name: item.updatedByName ?? item.createdByName,
        updated_at: formatDate(item.updatedAt), // ✅ formatted
      }));

      setData(mapped);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* ======================
     EFFECTS
  ====================== */
  useEffect(() => {
    if (pagination.page !== 1) {
      setPagination((p) => ({ ...p, page: 1 }));
    } else {
      fetchMembers(1);
    }
  }, [debouncedSearch, gender, status, startDate, endDate, cardCategory]);

  useEffect(() => {
    if (!search) {
      setDebouncedSearch("");
      return;
    }

    const t = setTimeout(() => {
      setDebouncedSearch(search);
    }, 200);

    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    fetchMembers(pagination.page);
  }, [pagination.page]);

  const resetFilter = () => {
    setSearch("");
    setGender("all");
    setStatus("all"); // ✅ TAMBAH
    setCardCategory("all");
    setStartDate("");
    setEndDate("");
  };

  /* ======================
     DELETE
  ====================== */
  const confirmDelete = async () => {
    if (!selectedMember?.id) return;

    try {
      await deleteMember(selectedMember.id);

      setShowDeleteModal(false);
      setSelectedMember(null);
      setShowSuccessModal(true);

      fetchMembers(pagination.page);
    } catch (err: any) {
      toast.error(err?.message || "Tidak dapat menghapus member");
    }
  };

  /* ======================
     PAGINATION
  ====================== */
  const pageNumbers = Array.from(
    { length: pagination.totalPages },
    (_, i) => i + 1,
  ).slice(Math.max(0, pagination.page - 3), pagination.page + 2);

  /* ======================
     RENDER
  ====================== */
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Membership Management</h1>

        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-96 rounded-md border px-3 text-sm"
          />
        </div>
      </div>

      {loading && <div className="text-xs text-gray-400">Loading data...</div>}

      {/* FILTER */}
      <div className="flex items-center gap-2 rounded-lg border bg-white px-4 py-3">
        {/* ALL */}
        <button
          onClick={() => setCardCategory("all")}
          aria-pressed={cardCategory === "all"}
          className={`h-9 rounded-md border px-4 text-sm transition
      ${
        cardCategory === "all"
          ? "cursor-default border-[#8D1231] bg-[#8D1231] text-white"
          : "border-gray-300 bg-white text-gray-600 hover:bg-red-50 hover:text-[#8D1231]"
      }`}
        >
          All
        </button>

        {/* NIPKAI */}
        <button
          onClick={() => setCardCategory("NIPKAI")}
          aria-pressed={cardCategory === "NIPKAI"}
          className={`h-9 rounded-md border px-4 text-sm transition
      ${
        cardCategory === "NIPKAI"
          ? "cursor-default border-[#8D1231] bg-[#8D1231] text-white"
          : "border-gray-300 bg-white text-gray-600 hover:bg-red-50 hover:text-[#8D1231]"
      }`}
        >
          NIPKAI
        </button>

        {/* STATUS — TARUH DI SINI */}
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as any)}
          className="
    h-9 rounded-md border px-3 text-sm
    border-[#8D1231] bg-[#8D1231] text-white
    focus:outline-none
  "
        >
          <option value="all">Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Non Active</option>
        </select>

        {/* GENDER */}
        <select
          value={gender}
          onChange={(e) => setGender(e.target.value as any)}
          className="
    h-9 rounded-md border px-3 text-sm
    border-[#8D1231] bg-[#8D1231] text-white
    focus:outline-none
  "
        >
          <option value="all">Gender</option>
          <option value="L">Laki - Laki</option>
          <option value="P">Perempuan</option>
        </select>

        {/* START */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Start</span>

          <div className="relative">
            <input
              ref={startDateRef}
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={`h-9 w-[160px] rounded-md border px-3 pr-9 text-sm
          appearance-none
          [&::-webkit-calendar-picker-indicator]:hidden
          ${
            startDate
              ? "border-[#8D1231] bg-red-50 text-[#8D1231]"
              : "border-gray-300"
          }`}
            />

            <Calendar
              size={16}
              className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-[#8D1231]"
              onClick={() => startDateRef.current?.showPicker()}
            />
          </div>
        </div>

        {/* END */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">End</span>

          <div className="relative">
            <input
              ref={endDateRef}
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={`h-9 w-[160px] rounded-md border px-3 pr-9 text-sm
          appearance-none
          [&::-webkit-calendar-picker-indicator]:hidden
          ${
            endDate
              ? "border-[#8D1231] bg-red-50 text-[#8D1231]"
              : "border-gray-300"
          }`}
            />

            <Calendar
              size={16}
              className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-[#8D1231]"
              onClick={() => endDateRef.current?.showPicker()}
            />
          </div>
        </div>

        {/* RESET */}
        <button
          onClick={resetFilter}
          className={`flex h-9 w-9 items-center justify-center rounded-md border transition
      ${
        gender !== "all" || cardCategory !== "all" || startDate || endDate
          ? "border-[#8D1231] bg-[#8D1231] text-white hover:bg-[#73122E]"
          : "border-gray-300 text-gray-500"
      }`}
        >
          <RotateCcw size={16} />
        </button>
      </div>

      {/* TABLE */}

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="min-w-[1900px] w-full">
          <thead className="bg-gray-50 text-xs text-gray-600 sticky top-0 z-10">
            <tr>
              <th className="px-5 py-3 text-center whitespace-nowrap">
                Membership Date
              </th>
              <th className="px-5 py-3 text-left whitespace-nowrap min-w-[220px]">
                Customer Name
              </th>

              {/* ✅ NIP – HANYA JIKA NIPKAI */}
              {cardCategory === "NIPKAI" && (
                <th className="px-5 py-3 text-center whitespace-nowrap min-w-[200px]">
                  NIP
                </th>
              )}

              <th className="px-5 py-3 text-center whitespace-nowrap min-w-[260px]">
                Identity Number
              </th>

              <th className="px-4 py-3 text-left whitespace-nowrap min-w-[140px]">
                Nationality
              </th>
              <th className="px-4 py-3 text-center whitespace-nowrap">
                Gender
              </th>
              <th className="px-4 py-3 text-left whitespace-nowrap">Email</th>
              <th className="px-4 py-3 text-center whitespace-nowrap">Phone</th>
              <th className="px-4 py-3 text-left whitespace-nowrap min-w-[220px]">
                Address
              </th>
              <th className="px-4 py-3 text-center whitespace-nowrap">
                Last Updated
              </th>
              <th className="px-4 py-3 text-center">View</th>
              <th className="px-4 py-3 text-center">Aksi</th>
            </tr>
          </thead>

          <tbody>
            {data.map((item) => (
              <tr
                key={item.id}
                className="border-t text-sm hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-2 text-center whitespace-nowrap">
                  {item.membership_date || "-"}
                </td>

                <td
                  className="px-5 py-2 text-left max-w-[260px] truncate"
                  title={item.name || ""}
                >
                  {item.name || "-"}
                </td>

                {/* ✅ NIP – HANYA JIKA NIPKAI */}
                {cardCategory === "NIPKAI" && (
                  <td className="px-5 py-2 text-center font-mono whitespace-nowrap min-w-[200px]">
                    {item.nip || "-"}
                  </td>
                )}

                <td
                  className="px-5 py-2 text-center font-mono min-w-[260px] max-w-[320px] truncate cursor-pointer hover:underline"
                  title="Klik untuk copy"
                  onClick={() =>
                    item.nik &&
                    navigator.clipboard.writeText(formatNik(item.nik))
                  }
                >
                  {formatNik(item.nik)}
                </td>

                <td className="px-4 py-2 text-left whitespace-nowrap min-w-[140px]">
                  {item.nationality || "-"}
                </td>

                <td className="px-4 py-2 text-center whitespace-nowrap">
                  {item.gender || "-"}
                </td>

                <td
                  className="px-5 py-2 text-left max-w-[240px] truncate"
                  title={item.email || ""}
                >
                  {item.email || "-"}
                </td>

                <td className="px-4 py-2 text-center font-mono whitespace-nowrap">
                  {item.phone || "-"}
                </td>

                <td className="px-4 py-2 text-left max-w-[260px] truncate">
                  {item.address || "-"}
                </td>

                <td className="px-4 py-2 text-center whitespace-nowrap">
                  {item.updated_at || "-"}
                </td>

                <td className="px-4 py-2 text-center">
                  <Eye
                    size={16}
                    className="mx-auto cursor-pointer text-gray-500 hover:text-blue-600"
                    onClick={() =>
                      router.push(
                        `/dashboard/superadmin/membership/view/${item.id}`,
                      )
                    }
                  />
                </td>

                <td className="px-4 py-2 text-center">
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() =>
                        router.push(
                          `/dashboard/superadmin/membership/edit/${item.id}`,
                        )
                      }
                      className="rounded bg-gray-200 px-3 py-1 text-xs"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => {
                        setSelectedMember({
                          id: item.id,
                          name: item.name ?? "-",
                          nik: item.nik ?? null,
                        });
                        setShowDeleteModal(true);
                      }}
                      className="
    rounded px-3 py-1 text-xs text-white
    bg-[#8D1231] hover:bg-[#73122E] transition
  "
                    >
                      Hapus
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-600">
        <button
          disabled={pagination.page === 1}
          onClick={() =>
            setPagination((p) => ({
              ...p,
              page: p.page - 1,
            }))
          }
          className="px-2 disabled:opacity-40"
        >
          <ChevronLeft size={18} />
        </button>

        {pageNumbers.map((p) => (
          <button
            key={p}
            onClick={() =>
              setPagination((pg) => ({
                ...pg,
                page: p,
              }))
            }
            className={`px-3 py-1 ${
              p === pagination.page ? "font-semibold underline" : ""
            }`}
          >
            {p}
          </button>
        ))}

        <button
          disabled={pagination.page === pagination.totalPages}
          onClick={() =>
            setPagination((p) => ({
              ...p,
              page: p.page + 1,
            }))
          }
          className="px-2 disabled:opacity-40"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <ConfirmDeleteModal
        open={showDeleteModal}
        member={selectedMember}
        onCancel={() => {
          setShowDeleteModal(false);
          setSelectedMember(null);
        }}
        onConfirm={confirmDelete}
      />

      <SuccessModal
        open={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
      />
    </div>
  );
}
