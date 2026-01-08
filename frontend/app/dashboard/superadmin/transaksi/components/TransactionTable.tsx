'use client';

import { useEffect, useState } from 'react';
import { getPurchases } from '@/lib/services/purchase.service';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Purchase {
  id: string;
  purchaseDate: string;
  price: number;
  edcReferenceNumber: string;
  card: {
    id: string;
    serialNumber: string;
    status: string;
    expiredDate: string | null;
    quotaTicket: number;
    cardProduct: {
      id: string;
      totalQuota: number;
      masaBerlaku: number;
      category: {
        id: string;
        categoryName: string;
      };
      type: {
        id: string;
        typeName: string;
      };
    };
  };
  member: {
    id: string;
    name: string;
    identityNumber: string;
  } | null;
  operator: {
    id: string;
    fullName: string;
  };
  station: {
    id: string;
    stationName: string;
  };
}

interface Pagination {
  page: number;
  limit: number;
  totalPages: number;
  total: number;
}

const formatDate = (iso?: string | null) => {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

export default function TransactionTable() {
  const [data, setData] = useState<Purchase[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    totalPages: 1,
    total: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchPurchases = async (page: number = 1) => {
    try {
      setLoading(true);
      const res = await getPurchases({ page, limit: 10 });
      
      if (res.success && res.data) {
        setData(res.data.items || []);
        setPagination(res.data.pagination || pagination);
      }
    } catch (err) {
      console.error('Error fetching purchases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases(pagination.page);
  }, [pagination.page]);

  const pageNumbers = Array.from(
    { length: pagination.totalPages },
    (_, i) => i + 1
  ).slice(
    Math.max(0, pagination.page - 3),
    pagination.page + 2
  );

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-md border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left whitespace-nowrap">Purchase Date</th>
              <th className="px-3 py-2 text-left whitespace-nowrap">Masa Berlaku</th>
              <th className="px-3 py-2 text-left whitespace-nowrap">Expired Date</th>
              <th className="px-3 py-2 text-left whitespace-nowrap">Status Card</th>
              <th className="px-3 py-2 text-left whitespace-nowrap">Card Category</th>
              <th className="px-3 py-2 text-left whitespace-nowrap">Card Type</th>
              <th className="px-3 py-2 text-left whitespace-nowrap">Total Quota</th>
              <th className="px-3 py-2 text-left whitespace-nowrap">Remaining Quota</th>
              <th className="px-3 py-2 text-left whitespace-nowrap">Serial Number</th>
              <th className="px-3 py-2 text-left whitespace-nowrap">No. Reference EDC</th>
              <th className="px-3 py-2 text-left whitespace-nowrap">FWC Price</th>
              <th className="px-3 py-2 text-left whitespace-nowrap">Shift Date</th>
              <th className="px-3 py-2 text-left whitespace-nowrap">Operator Name</th>
              <th className="px-3 py-2 text-left whitespace-nowrap">Stasiun</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={14} className="px-3 py-6 text-center text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={14} className="px-3 py-6 text-center text-gray-400">
                  No data
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={item.id} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2 whitespace-nowrap">
                    {formatDate(item.purchaseDate)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {item.card.cardProduct.masaBerlaku} hari
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {formatDate(item.card.expiredDate)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        item.card.status === 'SOLD_ACTIVE'
                          ? 'bg-green-100 text-green-700'
                          : item.card.status === 'EXPIRED'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {item.card.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {item.card.cardProduct.category.categoryName}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {item.card.cardProduct.type.typeName}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-center">
                    {item.card.cardProduct.totalQuota}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-center">
                    {item.card.quotaTicket}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap font-mono">
                    {item.card.serialNumber}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap font-mono">
                    {item.edcReferenceNumber}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {formatCurrency(item.price)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {formatDate(item.purchaseDate)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {item.operator.fullName}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {item.station.stationName}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {!loading && data.length > 0 && (
        <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
          <button
            disabled={pagination.page === 1}
            onClick={() =>
              setPagination((p) => ({
                ...p,
                page: p.page - 1,
              }))
            }
            className="px-2 disabled:opacity-40"
          >
            <ChevronLeft size={18} />
          </button>

          {pageNumbers.map((p) => (
            <button
              key={p}
              onClick={() =>
                setPagination((pg) => ({
                  ...pg,
                  page: p,
                }))
              }
              className={`px-3 py-1 ${
                p === pagination.page
                  ? 'font-semibold underline'
                  : ''
              }`}
            >
              {p}
            </button>
          ))}

          <button
            disabled={pagination.page === pagination.totalPages}
            onClick={() =>
              setPagination((p) => ({
                ...p,
                page: p.page + 1,
              }))
            }
            className="px-2 disabled:opacity-40"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
