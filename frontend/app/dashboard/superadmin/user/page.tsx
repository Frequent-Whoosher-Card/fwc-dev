"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";

import { getStations } from "../../../../lib/services/station.service";

import { getUsers, deleteUser } from "../../../../lib/services/user.service";

/* ======================
   TYPES
====================== */
interface User {
  id: string;
  fullname: string;
  nip: string;
  username: string;
  email: string;
  phone: string;

  role: string; // ADMIN | PETUGAS | SPV
  roleLabel: string; // Admin | Petugas | Supervisor

  station: string;
}

interface Pagination {
  page: number;
  limit: number;
  totalPages: number;
  total: number;
}

/* ======================
   PAGE
====================== */
export default function UserManagementPage() {
  const router = useRouter();
  const LIMIT = 10;

  const [data, setData] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [rawData, setRawData] = useState<User[]>([]);

  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: LIMIT,
    totalPages: 1,
    total: 0,
  });

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [role, setRole] = useState("all");
  const [station, setStation] = useState("all");

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDelete, setShowDelete] = useState(false);

  /* ======================
     FETCH USERS
  ====================== */
  const fetchUsers = async (page: number) => {
    try {
      setLoading(true);

      const res = await getUsers({
        page,
        limit: LIMIT,
        search: debouncedSearch || undefined,
      });

      const mapped = res.data.items.map((item: any) => ({
        id: item.id,
        fullname: item.fullName,
        nip: item.nip,
        username: item.username,
        email: item.email ?? "-",
        phone: item.phone ?? "-",

        role: item.roleCode, // ⬅️ UNTUK FILTER
        roleLabel: item.roleName, // ⬅️ UNTUK TAMPILAN

        station: item.stationName ?? "-",
      }));

      setRawData(mapped); // ⬅️ data asli
      setData(mapped); // ⬅️ data tampil

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
    const t = setTimeout(() => {
      setDebouncedSearch(search);
    }, 200);

    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (pagination.page !== 1) {
      setPagination((p) => ({ ...p, page: 1 }));
    } else {
      fetchUsers(1);
    }
  }, [debouncedSearch]); // ⬅️ HANYA SEARCH

  useEffect(() => {
    fetchUsers(pagination.page);
  }, [pagination.page]);

  useEffect(() => {
    let filtered = [...rawData];

    if (station !== "all") {
      filtered = filtered.filter(
        (u) => u.station?.toLowerCase() === station.toLowerCase()
      );
    }

    if (role !== "all") {
      filtered = filtered.filter((u) => u.role === role);
    }

    setData(filtered);
  }, [station, role, rawData]);

  /* ======================
     DELETE
  ====================== */
  const confirmDelete = async () => {
    if (!selectedUser) return;

    try {
      await deleteUser(selectedUser.id);
      setShowDelete(false);
      setSelectedUser(null);
      fetchUsers(pagination.page);
      toast.success("User deleted");
    } catch (err: any) {
      toast.error(err?.message || "Failed delete user");
    }
  };

  /* ======================
     PAGINATION
  ====================== */
  const pageNumbers = Array.from(
    { length: pagination.totalPages },
    (_, i) => i + 1
  ).slice(Math.max(0, pagination.page - 3), pagination.page + 2);

  /* ======================
     RENDER
  ====================== */
  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">User Management</h1>

        <div className="flex items-center gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="search operator"
            className="
              h-10 w-96 rounded-lg
              border border-gray-300
              px-4 text-sm
              focus:border-[#8D1231]
              focus:ring-1 focus:ring-[#8D1231]
            "
          />

          <button
            onClick={() => router.push("/dashboard/superadmin/user/create")}
            className="
              flex items-center gap-2 rounded-lg
              bg-[#8D1231] px-5 py-2 text-sm text-white
              hover:bg-[#73122E] transition
            "
          >
            <Plus size={16} />
            add new User
          </button>
        </div>
      </div>

      {/* FILTER */}
      <div
        className="
          flex items-center gap-4
          rounded-xl border border-gray-200
          bg-white px-6 py-4
          shadow-sm
        "
      >
        <span className="text-sm font-semibold text-[#8D1231]">Filters:</span>

        <select
          value={station}
          onChange={(e) => setStation(e.target.value)}
          className={`
            h-10 min-w-[140px]
            rounded-lg border px-4 text-sm
            focus:border-[#8D1231] focus:ring-1 focus:ring-[#8D1231]
            ${
              station !== "all"
                ? "border-[#8D1231] bg-red-50 text-[#8D1231]"
                : "border-gray-300"
            }
          `}
        >
          <option value="all">Stasiun</option>
          <option value="Halim">Halim</option>
          <option value="Karawang">Karawang</option>
          <option value="Padalarang">Padalarang</option>
          <option value="Tegalluar">Tegalluar</option>
        </select>

        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className={`
            h-10 min-w-[140px]
            rounded-lg border px-4 text-sm
            focus:border-[#8D1231] focus:ring-1 focus:ring-[#8D1231]
            ${
              role !== "all"
                ? "border-[#8D1231] bg-red-50 text-[#8D1231]"
                : "border-gray-300"
            }
          `}
        >
          <option value="all">Role</option>
          <option value="SUPER_ADMIN">Super Admin</option>
          <option value="ADMIN">Admin</option>
          <option value="SPV">SPV</option>
          <option value="PETUGAS">Petugas</option>
        </select>

        <button
          onClick={() => {
            setSearch("");
            setRole("all");
            setStation("all");
          }}
          className="
            flex h-10 w-10 items-center justify-center
            rounded-lg border border-gray-300
            text-gray-500
            hover:border-[#8D1231]
            hover:bg-red-50 hover:text-[#8D1231]
            transition
          "
        >
          <RotateCcw size={16} />
        </button>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-[1200px] w-full">
          <thead className="bg-gray-50 text-xs font-semibold text-gray-600 border-b">
            <tr>
              <th className="px-5 py-4 text-left">Name</th>
              <th className="px-5 py-4 text-left">NIP</th>
              <th className="px-5 py-4 text-left">Username</th>
              <th className="px-5 py-4 text-left">Email</th>
              <th className="px-5 py-4 text-left">Phone Number</th>
              <th className="px-5 py-4 text-left">Role</th>
              <th className="px-5 py-4 text-left">Stasiun</th>
              <th className="px-5 py-4 text-center">Aksi</th>
            </tr>
          </thead>

          <tbody>
            {!loading &&
              data.map((u) => (
                <tr
                  key={u.id}
                  className="border-t text-sm hover:bg-gray-50 transition-colors"
                >
                  <td className="px-5 py-3">{u.fullname}</td>
                  <td className="px-5 py-3">{u.nip}</td>
                  <td className="px-5 py-3">{u.username}</td>
                  <td className="px-5 py-3">{u.email}</td>
                  <td className="px-5 py-3">{u.phone}</td>
                  <td className="px-5 py-3">{u.role}</td>
                  <td className="px-5 py-3">{u.station}</td>
                  <td className="px-5 py-3">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() =>
                          router.push(`/dashboard/superadmin/user/edit/${u.id}`)
                        }
                        className="rounded-lg bg-gray-200 px-3 py-1 text-xs"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => {
                          setSelectedUser(u);
                          setShowDelete(true);
                        }}
                        className="
                          rounded-lg bg-[#8D1231]
                          px-3 py-1 text-xs text-white
                          hover:bg-[#73122E]
                        "
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>

        {loading && (
          <div className="p-4 text-sm text-gray-400">Loading data...</div>
        )}
      </div>

      {/* PAGINATION */}
      <div className="flex items-center justify-center gap-2 text-sm">
        <button
          disabled={pagination.page === 1}
          onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
          className="px-2 disabled:opacity-40"
        >
          <ChevronLeft size={18} />
        </button>

        {pageNumbers.map((p) => (
          <button
            key={p}
            onClick={() => setPagination((pg) => ({ ...pg, page: p }))}
            className={`px-3 py-1 ${
              p === pagination.page ? "font-semibold underline" : ""
            }`}
          >
            {p}
          </button>
        ))}

        <button
          disabled={pagination.page === pagination.totalPages}
          onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
          className="px-2 disabled:opacity-40"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* DELETE CONFIRM */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[400px] rounded-2xl bg-white p-6 text-center">
            <h2 className="text-lg font-semibold">Delete User</h2>
            <p className="mt-2 text-sm text-gray-600">
              Are you sure want to delete <b>{selectedUser?.fullname}</b>?
            </p>

            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={() => setShowDelete(false)}
                className="h-9 w-24 rounded-md bg-gray-100 text-sm"
              >
                Cancel
              </button>

              <button
                onClick={confirmDelete}
                className="h-9 w-24 rounded-md bg-[#8D1231] text-sm text-white hover:bg-[#73122E]"
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
