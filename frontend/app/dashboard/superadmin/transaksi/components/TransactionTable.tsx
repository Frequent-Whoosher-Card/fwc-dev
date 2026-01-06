'use client';

export default function TransactionTable() {
  return (
    <div className="rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-2 text-left">Customer Name</th>
            <th className="px-3 py-2 text-left">NIK</th>
            <th className="px-3 py-2 text-left">Card Category</th>
            <th className="px-3 py-2 text-left">Card Type</th>
            <th className="px-3 py-2 text-left">Serial Number</th>
            <th className="px-3 py-2 text-left">Reference EDC</th>
            <th className="px-3 py-2 text-left">FWC Price</th>
            <th className="px-3 py-2 text-left">Purchase Date</th>
            <th className="px-3 py-2 text-left">Shift Date</th>
            <th className="px-3 py-2 text-left">Operator Name</th>
            <th className="px-3 py-2 text-left">Stasiun</th>
            <th className="px-3 py-2 text-left">Aksi</th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td colSpan={12} className="px-3 py-6 text-center text-gray-400">
              No data
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
