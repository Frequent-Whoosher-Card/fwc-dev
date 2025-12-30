'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import DeleteConfirmModal from './components/DeleteConfirmModal';

/* ======================
   TYPES
====================== */
interface User {
  id: number;
  name: string;
  nip: string;
  username: string;
  email: string;
  phone: string;
  role: string;
  stasiun: string;
}

export default function UserPage() {
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const [showDelete, setShowDelete] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [search, setSearch] = useState('');
  const [stationFilter, setStationFilter] = useState('all');

  /* ======================
     LOAD DATA (INIT)
  ====================== */
  useEffect(() => {
    fetchUsers();
  }, []);

  /* ======================
     FETCH USERS
     (nanti tinggal ganti ke API)
  ====================== */
  const fetchUsers = async () => {
    setLoading(true);

    // 🔁 SIMULASI FETCH (localStorage sekarang)
    await new Promise((res) => setTimeout(res, 500));

    const stored = JSON.parse(
      localStorage.getItem('fwc_users') || '[]'
    );

    setUsers(stored);
    setLoading(false);
  };

  /* ======================
     FILTER + SEARCH
  ====================== */
  const filteredUsers = useMemo(() => {
    const keyword = search.toLowerCase();

    return users.filter((user) => {
      const stationMatch =
        stationFilter === 'all' ||
        user.stasiun === stationFilter;

      const searchMatch =
        user.name.toLowerCase().includes(keyword) ||
        user.username.toLowerCase().includes(keyword) ||
        user.role.toLowerCase().includes(keyword);

      return stationMatch && searchMatch;
    });
  }, [users, search, stationFilter]);

  /* ======================
     DELETE CONFIRM
  ====================== */
  const handleDelete = () => {
    if (selectedId === null) return;

    const updated = users.filter(
      (u) => u.id !== selectedId
    );

    localStorage.setItem(
      'fwc_users',
      JSON.stringify(updated)
    );

    setUsers(updated);
    setShowDelete(false);
    setSelectedId(null);
  };

  return (
    <div className="space-y-6">
      {/* ================= HEADER ================= */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          User Management
        </h1>

        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Search operator"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-64 rounded-md border px-3 text-sm"
          />

          <button
            onClick={() =>
              router.push('/dashboard/superadmin/user/create')
            }
            className="h-10 rounded-md bg-[#7A0C2E] px-4 text-sm text-white hover:opacity-90"
          >
            + add new User
          </button>
        </div>
      </div>

      {/* ================= FILTER + REFRESH ================= */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            Filters:
          </span>

          <select
            value={stationFilter}
            onChange={(e) => setStationFilter(e.target.value)}
            className="rounded-md border px-3 py-1 text-sm"
          >
            <option value="all">All Stasiun</option>
            <option value="Halim">Halim</option>
            <option value="Karawang">Karawang</option>
            <option value="Padalarang">Padalarang</option>
            <option value="Tegalluar">Tegalluar</option>
          </select>
        </div>

        {/* REFRESH BUTTON */}
        <button
          onClick={fetchUsers}
          disabled={loading}
          title="Refresh data"
          className={`flex h-9 w-9 items-center justify-center rounded-md border text-gray-500 hover:bg-gray-100 ${
            loading ? 'cursor-not-allowed opacity-50' : ''
          }`}
        >
          {loading ? '⏳' : '⟳'}
        </button>
      </div>

      {/* ================= TABLE ================= */}
      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">
                Name
              </th>
              <th className="px-4 py-3 text-left font-medium">
                NIP
              </th>
              <th className="px-4 py-3 text-left font-medium">
                Username
              </th>
              <th className="px-4 py-3 text-left font-medium">
                Email
              </th>
              <th className="px-4 py-3 text-left font-medium">
                Phone Number
              </th>
              <th className="px-4 py-3 text-left font-medium">
                Role
              </th>
              <th className="px-4 py-3 text-left font-medium">
                Stasiun
              </th>
              <th className="px-4 py-3 text-center font-medium w-[160px]">
                Aksi
              </th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={8}
                  className="py-16 text-center text-gray-400"
                >
                  Loading data...
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="py-16 text-center text-gray-500"
                >
                  Data tidak ditemukan
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="border-t hover:bg-gray-50"
                >
                  <td className="px-4 py-3">{user.name}</td>
                  <td className="px-4 py-3">{user.nip}</td>
                  <td className="px-4 py-3">
                    {user.username}
                  </td>
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3">{user.phone}</td>
                  <td className="px-4 py-3">{user.role}</td>
                  <td className="px-4 py-3">{user.stasiun}</td>
                  <td className="px-4 py-3 text-center space-x-2">
                    <button
                      onClick={() =>
                        router.push(
                          `/dashboard/superadmin/user/${user.id}/edit`
                        )
                      }
                      className="h-8 rounded-md bg-gray-200 px-3 text-xs text-gray-700 hover:bg-gray-300"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => {
                        setSelectedId(user.id);
                        setShowDelete(true);
                      }}
                      className="h-8 rounded-md bg-red-100 px-3 text-xs text-red-600 hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ================= PAGINATION ================= */}
      <div className="flex justify-center text-sm text-gray-400">
        ← Prev | Next →
      </div>

      {/* ================= DELETE MODAL ================= */}
      <DeleteConfirmModal
        open={showDelete}
        onCancel={() => setShowDelete(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
