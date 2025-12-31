'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, Plus } from 'lucide-react';

/* ======================
   TYPES
====================== */
interface Membership {
  id: number;
  membershipDate: string;
  name: string;
  nik: string;
  gender: 'Laki - Laki' | 'Perempuan';
  email: string;
  phone: string;
  address: string;
  updatedAt: string;
}

/* ======================
   MAIN PAGE
====================== */
export default function MembershipPage() {
  const router = useRouter();

  const [data, setData] = useState<Membership[]>([]);

  // filter & search
  const [search, setSearch] = useState('');
  const [gender, setGender] = useState<'all' | 'Laki - Laki' | 'Perempuan'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  /* ======================
     LOAD DATA
  ====================== */
  useEffect(() => {
    const stored = JSON.parse(
      localStorage.getItem('fwc_memberships') || '[]'
    );
    setData(stored);
  }, []);

  /* ======================
     FILTERED DATA
  ====================== */
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const keyword =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.nik.includes(search) ||
        item.email.toLowerCase().includes(search.toLowerCase());

      const genderMatch =
        gender === 'all' ? true : item.gender === gender;

      const startMatch =
        startDate ? item.membershipDate >= startDate : true;

      const endMatch =
        endDate ? item.membershipDate <= endDate : true;

      return keyword && genderMatch && startMatch && endMatch;
    });
  }, [data, search, gender, startDate, endDate]);

  /* ======================
     DELETE
  ====================== */
  const handleDelete = (id: number) => {
    if (!confirm('Yakin ingin menghapus membership ini?')) return;

    const updated = data.filter((item) => item.id !== id);
    setData(updated);
    localStorage.setItem('fwc_memberships', JSON.stringify(updated));
  };

  /* ======================
     RENDER
  ====================== */
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Membership Management</h1>

        <button
          onClick={() => router.push('/dashboard/superadmin/membership/create')}
          className="flex items-center gap-2 rounded-md bg-red-700 px-4 py-2 text-sm text-white hover:bg-red-800"
        >
          <Plus size={16} />
          Add New Members
        </button>
      </div>

      {/* FILTER */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-white p-4">
        <input
          type="text"
          placeholder="Search members"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-56 rounded border px-3 py-2 text-sm"
        />

        <select
          value={gender}
          onChange={(e) =>
            setGender(e.target.value as 'all' | 'Laki - Laki' | 'Perempuan')
          }
          className="rounded border px-3 py-2 text-sm"
        >
          <option value="all">All Gender</option>
          <option value="Laki - Laki">Laki - Laki</option>
          <option value="Perempuan">Perempuan</option>
        </select>

        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="rounded border px-3 py-2 text-sm"
        />

        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="rounded border px-3 py-2 text-sm"
        />
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="px-4 py-3">Membership Date</th>
              <th className="px-4 py-3">Customer Name</th>
              <th className="px-4 py-3">NIK</th>
              <th className="px-4 py-3">Gender</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Alamat</th>
              <th className="px-4 py-3">Last Updated</th>
              <th className="px-4 py-3 text-center">View</th>
              <th className="px-4 py-3 text-center">Aksi</th>
            </tr>
          </thead>

          <tbody>
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={10} className="py-6 text-center text-gray-500">
                  Data tidak ditemukan
                </td>
              </tr>
            )}

            {filteredData.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="px-4 py-3">{item.membershipDate}</td>
                <td className="px-4 py-3">{item.name}</td>
                <td className="px-4 py-3">{item.nik}</td>
                <td className="px-4 py-3">{item.gender}</td>
                <td className="px-4 py-3">{item.email}</td>
                <td className="px-4 py-3">{item.phone}</td>
                <td className="px-4 py-3">{item.address}</td>
                <td className="px-4 py-3">{item.updatedAt}</td>
                <td className="px-4 py-3 text-center">
                  <Eye className="mx-auto cursor-pointer" size={16} />
                </td>
                <td className="px-4 py-3 text-center">
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
                      onClick={() => handleDelete(item.id)}
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
    </div>
  );
}
