"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { getStations, StationItem } from "@/lib/services/station.service";
import { getRoles, RoleItem } from "@/lib/services/user.service";
import { getUsers, deleteUser } from "@/lib/services/user.service";

import { getAuthMe } from "@/lib/services/auth.service";

import UserHeader from "@/components/user/UserHeader";
import UserFilter from "@/components/user/UserFilter";
import UserTable from "@/components/user/UserTable";
import UserPagination from "@/components/user/UserPagination";
import ConfirmDeleteModal from "@/components/user/ConfirmDeleteModal";
import { User, Pagination } from "@/components/user/types";

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
  
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  /* ======================
     FETCH AUTH
  ====================== */
  useEffect(() => {
    getAuthMe()
      .then((res) => {
        if (res?.data?.id) {
            setCurrentUserId(res.data.id);
        }
      })
      .catch((err) => {
        console.error("Failed get current user id", err);
      });
  }, []);


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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, role, station]);

  useEffect(() => {
    fetchUsers(pagination.page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
     RENDER
  ====================== */
  return (
    <div className="space-y-8">
      {/* HEADER */}
      <UserHeader
        search={search}
        setSearch={setSearch}
        onAdd={() => router.push("/dashboard/superadmin/user/create")}
      />

      {/* FILTER */}
      <UserFilter
        station={station}
        setStation={setStation}
        role={role}
        setRole={setRole}
        stations={stations}
        roles={roles}
        loadingStation={loadingStation}
        loadingRole={loadingRole}
        onReset={() => {
          setSearch("");
          setRole("all");
          setStation("all");
        }}
        search={search}
      />

      {/* TABLE */}
      <UserTable
        data={data}
        loading={loading}
        currentUserId={currentUserId}
        onEdit={(id) => router.push(`/dashboard/superadmin/user/edit?id=${id}`)}
        onDelete={(user) => {
          setSelectedUser(user);
          setShowDelete(true);
        }}
      />

      {/* PAGINATION */}
      <UserPagination pagination={pagination} setPagination={setPagination} />

      {/* DELETE CONFIRM MODAL */}
      <ConfirmDeleteModal
        open={showDelete}
        name={selectedUser?.fullname || "-"}
        identity={selectedUser?.nip || "-"}
        onCancel={() => {
          setShowDelete(false);
          setSelectedUser(null);
        }}
        onConfirm={async () => {
          if (!selectedUser) return;

          try {
            await deleteUser(selectedUser.id);
            toast.success("User deleted successfully");

            setShowDelete(false);
            setSelectedUser(null);
            fetchUsers(pagination.page);
          } catch (err: any) {
            toast.error(err?.response?.data?.message || "Failed delete user");
          }
        }}
      />
    </div>
  );
}
