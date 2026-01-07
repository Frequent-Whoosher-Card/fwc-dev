'use client';

import { useEffect, useState, useContext } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { getMemberById } from '@/lib/services/membership.service';
import { getPurchases } from '@/lib/services/purchase.service';
import { UserContext } from '@/app/dashboard/superadmin/dashboard/dashboard-layout';

/* ======================
   TYPES
====================== */
interface Membership {
  id: string;
  name: string;
  identityNumber: string;
  nationality: string;
  email: string | null;
  phone: string | null;
  gender: string | null;
  alamat: string | null;
  createdAt: string;
  updatedAt: string;
  createdByName: string;
  updatedByName: string;
}

interface Transaction {
  purchaseDate: string;
  duration: string;
  expiredDate: string;
  status: 'Active' | 'Expired' | '-';
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
  const userCtx = useContext(UserContext);

  const [member, setMember] = useState<Membership | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ======================
     FETCH DATA
  ====================== */
  useEffect(() => {
    if (!id) return;

    const fetchDetail = async () => {
      try {
        setLoading(true);

        // 1️⃣ GET MEMBER
        const memberRes = await getMemberById(id);
        const memberData: Membership = memberRes.data;
        setMember(memberData);

        // 2️⃣ GET PURCHASES BY NIK
        const purchaseRes = await getPurchases({
          search: memberData.identityNumber,
          limit: 50,
        });

        const items = purchaseRes.data?.items ?? [];

        const mapped: Transaction[] = items.map((p: any) => {
          const purchaseDate = p.purchaseDate;
          const masaBerlaku =
            p.card?.cardProduct?.masaBerlaku ?? 0;

          // ✅ EXPIRED DATE = purchaseDate + masaBerlaku
          const expiredDate =
            purchaseDate && masaBerlaku
              ? new Date(
                  new Date(purchaseDate).getTime() +
                    masaBerlaku * 24 * 60 * 60 * 1000
                ).toISOString()
              : '';

          const duration = masaBerlaku
            ? `${masaBerlaku} Days`
            : '-';

          const price =
            typeof p.price === 'number'
              ? p.price.toLocaleString('id-ID')
              : '-';

          const totalQuota =
            p.card?.cardProduct?.totalQuota ?? 0;

          return {
            purchaseDate,
            expiredDate,
            duration,

            status:
              p.card?.status === 'SOLD_ACTIVE'
                ? 'Active'
                : p.card?.status === 'SOLD_EXPIRED'
                ? 'Expired'
                : '-',

            cardCategory:
              p.card?.cardProduct?.category?.categoryName ??
              '-',

            cardType:
              p.card?.cardProduct?.type?.typeName ?? '-',

            // ✅ dari cardProduct
            quota: totalQuota,

            // ⚠️ BE belum supply remaining → sementara
            remaining: totalQuota,

            serialNumber: p.card?.serialNumber ?? '-',

            referenceEdc: p.edcReferenceNumber ?? '-',

            price,

            // ✅ shift date = tanggal transaksi
            shiftDate: purchaseDate,

            operatorName:
              p.operator?.fullName ??
              p.createdByName ??
              '-',

            station: p.station?.stationName ?? '-',
          };
        });

        setTransactions(mapped);
      } catch (err: any) {
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  /* ======================
     STATE
  ====================== */
  if (loading) return <div className="p-6">Loading...</div>;
  if (error)
    return <div className="p-6 text-red-600">{error}</div>;
  if (!member)
    return (
      <div className="p-6 text-gray-500">Data not found</div>
    );

  const totalQuota = transactions.reduce(
    (sum, t) => sum + t.quota,
    0
  );

  const redeemed = transactions.reduce(
    (sum, t) => sum + (t.quota - t.remaining),
    0
  );

  const formatDate = (d: string) =>
    d ? new Date(d).toLocaleDateString('id-ID') : '-';

  const genderLabel =
    member.gender === 'L'
      ? 'Laki - Laki'
      : member.gender === 'P'
      ? 'Perempuan'
      : '-';

  /* ======================
     RENDER
  ====================== */
  return (
    <div className="space-y-6">
      {/* HEADER */}
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

      {/* MEMBER CARD */}
      <div className="flex items-center justify-between rounded-lg border bg-white p-6">
        <div className="flex gap-6">
          <div className="flex h-24 w-40 items-center justify-center rounded bg-yellow-400 text-sm font-semibold">
            JaBan
          </div>

          <div className="space-y-1 text-sm">
            <p className="text-base font-semibold">
              {member.name}
            </p>
            <p>NIK: {member.identityNumber}</p>
            <p>Gender: {genderLabel}</p>
            <p>Email: {member.email ?? '-'}</p>
            <p>Phone: {member.phone ?? '-'}</p>
            <p>
              Membership Date:{' '}
              {formatDate(member.createdAt)}
            </p>
            <p>
              Operator:{' '}
              {userCtx?.userName ??
                member.updatedByName ??
                '-'}
            </p>
          </div>
        </div>

        <div className="text-sm text-right">
          <p>
            Total Quota (Trips): <b>{totalQuota}</b>
          </p>
          <p>
            Redeemed: <b>{redeemed}</b>
          </p>
        </div>
      </div>

      {/* TRANSACTION HISTORY */}
      <div className="rounded-lg border bg-white">
        <div className="border-b px-4 py-3 font-semibold">
          Transaction History
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[2400px] w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-600">
              <tr>
                <th className="px-4 py-3">Purchase Date</th>
                <th className="px-4 py-3">Masa Berlaku</th>
                <th className="px-4 py-3">Expired Date</th>
                <th className="px-4 py-3">Status Card</th>
                <th className="px-4 py-3">Card Category</th>
                <th className="px-4 py-3">Card Type</th>
                <th className="px-4 py-3">Total Quota</th>
                <th className="px-4 py-3">
                  Remaining Quota
                </th>
                <th className="px-4 py-3">
                  Serial Number
                </th>
                <th className="px-4 py-3">
                  No. Reference EDC
                </th>
                <th className="px-4 py-3">FWC Price</th>
                <th className="px-4 py-3">Shift Date</th>
                <th className="px-4 py-3">
                  Operator Name
                </th>
                <th className="px-4 py-3">Stasiun</th>
              </tr>
            </thead>

            <tbody>
              {transactions.map((trx, i) => (
                <tr
                  key={i}
                  className="border-t hover:bg-gray-50"
                >
                  <td className="px-4 py-2">
                    {formatDate(trx.purchaseDate)}
                  </td>
                  <td className="px-4 py-2">
                    {trx.duration}
                  </td>
                  <td className="px-4 py-2">
                    {formatDate(trx.expiredDate)}
                  </td>
                  <td className="px-4 py-2">
                    <span className="rounded bg-green-100 px-2 py-1 text-xs text-green-700">
                      {trx.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    {trx.cardCategory}
                  </td>
                  <td className="px-4 py-2">
                    {trx.cardType}
                  </td>
                  <td className="px-4 py-2">
                    {trx.quota}
                  </td>
                  <td className="px-4 py-2">
                    {trx.remaining}
                  </td>
                  <td className="px-4 py-2">
                    {trx.serialNumber}
                  </td>
                  <td className="px-4 py-2">
                    {trx.referenceEdc}
                  </td>
                  <td className="px-4 py-2">
                    {trx.price}
                  </td>
                  <td className="px-4 py-2">
                    {formatDate(trx.shiftDate)}
                  </td>
                  <td className="px-4 py-2">
                    {trx.operatorName}
                  </td>
                  <td className="px-4 py-2">
                    {trx.station}
                  </td>
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
