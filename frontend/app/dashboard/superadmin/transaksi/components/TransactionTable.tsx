'use client';

import { Eye } from 'lucide-react';

interface Transaction {
  id: string;
  customerName?: string | null;
  nik?: string | null;
  cardCategory?: string | null;
  cardType?: string | null;
  serialNumber?: string | null;
  referenceEdc?: string | null;
  price?: number | null;
  purchasedDate?: string | null;
  shiftDate?: string | null;
  operatorName?: string | null;
  stationName?: string | null;
}

interface Props {
  data: Transaction[];
  loading: boolean;
  onDelete: (id: string) => void;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
}

export default function TransactionTable({
  data,
  loading,
  onDelete,
  onView,
  onEdit,
}: Props) {
  if (loading) {
    return (
      <div className="text-sm text-gray-400">
        Loading data...
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border bg-white">
      <table className="min-w-[1800px] w-full">
        <thead className="bg-gray-50 text-xs text-gray-600">
          <tr>
            <th className="px-4 py-3 text-left whitespace-nowrap">
              Customer Name
            </th>
            <th className="px-4 py-3 text-center whitespace-nowrap">
              NIK
            </th>
            <th className="px-4 py-3 text-center whitespace-nowrap">
              Card Category
            </th>
            <th className="px-4 py-3 text-center whitespace-nowrap">
              Card Type
            </th>
            <th className="px-4 py-3 text-center whitespace-nowrap">
              Serial Number
            </th>
            <th className="px-4 py-3 text-center whitespace-nowrap">
              Reference EDC
            </th>
            <th className="px-4 py-3 text-right whitespace-nowrap">
              FWC Price
            </th>
            <th className="px-4 py-3 text-center whitespace-nowrap">
              Purchase Date
            </th>
            <th className="px-4 py-3 text-center whitespace-nowrap">
              Shift Date
            </th>
            <th className="px-4 py-3 text-left whitespace-nowrap">
              Operator Name
            </th>
            <th className="px-4 py-3 text-left whitespace-nowrap">
              Station
            </th>
            <th className="px-4 py-3 text-center whitespace-nowrap">
              View
            </th>
            <th className="px-4 py-3 text-center whitespace-nowrap">
              Aksi
            </th>
          </tr>
        </thead>

        <tbody>
          {data.length === 0 && (
            <tr>
              <td
                colSpan={13}
                className="px-4 py-6 text-center text-sm text-gray-400"
              >
                No data
              </td>
            </tr>
          )}

          {data.map((item) => (
            <tr
              key={item.id}
              className="border-t text-sm hover:bg-gray-50"
            >
              <td className="px-4 py-2 whitespace-nowrap">
                {item.customerName || '-'}
              </td>

              <td className="px-4 py-2 text-center font-mono whitespace-nowrap">
                {item.nik || '-'}
              </td>

              <td className="px-4 py-2 text-center whitespace-nowrap">
                {item.cardCategory || '-'}
              </td>

              <td className="px-4 py-2 text-center whitespace-nowrap">
                {item.cardType || '-'}
              </td>

              <td className="px-4 py-2 text-center font-mono whitespace-nowrap">
                {item.serialNumber || '-'}
              </td>

              <td className="px-4 py-2 text-center font-mono whitespace-nowrap">
                {item.referenceEdc || '-'}
              </td>

              <td className="px-4 py-2 text-right whitespace-nowrap">
                {item.price
                  ? item.price.toLocaleString('id-ID')
                  : '-'}
              </td>

              <td className="px-4 py-2 text-center whitespace-nowrap">
                {item.purchasedDate || '-'}
              </td>

              <td className="px-4 py-2 text-center whitespace-nowrap">
                {item.shiftDate || '-'}
              </td>

              <td className="px-4 py-2 whitespace-nowrap">
                {item.operatorName || '-'}
              </td>

              <td className="px-4 py-2 whitespace-nowrap">
                {item.stationName || '-'}
              </td>

              <td className="px-4 py-2 text-center">
                <Eye
                  size={16}
                  className="mx-auto cursor-pointer text-gray-500 hover:text-blue-600"
                  onClick={() => onView?.(item.id)}
                />
              </td>

              <td className="px-4 py-2 text-center">
                <div className="flex justify-center gap-2">
                  <button
                    onClick={() => onEdit?.(item.id)}
                    className="rounded bg-gray-200 px-3 py-1 text-xs"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => onDelete(item.id)}
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
  );
}
