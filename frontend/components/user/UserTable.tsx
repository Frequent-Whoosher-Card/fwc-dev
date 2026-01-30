import { User } from "./types";

interface UserTableProps {
  data: User[];
  loading: boolean;
  onEdit: (id: string) => void;
  onDelete: (user: User) => void;
  currentUserId: string | null;
}

export default function UserTable({
  data,
  loading,
  onEdit,
  onDelete,
  currentUserId,
}: UserTableProps) {
  return (
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
          {data.map((u) => {
            const isSelf = u.id === currentUserId;

            return (
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
                      onClick={() => onEdit(u.id)}
                      className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-700
      hover:bg-gray-200"
                    >
                      Edit
                    </button>

                    {/* DELETE */}
                    <button
                      onClick={() => !isSelf && onDelete(u)}
                      disabled={isSelf}
                      title={isSelf ? "Tidak bisa menghapus akun sendiri" : ""}
                      className={`rounded-md px-2 py-1 text-xs text-white transition
                        ${
                          isSelf
                            ? "cursor-not-allowed bg-gray-400 opacity-50"
                            : "bg-[#8D1231] hover:bg-[#73122E]"
                        }`}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {loading && (
        <div className="p-4 text-center text-sm text-gray-400">
          Loading data...
        </div>
      )}
    </div>
  );
}
