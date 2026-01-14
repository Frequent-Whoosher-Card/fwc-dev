"use client";

import { getStations, StationItem } from "@/lib/services/station.service";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import { getRoles, RoleItem } from "@/lib/services/user.service";

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
  role: string;
  roleLabel: string;
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

  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: LIMIT,
    totalPages: 1,
    total: 0,
  });

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // ⬇️ value = UUID (sesuai API)
  const [role, setRole] = useState("all");
  const [station, setStation] = useState("all");

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDelete, setShowDelete] = useState(false);

  const [stations, setStations] = useState<StationItem[]>([]);
  const [loadingStation, setLoadingStation] = useState(false);

  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [loadingRole, setLoadingRole] = useState(false);

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

        // ✅ SESUAI SWAGGER
        roleId: role !== "all" ? role : undefined,
        stationId: station !== "all" ? station : undefined,
      });

      const mapped: User[] = res.data.items.map((item: any) => ({
        id: item.id,
        fullname: item.fullName,
        nip: item.nip ?? "-",
        username: item.username,
        email: item.email ?? "-",
        phone: item.phone ?? "-",

        // ✅ AMBIL DARI SERVICE, BUKAN RAW API
        role: item.roleCode ?? "-",
        roleLabel: item.roleName ?? "-",

        station: item.stationName ?? "-",
      }));
      console.log("USERS FROM SERVICE:", res.data.items);

      setData(mapped);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error(err);
      toast.error("Failed load users");
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
    setPagination((p) => ({ ...p, page: 1 }));
    fetchUsers(1);
  }, [debouncedSearch, role, station]);

  useEffect(() => {
    fetchUsers(pagination.page);
  }, [pagination.page]);

  useEffect(() => {
    setLoadingStation(true);

    getStations()
      .then((res) => {
        setStations(res.data.items); // ✅ INI FIX UTAMA
      })
      .catch(() => {
        toast.error("Failed load stations");
      })
      .finally(() => {
        setLoadingStation(false);
      });
  }, []);

  useEffect(() => {
  setLoadingRole(true);

  getRoles()
    .then((res) => {
      // AMAN: fallback ke array kosong
      const roleItems = Array.isArray(res.data)
        ? res.data
        : res.data?.items ?? [];

      setRoles(roleItems);
    })
    .catch(() => {
      toast.error("Failed load roles");
      setRoles([]); // ⬅️ jaga-jaga
    })
    .finally(() => {
      setLoadingRole(false);
    });
}, []);


  /* ======================
     DELETE
  ====================== */
  const confirmDelete = async () => {
    if (!selectedUser) return;

    try {
      await deleteUser(selectedUser.id);
      toast.success("User deleted");
      setShowDelete(false);
      setSelectedUser(null);
      fetchUsers(pagination.page);
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
    h-10 w-full md:w-96
    rounded-lg border border-gray-300 px-4 text-sm
    focus:border-[#8D1231] focus:ring-1 focus:ring-[#8D1231]
  "
          />

          <button
            onClick={() => router.push("/dashboard/superadmin/user/create")}
            className="
    flex w-full items-center justify-center gap-2
    rounded-lg bg-[#8D1231] px-5 py-2 text-sm text-white
    hover:bg-[#73122E]
    md:w-auto
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
  flex flex-col gap-3
  md:flex-row md:items-center
  rounded-xl border bg-white px-6 py-4 shadow-sm
"
      >
        <span className="text-sm font-semibold text-[#8D1231]">Filters:</span>

        {/* STATION (UUID) */}
        <select
          value={station}
          onChange={(e) => setStation(e.target.value)}
          disabled={loadingStation}
          className="h-10 min-w-[160px] rounded-lg border px-4 text-sm"
        >
          <option value="all" disabled={loadingStation}>
            {loadingStation ? "Loading stasiun..." : "Stasiun"}
          </option>

          {stations.map((s) => (
            <option key={s.id} value={s.id}>
              {s.stationName}
            </option>
          ))}
        </select>

        {/* ROLE (UUID) */}
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          disabled={loadingRole}
          className="h-10 min-w-[160px] rounded-lg border px-4 text-sm"
        >
          <option value="all" disabled={loadingRole}>
            {loadingRole ? "Loading role..." : "Role"}
          </option>

          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.roleName}
            </option>
          ))}
        </select>

        <button
          onClick={() => {
            setSearch("");
            setRole("all");
            setStation("all");
          }}
          className="flex h-10 w-10 items-center justify-center rounded-lg border"
        >
          <RotateCcw size={16} />
        </button>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="w-full table-fixed text-sm">
          <thead className="border-b bg-gray-50 text-[11px] font-semibold uppercase text-gray-600">
            <tr>
              <th className="w-[200px] px-4 py-3 text-left">Name</th>
              <th className="w-[120px] px-4 py-3 text-left">NIP</th>
              <th className="w-[140px] px-4 py-3 text-left">Username</th>
              <th className="w-[200px] px-4 py-3 text-left">Email</th>
              <th className="w-[140px] px-4 py-3 text-left">Phone</th>
              <th className="w-[120px] px-4 py-3 text-left">Role</th>
              <th className="w-[120px] px-4 py-3 text-left">Stasiun</th>
              <th className="w-[100px] px-4 py-3 text-center">Aksi</th>
            </tr>
          </thead>

          <tbody>
            {data.map((u) => (
              <tr key={u.id} className="border-t transition hover:bg-gray-50">
                {/* NAME */}
                <td className="px-4 py-2">
                  <div className="truncate text-gray-900">{u.fullname}</div>
                </td>

                {/* NIP */}
                <td className="px-4 py-2 whitespace-nowrap text-gray-700">
                  {u.nip}
                </td>

                {/* USERNAME */}
                <td className="px-4 py-2 truncate text-gray-700">
                  {u.username}
                </td>

                {/* EMAIL */}
                <td className="px-4 py-2 truncate text-gray-700">{u.email}</td>

                {/* PHONE */}
                <td className="px-4 py-2 whitespace-nowrap text-gray-700">
                  {u.phone}
                </td>

                {/* ROLE */}
                <td className="px-4 py-2 text-gray-800">{u.roleLabel}</td>

                {/* STATION */}
                <td className="px-4 py-2 text-gray-700">{u.station}</td>
                {/* ACTION */}
                <td className="px-4 py-2">
                  <div className="flex flex-col items-center gap-1 md:flex-row md:justify-center">
                    {/* EDIT */}
                    <button
                      onClick={() =>
                        router.push(
                          `/dashboard/superadmin/user/edit?id=${u.id}`
                        )
                      }
                      className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-700
      hover:bg-gray-200"
                    >
                      Edit
                    </button>

                    {/* DELETE */}
                    <button
                      onClick={() => {
                        setSelectedUser(u);
                        setShowDelete(true);
                      }}
                      className="rounded-md bg-[#8D1231] px-2 py-1 text-xs text-white
      hover:bg-[#73122E]"
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
          <div className="p-4 text-center text-sm text-gray-400">
            Loading data...
          </div>
        )}
      </div>

      {/* PAGINATION */}
      <div
        className="
  flex flex-wrap items-center justify-center gap-3
  px-4 text-sm
"
      >
        <button
          disabled={pagination.page === 1}
          onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
        >
          <ChevronLeft size={18} />
        </button>

        {pageNumbers.map((p) => (
          <button
            key={p}
            onClick={() => setPagination((pg) => ({ ...pg, page: p }))}
            className={p === pagination.page ? "font-semibold underline" : ""}
          >
            {p}
          </button>
        ))}

        <button
          disabled={pagination.page === pagination.totalPages}
          onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* DELETE CONFIRM */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div
            className="
  w-[90%] max-w-[400px]
  rounded-2xl bg-white p-6
"
          >
            <h2 className="text-lg font-semibold">Delete User</h2>
            <p className="mt-2 text-sm">
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
                className="h-9 w-24 rounded-md bg-[#8D1231] text-sm text-white"
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
