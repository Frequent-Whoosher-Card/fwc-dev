import { User } from "./types";

interface UserTableProps {
  data: User[];
  loading: boolean;
  onEdit: (id: string) => void;
  onDelete: (user: User) => void;
  currentUserId: string | null;
  totalData: number; // ADDED
}

export default function UserTable({
  data,
  loading,
  onEdit,
  onDelete,
  currentUserId,
  totalData,
}: UserTableProps) {
  return (
    <div>
      {/* HEADER SECTION (MOBILE ONLY) */}
      <div className="mb-4 flex items-center justify-between md:hidden">
         <h3 className="text-sm font-semibold text-gray-700">User List</h3>
         <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Total Data:</span>
            <span className="px-2.5 py-0.5 rounded-md bg-[#8D1231]/10 text-[#8D1231] text-xs font-medium border border-[#8D1231]/20">
              {totalData}
            </span>
         </div>
      </div>

      {/* =======================
          DESKTOP VIEW (TABLE)
      ======================= */}
      <div className="hidden rounded-xl border bg-white shadow-sm md:block">
        {/* HEADER INSIDE CARD (DESKTOP) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between px-4 py-3 border-b gap-2">
           <h3 className="text-sm font-semibold text-gray-700">User List</h3>
           <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Total Data:</span>
              <span className="px-2.5 py-0.5 rounded-md bg-[#8D1231]/10 text-[#8D1231] text-xs font-medium border border-[#8D1231]/20">
                {totalData}
              </span>
           </div>
        </div>

        <div className="overflow-x-auto pb-4 [&::-webkit-scrollbar]:h-3 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-400 [&::-webkit-scrollbar-track]:bg-gray-100">
          <table className="w-full min-w-[1500px] table-fixed text-sm border-collapse">
          <thead className="bg-gray-50 text-[11px] font-semibold uppercase text-gray-600 border-b border-gray-200">
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
                <tr key={u.id} className="transition hover:bg-gray-50 border-b border-gray-200">
                  {/* NAME */}
                  <td className="px-4 py-2">
                    <div className="truncate text-gray-900">{u.fullname}</div>
                  </td>

                  {/* NIP */}
                  <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                    {u.nip}
                  </td>

                  {/* USERNAME */}
                  <td className="truncate px-4 py-2 text-gray-700">
                    {u.username}
                  </td>

                  {/* EMAIL */}
                  <td className="truncate px-4 py-2 text-gray-700">{u.email}</td>

                  {/* PHONE */}
                  <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                    {u.phone}
                  </td>

                  {/* ROLE */}
                  <td className="px-4 py-2 text-gray-800">{u.roleLabel}</td>

                  {/* STATION */}
                  <td className="px-4 py-2 text-gray-700">{u.station}</td>
                  {/* ACTION */}
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-center gap-2">
                        {/* EDIT */}
                        <button
                        onClick={() => onEdit(u.id)}
                        className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-700 hover:bg-gray-200"
                        >
                        Edit
                      </button>

                      {/* DELETE */}
                      <button
                        onClick={() => !isSelf && onDelete(u)}
                        disabled={isSelf}
                        className={`rounded-md px-2 py-1 text-xs text-white transition ${
                          isSelf
                            ? "cursor-not-allowed bg-gray-300"
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
       </div>
      </div>

      {/* =======================
          MOBILE VIEW (CARDS)
      ======================= */}
      <div className="flex flex-col gap-4 md:hidden">
        {data.map((u) => {
            const isSelf = u.id === currentUserId;
            return (
                <div key={u.id} className="flex flex-col gap-3 rounded-xl border bg-white p-4 shadow-sm">
                {/* Header: Name, Username, Role */}
                <div className="flex items-start justify-between">
                    <div>
                    <div className="font-semibold text-gray-900">{u.fullname}</div>
                    <div className="text-xs text-gray-500">@{u.username}</div>
                    </div>
                    <span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                    {u.roleLabel}
                    </span>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 gap-y-3 gap-x-4 text-sm text-gray-600 sm:grid-cols-2">
                    <div>
                    <div className="text-[10px] uppercase text-gray-400">NIP</div>
                    <div className="font-medium truncate">{u.nip}</div>
                    </div>
                    <div>
                    <div className="text-[10px] uppercase text-gray-400">Station</div>
                    <div className="font-medium truncate">{u.station}</div>
                    </div>
                    <div>
                    <div className="text-[10px] uppercase text-gray-400">Phone</div>
                    <div className="truncate">{u.phone}</div>
                    </div>
                    <div className="sm:col-span-2">
                    <div className="text-[10px] uppercase text-gray-400">Email</div>
                    <div className="truncate">{u.email}</div>
                    </div>
                </div>

                {/* Actions */}
                <div className="mt-2 flex gap-3 border-t pt-3">
                    <button
                        onClick={() => onEdit(u.id)}
                        className="flex-1 rounded-lg bg-gray-100 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                    >
                    Edit
                    </button>
                    <button
                        onClick={() => !isSelf && onDelete(u)}
                        disabled={isSelf}
                        className={`flex-1 rounded-lg py-2 text-sm font-medium text-white transition ${
                            isSelf
                            ? "cursor-not-allowed bg-gray-300"
                            : "bg-[#8D1231] hover:bg-[#73122E]"
                        }`}
                    >
                    Delete
                    </button>
                </div>
                </div>
            );
        })}

        {data.length === 0 && !loading && (
            <div className="rounded-xl border bg-white p-8 text-center text-gray-500">
                Data tidak ditemukan
            </div>
        )}
      </div>

      {loading && (
        <div className="p-4 text-center text-sm text-gray-400">
          Loading data...
        </div>
      )}
    </div>
  );
}
