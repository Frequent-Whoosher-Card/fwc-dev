"use client";

import Button from "../../components/Button";
import Table from "../../components/Table";
import Pagination from "../../components/Pagination";

export default function RedeemPage() {
  const columns = [
    "No",
    "Member",
    "Product",
    "Points Used",
    "Date",
    "Status",
    "Action",
  ];

  const rows = [
    [
      1,
      "John Doe",
      "Tumbler Whoosh",
      "50",
      "12-12-2025",
      <span key="s1" className="text-green-600 font-medium">Completed</span>,
      <button key="b1" className="text-blue-600 text-sm">
        Detail
      </button>,
    ],
    [
      2,
      "Jane Smith",
      "Free Trip Voucher",
      "100",
      "13-12-2025",
      <span key="s2" className="text-yellow-600 font-medium">Pending</span>,
      <button key="b2" className="text-blue-600 text-sm">
        Detail
      </button>,
    ],
  ];

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h2 className="text-lg font-semibold">
          Daftar Penukaran (Redeem)
        </h2>
        <p className="text-xs text-gray-500">
          History of product redemptions
        </p>
      </div>

      {/* ACTION BAR */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="primary">New Redeem</Button>
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
