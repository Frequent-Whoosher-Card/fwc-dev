'use client';

import { Search, RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';

/* ======================
   DUMMY DATA
====================== */
const dummyData = Array.from({ length: 10 }).map((_, i) => ({
  id: i + 1,
  redeem_date: '12-12-2026',
  customer_name: 'Jessica Wongso',
  nik: '121213132131321',
  card_category: 'Gold',
  card_type: 'JaBan',
  serial_number: '097767678678',
  quota: 10,
  remaining: 6,
  shift_date: 'ramadhan',
  station: 'Halim',
}));

/* ======================
   PAGE
====================== */
export default function RedeemKuotaPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          Redeem Kuota Management
        </h1>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search members"
              className="h-9 w-64 rounded-md border pl-9 pr-3 text-sm"
            />
          </div>

          <button
            onClick={() =>
              router.push(
                '/dashboard/superadmin/redeemkuota/components'
              )
            }
            className="rounded-md bg-red-700 px-4 py-2 text-sm text-white"
          >
            Redeem Kuota
          </button>
        </div>
      </div>

      {/* FILTER */}
      <div className="rounded-lg border bg-white px-4 py-3">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-600">
            Filters:
          </span>

          <select className="h-9 rounded-md border px-3 text-sm">
            <option>Card Category</option>
            <option>Gold</option>
            <option>Silver</option>
          </select>

          <select className="h-9 rounded-md border px-3 text-sm">
            <option>Card Type</option>
            <option>JaBan</option>
          </select>

          <span className="text-sm font-medium text-gray-600">
            Redeem Date:
          </span>
          <input
            type="date"
            className="h-9 rounded-md border px-3 text-sm"
          />

          <span className="text-sm font-medium text-gray-600">
            Shift Date:
          </span>
          <input
            type="date"
            className="h-9 rounded-md border px-3 text-sm"
          />

          <button className="flex h-9 w-9 items-center justify-center rounded-md border">
            <RotateCcw size={16} />
          </button>

          <button className="flex h-9 w-20 items-center justify-center rounded-md border">
            Export
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="min-w-[1600px] w-full">
          <thead className="bg-gray-50 text-xs text-gray-600">
            <tr>
              <th className="px-4 py-3">Redeem Date</th>
              <th className="px-4 py-3">Customer Name</th>
              <th className="px-4 py-3">NIK</th>
              <th className="px-4 py-3">Card Category</th>
              <th className="px-4 py-3">Card Type</th>
              <th className="px-4 py-3">Serial Number</th>
              <th className="px-4 py-3">Jumlah Kuota</th>
              <th className="px-4 py-3">Sisa Kuota</th>
              <th className="px-4 py-3">Shift Date</th>
              <th className="px-4 py-3">Stasiun</th>
              <th className="px-4 py-3 text-center">Aksi</th>
            </tr>
          </thead>

          <tbody>
            {dummyData.map((item) => (
              <tr key={item.id} className="border-t text-sm">
                <td className="px-4 py-2">{item.redeem_date}</td>
                <td className="px-4 py-2">{item.customer_name}</td>
                <td className="px-4 py-2">{item.nik}</td>
                <td className="px-4 py-2">{item.card_category}</td>
                <td className="px-4 py-2">{item.card_type}</td>
                <td className="px-4 py-2">{item.serial_number}</td>
                <td className="px-4 py-2 text-center">{item.quota}</td>
                <td className="px-4 py-2 text-center">{item.remaining}</td>
                <td className="px-4 py-2">{item.shift_date}</td>
                <td className="px-4 py-2">{item.station}</td>
                <td className="px-4 py-2 text-center">
                  <div className="flex justify-center gap-2">
                    <button className="rounded bg-blue-600 px-3 py-1 text-xs text-white">
                      Last Redeem
                    </button>
                    <button className="rounded bg-gray-200 px-3 py-1 text-xs">
                      Edit
                    </button>
                    <button className="rounded bg-red-600 px-3 py-1 text-xs text-white">
                      Hapus
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="flex justify-center gap-2 text-sm text-gray-600">
        <button className="px-2">Prev</button>
        <button className="font-semibold underline">1</button>
        <button>2</button>
        <button>3</button>
        <button className="px-2">Next</button>
      </div>
    </div>
  );
}
