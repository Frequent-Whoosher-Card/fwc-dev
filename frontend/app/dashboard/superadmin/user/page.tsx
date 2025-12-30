'use client';

import { useRouter } from 'next/navigation';

export default function UserPage() {
  const router = useRouter();
  const users: any[] = [];

  return (
    <div className="space-y-6">
      {/* ===== HEADER KHUSUS LIST ===== */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-semibold">
          User Management
        </h1>

        <div className="flex gap-3">
          <input
            placeholder="search operator"
            className="h-10 w-64 rounded-md border px-3 text-sm"
          />

          <button
            onClick={() =>
              router.push(
                '/dashboard/superadmin/user/create'
              )
            }
            className="h-10 rounded-md bg-[#7A0C2E] px-4 text-sm text-white hover:opacity-90"
          >
            + add new User
          </button>
        </div>
      </div>

      {/* ===== FILTER ===== */}
      <div className="flex items-center justify-between rounded-lg border p-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            Filters:
          </span>
          <select className="rounded-md border px-3 py-1 text-sm">
            <option>Stasiun</option>
            <option>Halim</option>
            <option>Karawang</option>
            <option>Padalarang</option>
            <option>Tegalluar</option>
          </select>
        </div>
        <button className="text-gray-500">⟳</button>
      </div>

      {/* ===== TABLE ===== */}
      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Name</th>
              <th className="px-3 py-2 font-medium">NIP</th>
              <th className="px-3 py-2 font-medium">Username</th>
              <th className="px-3 py-2 font-medium">Email</th>
              <th className="px-3 py-2 font-medium">Phone Number</th>
              <th className="px-3 py-2 font-medium">Role</th>
              <th className="px-3 py-2 font-medium">Stasiun</th>
              <th className="px-3 py-2 font-medium">Aksi</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td
                colSpan={8}
                className="py-20 text-center text-gray-500"
              >
                Belum ada user yang terdaftar
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="flex justify-center text-sm text-gray-400">
        ← Prev | Next →
      </div>
    </div>
  );
}
