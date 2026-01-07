"use client";

import Button from "../components/Button";
import Table from "../components/Table";
import Pagination from "../components/Pagination";

export default function PetugasPage() {
  const columns = [
    "No",
    "NIK",
    "Card Category",
    "Card Type",
    "Card Aktif",
    "Card Expired",
    "Stasiun",
    "Aksi",
  ];

  const rows = [
    [
      1,
      "3174xxxxxxxx",
      "Gold",
      "Personal",
      "Aktif",
      "12-12-2026",
      "Halim",
      <button key="1" className="text-blue-600 text-sm">
        Detail
      </button>,
    ],
    [
      2,
      "3175xxxxxxxx",
      "Silver",
      "Corporate",
      "Aktif",
      "08-05-2026",
      "Karawang",
      <button key="2" className="text-blue-600 text-sm">
        Detail
      </button>,
    ],
  ];

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h2 className="text-lg font-semibold">
          Daftar Member Frequent Whoosher Card
        </h2>
        <p className="text-xs text-gray-500">
          last update 12 December 2025 09.30 AM
        </p>
      </div>

      {/* ACTION BAR */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="primary">Tambah</Button>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search..."
            className="h-9 px-3 text-sm border rounded-md"
          />
          <Button variant="secondary">Filter</Button>
          <Button variant="secondary">Export</Button>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white border rounded-md overflow-hidden">
        <Table columns={columns} data={rows} />
      </div>

      {/* PAGINATION */}
      <Pagination />
    </div>
  );
}
