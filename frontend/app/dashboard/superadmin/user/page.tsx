'use client';

export default function UserPage() {
  return (
    <div className="space-y-4">
      {/* FILTER BAR */}
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

        <button className="text-gray-500 hover:text-gray-700">
          ⟳
        </button>
      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2">NIP</th>
              <th className="px-3 py-2">Username</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Phone Number</th>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Stasiun</th>
              <th className="px-3 py-2">Aksi</th>
            </tr>
          </thead>

          <tbody>
            {Array.from({ length: 10 }).map((_, i) => (
              <tr key={i} className="border-t">
                <td className="px-3 py-2">Jessica Wongso</td>
                <td className="px-3 py-2">12312131</td>
                <td className="px-3 py-2">Admin121</td>
                <td className="px-3 py-2">
                  Jesica12@gmail.com
                </td>
                <td className="px-3 py-2">
                  08765122134123
                </td>
                <td className="px-3 py-2">Super Admin</td>
                <td className="px-3 py-2">Halim</td>
                <td className="px-3 py-2 space-x-2">
                  <button className="rounded bg-gray-400 px-3 py-1 text-white text-xs">
                    Edit
                  </button>
                  <button className="rounded bg-red-500 px-3 py-1 text-white text-xs">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
        <button>← Prev</button>
        <span>1</span>
        <span>…</span>
        <span className="font-semibold text-black">
          12
        </span>
        <span>13</span>
        <span>…</span>
        <button>Next →</button>
      </div>
    </div>
  );
}
