'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Eye,
  Plus,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';

import {
  getMembers,
  deleteMember,
} from '@/lib/services/membership.service';

/* ======================
   TYPES (IKUT API)
====================== */
interface Membership {
  id: number;
  membership_date: string;
  name: string;
  nik: string;
  nationality: string;
  gender: 'Laki - Laki' | 'Perempuan';
  email: string;
  phone: string;
  address: string;
  operator_name: string;
  updated_at: string;
}

/* ======================
   DELETE MODAL
====================== */
function ConfirmDeleteModal({
  open,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-[380px] rounded-xl bg-white p-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <AlertTriangle className="text-red-600" />
        </div>

        <h2 className="text-lg font-semibold">Delete Data</h2>
        <p className="mt-2 text-sm text-gray-600">
          Are you sure want to delete this Data ? <br />
          This action cannot be undone.
        </p>

        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={onCancel}
            className="rounded-md bg-gray-200 px-5 py-2 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded-md bg-red-600 px-5 py-2 text-sm text-white hover:bg-red-700"
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

  const [data, setData] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [gender, setGender] =
    useState<'all' | 'Laki - Laki' | 'Perempuan'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  /* ======================
     LOAD DATA (API)
  ====================== */
  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await getMembers();
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  /* ======================
     FILTER + SEARCH (FE)
  ====================== */
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const keywordMatch = search
        ? item.name.toLowerCase().includes(search.toLowerCase()) ||
          item.nik.includes(search)
        : true;

      const genderMatch =
        gender === 'all' ? true : item.gender === gender;

      const startMatch = startDate
        ? item.membership_date >= startDate
        : true;

      const endMatch = endDate
        ? item.membership_date <= endDate
        : true;

      return keywordMatch && genderMatch && startMatch && endMatch;
    });
  }, [data, search, gender, startDate, endDate]);

  const resetFilter = () => {
    setGender('all');
    setStartDate('');
    setEndDate('');
  };

  /* ======================
     DELETE HANDLER (API)
  ====================== */
  const confirmDelete = async () => {
    if (!selectedId) return;

    try {
      await deleteMember(selectedId);
      setShowDeleteModal(false);
      setSelectedId(null);
      setShowSuccessModal(true);
      fetchMembers(); // refresh list
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* ================= HEADER ================= */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          Membership Management
        </h1>

        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search by Customer Name or Identity Number"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-96 rounded-md border px-3 text-sm focus:border-gray-400 focus:outline-none"
          />

          <button
            onClick={() =>
              router.push('/dashboard/superadmin/membership/create')
            }
            className="flex items-center gap-2 rounded-md bg-red-700 px-4 py-2 text-sm text-white hover:bg-red-800"
          >
            <Plus size={16} />
            Add New Members
          </button>
        </div>
      </div>

      {/* ================= FILTER ================= */}
      <div className="rounded-lg border bg-white px-4 py-3">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm font-medium text-gray-600">
            Filters:
          </span>

          <select
            value={gender}
            onChange={(e) =>
              setGender(
                e.target.value as
                  | 'all'
                  | 'Laki - Laki'
                  | 'Perempuan'
              )
            }
            className="h-9 rounded-md border px-3 text-sm"
          >
            <option value="all">Gender</option>
            <option value="Laki - Laki">Laki - Laki</option>
            <option value="Perempuan">Perempuan</option>
          </select>

          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-9 rounded-md border px-3 text-sm"
          />

          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-9 rounded-md border px-3 text-sm"
          />

          <button
            onClick={resetFilter}
            className="flex h-9 w-9 items-center justify-center rounded-md border hover:bg-gray-100"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* ================= TABLE ================= */}
      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="min-w-[1600px] w-full">
          <thead className="bg-gray-50 text-xs text-gray-600">
            <tr>
              <th className="px-4 py-3">Membership Date</th>
              <th className="px-4 py-3">Customer Name</th>
              <th className="px-4 py-3">Identity Number</th>
              <th className="px-4 py-3">Nationality</th>
              <th className="px-4 py-3">Gender</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Address</th>
              <th className="px-4 py-3">Last Updated</th>
              <th className="px-4 py-3 text-center">View</th>
              <th className="px-4 py-3 text-center">Aksi</th>
            </tr>
          </thead>

          <tbody>
            {filteredData.map((item) => (
              <tr
                key={item.id}
                className="border-t text-sm hover:bg-gray-50"
              >
                <td className="px-4 py-2">
                  {item.membership_date}
                </td>
                <td className="px-4 py-2">{item.name}</td>
                <td className="px-4 py-2">{item.nik}</td>
                <td className="px-4 py-2">{item.nationality}</td>
                <td className="px-4 py-2">{item.gender}</td>
                <td className="px-4 py-2">{item.email}</td>
                <td className="px-4 py-2">{item.phone}</td>
                <td className="px-4 py-2">{item.address}</td>
                <td className="px-4 py-2">
                  {item.updated_at}
                </td>

                <td className="px-4 py-2 text-center">
                  <Eye
                    size={16}
                    className="mx-auto cursor-pointer text-gray-500 hover:text-blue-600"
                    onClick={() =>
                      router.push(
                        `/dashboard/superadmin/membership/view/${item.id}`
                      )
                    }
                  />
                </td>

                <td className="px-4 py-2 text-center">
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() =>
                        router.push(
                          `/dashboard/superadmin/membership/edit/${item.id}`
                        )
                      }
                      className="rounded bg-gray-200 px-3 py-1 text-xs"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => {
                        setSelectedId(item.id);
                        setShowDeleteModal(true);
                      }}
                      className="rounded bg-red-600 px-3 py-1 text-xs text-white"
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

      <ConfirmDeleteModal
        open={showDeleteModal}
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
      />

      <SuccessModal
        open={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
      />
    </div>
  );
}
