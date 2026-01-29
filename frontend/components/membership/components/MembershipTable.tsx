import { Eye, ChevronLeft, ChevronRight } from "lucide-react";

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

interface MembershipTableProps {
  data: Membership[];
  loading: boolean;
  pagination: Pagination;
  onPageChange: (page: number) => void;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (member: {
    id: string;
    name?: string | null;
    nik?: string | null;
  }) => void;
}

const formatNik = (nik?: string | null) => {
  if (!nik) return "-";
  return `FWC${nik}`;
};

export default function MembershipTable({
  data,
  loading,
  pagination,
  onPageChange,
  onView,
  onEdit,
  onDelete,
}: MembershipTableProps) {
  const pageNumbers = Array.from(
    { length: pagination.totalPages },
    (_, i) => i + 1,
  ).slice(Math.max(0, pagination.page - 3), pagination.page + 2);

  if (loading) {
    return <div className="text-xs text-gray-400">Loading data...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="min-w-[1800px] w-full table-fixed text-sm">
          <thead className="bg-gray-50 text-xs text-gray-600">
            <tr>
              <th className="px-4 py-3 text-center whitespace-nowrap w-[120px]">
                Membership Date
              </th>
              <th className="px-4 py-3 text-left whitespace-nowrap min-w-[180px]">
                Full Name
              </th>
              <th className="px-4 py-3 text-left whitespace-nowrap w-[100px]">
                NIP
              </th>
              <th className="px-4 py-3 text-left whitespace-nowrap w-[160px]">
                Identity Number
              </th>
              <th className="px-4 py-3 text-left whitespace-nowrap w-[120px]">
                Nationality
              </th>
              <th className="px-4 py-3 text-center whitespace-nowrap w-[100px]">
                Gender
              </th>
              <th className="px-4 py-3 text-left whitespace-nowrap min-w-[180px]">
                Email
              </th>
              <th className="px-4 py-3 text-center whitespace-nowrap w-[140px]">
                Phone
              </th>
              <th className="px-4 py-3 text-left whitespace-nowrap min-w-[220px]">
                Address
              </th>
              <th className="px-4 py-3 text-center whitespace-nowrap w-[120px]">
                Last Updated
              </th>
              <th className="px-4 py-3 text-center w-[60px]">View</th>
              <th className="px-4 py-3 text-center w-[140px]">Aksi</th>
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
                <td className="px-4 py-2 text-left">{item.name || "-"}</td>
                <td className="px-4 py-2 text-left">{item.nip || "-"}</td>
                <td className="px-4 py-2 text-left">{formatNik(item.nik)}</td>
                <td className="px-4 py-2 text-left">
                  {item.nationality || "-"}
                </td>
                <td className="px-4 py-2 text-center">{item.gender || "-"}</td>
                <td className="px-4 py-2 text-left">{item.email || "-"}</td>
                <td className="px-4 py-2 text-center">{item.phone || "-"}</td>
                <td className="px-4 py-2 text-left">{item.address || "-"}</td>
                <td className="px-4 py-2 text-center whitespace-nowrap">
                  {item.updated_at || "-"}
                </td>

                <td className="px-4 py-2 text-center">
                  <Eye
                    size={16}
                    className="mx-auto cursor-pointer text-gray-500 hover:text-blue-600"
                    onClick={() => onView(item.id)}
                  />
                </td>

                <td className="px-4 py-2 text-center">
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => onEdit(item.id)}
                      className="rounded bg-gray-200 px-3 py-1 text-xs hover:bg-gray-300"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() =>
                        onDelete({
                          id: item.id,
                          name: item.name ?? null,
                          nik: item.nik ?? null,
                        })
                      }
                      className="rounded px-3 py-1 text-xs text-white bg-[#8D1231] hover:bg-[#73122E] transition"
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

      {/* Pagination */}
      <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
        <button
          disabled={pagination.page === 1}
          onClick={() => onPageChange(pagination.page - 1)}
          className="px-2 disabled:opacity-40"
        >
          <ChevronLeft size={18} />
        </button>

        {pageNumbers.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`h-8 w-8 rounded ${
              p === pagination.page
                ? "bg-[#8D1231] text-white"
                : "hover:bg-gray-100"
            }`}
          >
            {p}
          </button>
        ))}

        <button
          disabled={pagination.page === pagination.totalPages}
          onClick={() => onPageChange(pagination.page + 1)}
          className="px-2 disabled:opacity-40"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
