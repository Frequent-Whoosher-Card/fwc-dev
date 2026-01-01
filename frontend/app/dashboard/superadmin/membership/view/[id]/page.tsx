'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

/* ======================
   TYPES
====================== */
interface Membership {
  id: number;
  membershipDate: string;
  name: string;
  nik: string;
  nationality: string;
  gender: 'Laki - Laki' | 'Perempuan';
  email: string;
  phone: string;
  address: string;
  operatorName: string;
  updatedAt: string;
}

interface Transaction {
  purchaseDate: string;
  duration: string;
  expiredDate: string;
  status: 'Active' | 'Expired';
  cardCategory: string;
  cardType: string;
  quota: number;
  remaining: number;
  serialNumber: string;
  referenceEdc: string;
  price: string;
  shiftDate: string;
  operatorName: string;
  station: string;
}

/* ======================
   PAGE
====================== */
export default function MembershipDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [member, setMember] = useState<Membership | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  /* ======================
     LOAD DATA
  ====================== */
  useEffect(() => {
    const stored: Membership[] = JSON.parse(
      localStorage.getItem('fwc_memberships') || '[]'
    );

    const found = stored.find(
      (item) => item.id === Number(id)
    );

    if (found) {
      setMember(found);

      setTransactions([
        {
          purchaseDate: '12-12-2025',
          duration: '60 Days',
          expiredDate: '12-02-2026',
          status: 'Active',
          cardCategory: 'Gold',
          cardType: 'JaBan',
          quota: 10,
          remaining: 6,
          serialNumber: '1203931',
          referenceEdc: '12123131321321',
          price: '2.000.000',
          shiftDate: '12-12-2025',
          operatorName: 'Bagas kara',
          station: 'Halim',
        },
        {
          purchaseDate: '01-11-2025',
          duration: '60 Days',
          expiredDate: '01-01-2026',
          status: 'Expired',
          cardCategory: 'Gold',
          cardType: 'JaBan',
          quota: 10,
          remaining: 0,
          serialNumber: '1203931',
          referenceEdc: '12123131321321',
          price: '2.000.000',
          shiftDate: '01-11-2025',
          operatorName: 'Bagas kara',
          station: 'Karawang',
        },
      ]);
    }
  }, [id]);

  if (!member) {
    return (
      <div className="text-sm text-gray-500">
        Data not found
      </div>
    );
  }

  const totalQuota = transactions.reduce(
    (sum, t) => sum + t.quota,
    0
  );

  const redeemed = transactions.reduce(
    (sum, t) => sum + (t.quota - t.remaining),
    0
  );

  return (
    <div className="space-y-6">
      {/* ================= HEADER ================= */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="rounded p-1 hover:bg-gray-100"
        >
          <ArrowLeft size={20} />
        </button>

        <h1 className="text-lg font-semibold">
          Detailed Member
        </h1>
      </div>

      {/* ================= MEMBER CARD ================= */}
      <div className="flex items-center justify-between rounded-lg border bg-white p-6">
        <div className="flex gap-6">
          <div className="flex h-24 w-40 items-center justify-center rounded bg-yellow-400 text-sm font-semibold text-black">
            JaBan
          </div>

          <div className="space-y-1 text-sm">
            <p className="text-base font-semibold">
              {member.name}
            </p>
            <p>NIK: {member.nik}</p>
            <p>
              {member.gender} • {member.nationality}
            </p>
            <p>{member.email}</p>
            <p>{member.phone}</p>
          </div>
        </div>

        <div className="text-sm text-right">
          <p>
            Kuota Ticket : <b>{totalQuota}</b>
          </p>
          <p>
            Redeemed : <b>{redeemed}</b>
          </p>
        </div>
      </div>

      {/* ================= TRANSACTION HISTORY ================= */}
      <div className="rounded-lg border bg-white">
        <div className="border-b px-4 py-3 font-semibold">
          Transaction History
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[2400px] w-full text-sm">
            <thead className="sticky top-0 bg-gray-50 text-left text-xs text-gray-600">
              <tr>
                <th className="px-4 py-3">Purchase Date</th>
                <th className="px-4 py-3">Masa Berlaku</th>
                <th className="px-4 py-3">Expired Date</th>
                <th className="px-4 py-3">Status Card</th>
                <th className="px-4 py-3">Card Category</th>
                <th className="px-4 py-3">Card Type</th>
                <th className="px-4 py-3">Kuota Ticket</th>
                <th className="px-4 py-3">Remaining Quota</th>
                <th className="px-4 py-3">Serial Number</th>
                <th className="px-4 py-3">No. Reference EDC</th>
                <th className="px-4 py-3">FWC Price</th>
                <th className="px-4 py-3">Shift Date</th>
                <th className="px-4 py-3">Operator Name</th>
                <th className="px-4 py-3">Stasiun</th>
              </tr>
            </thead>

            <tbody>
              {transactions.map((trx, index) => (
                <tr
                  key={index}
                  className="border-t transition hover:bg-gray-50"
                >
                  <td className="px-4 py-2">{trx.purchaseDate}</td>
                  <td className="px-4 py-2">{trx.duration}</td>
                  <td className="px-4 py-2">{trx.expiredDate}</td>

                  <td className="px-4 py-2">
                    <span
                      className={`rounded px-2 py-1 text-xs font-medium ${
                        trx.status === 'Active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {trx.status}
                    </span>
                  </td>

                  <td className="px-4 py-2">{trx.cardCategory}</td>
                  <td className="px-4 py-2">{trx.cardType}</td>
                  <td className="px-4 py-2">{trx.quota}</td>
                  <td className="px-4 py-2">{trx.remaining}</td>
                  <td className="px-4 py-2">{trx.serialNumber}</td>
                  <td className="px-4 py-2">{trx.referenceEdc}</td>
                  <td className="px-4 py-2">{trx.price}</td>
                  <td className="px-4 py-2">{trx.shiftDate}</td>
                  <td className="px-4 py-2">{trx.operatorName}</td>
                  <td className="px-4 py-2">{trx.station}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-2 text-xs text-gray-400">
          Scroll horizontally to see more details →
        </div>
      </div>
    </div>
  );
}
