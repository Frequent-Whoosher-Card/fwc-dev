"use client";

import { useEffect, useState, useContext } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getMemberById } from "@/lib/services/membership.service";
import { getPurchases } from "@/lib/services/purchase.service";
import { UserContext } from "@/app/dashboard/superadmin/dashboard/dashboard-layout";

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
  status: "Active" | "Expired" | "-";
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
          const masaBerlaku = p.card?.cardProduct?.masaBerlaku ?? 0;

          // ✅ EXPIRED DATE = purchaseDate + masaBerlaku
          const expiredDate =
            purchaseDate && masaBerlaku
              ? new Date(
                  new Date(purchaseDate).getTime() +
                    masaBerlaku * 24 * 60 * 60 * 1000
                ).toISOString()
              : "";

          const duration = masaBerlaku ? `${masaBerlaku} Days` : "-";

          const price =
            typeof p.price === "number" ? p.price.toLocaleString("id-ID") : "-";

          const totalQuota = p.card?.cardProduct?.totalQuota ?? 0;

          return {
            purchaseDate,
            expiredDate,
            duration,

            status:
              p.card?.status === "SOLD_ACTIVE"
                ? "Active"
                : p.card?.status === "SOLD_EXPIRED"
                ? "Expired"
                : "-",

            cardCategory: p.card?.cardProduct?.category?.categoryName ?? "-",

            cardType: p.card?.cardProduct?.type?.typeName ?? "-",

            // ✅ dari cardProduct
            quota: totalQuota,

            // ⚠️ BE belum supply remaining → sementara
            remaining: totalQuota,

            serialNumber: p.card?.serialNumber ?? "-",

            referenceEdc: p.edcReferenceNumber ?? "-",

            price,

            // ✅ shift date = tanggal transaksi
            shiftDate: purchaseDate,

            operatorName: p.operator?.fullName ?? p.createdByName ?? "-",

            station: p.station?.stationName ?? "-",
          };
        });

        setTransactions(mapped);
      } catch (err: any) {
        setError(err.message || "Failed to load data");
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
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!member) return <div className="p-6 text-gray-500">Data not found</div>;

  const totalQuota = transactions.reduce((sum, t) => sum + t.quota, 0);

  const redeemed = transactions.reduce(
    (sum, t) => sum + (t.quota - t.remaining),
    0
  );

  const formatDate = (d: string) =>
    d ? new Date(d).toLocaleDateString("id-ID") : "-";

  const capitalize = (value?: string) => {
    if (!value) return "-";
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  };

  const genderLabel =
    member.gender === "L"
      ? "Laki - Laki"
      : member.gender === "P"
      ? "Perempuan"
      : "-";

  const activeTransaction =
    transactions.find((t) => t.status === "Active") ?? transactions[0];

  const CARD_COLOR_MAP: Record<string, string> = {
    Silver: "bg-gray-200 text-gray-800",
    Gold: "bg-yellow-400 text-gray-900",
    KAI: "bg-green-500 text-white",
  };

  const cardBg =
    CARD_COLOR_MAP[activeTransaction?.cardCategory ?? ""] ??
    "bg-blue-400 text-white";

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
        <h1 className="text-lg font-semibold">Detailed Member</h1>
      </div>

      {/* MEMBER CARD */}
      <div className="flex items-start justify-between rounded-lg border bg-white p-6">
        <div className="flex gap-6">
          {/* CARD BADGE */}
          {activeTransaction ? (
            <div
              className={`flex h-24 w-40 flex-col items-center justify-center rounded text-center ${cardBg}`}
            >
              <span className="text-base font-semibold">
                {capitalize(activeTransaction.cardType)}
              </span>
              <span className="text-xs font-normal">
                {capitalize(activeTransaction.cardCategory)}
              </span>
            </div>
          ) : (
            <div className="flex h-24 w-40 items-center justify-center rounded bg-gray-100 text-sm text-gray-500">
              No Card
            </div>
          )}

          {/* MEMBER INFO */}
          <div className="space-y-2 text-sm">
            <p className="text-base font-semibold">{member.name}</p>

            <div className="grid grid-cols-[140px_1fr] gap-y-1">
              <span className="text-gray-500">Identity Number</span>
              <span>: {member.identityNumber}</span>

              <span className="text-gray-500">Gender</span>
              <span>: {genderLabel}</span>

              <span className="text-gray-500">Email</span>
              <span>: {member.email ?? "-"}</span>

              <span className="text-gray-500">Phone</span>
              <span>: {member.phone ?? "-"}</span>

              <span className="text-gray-500">Membership Date</span>
              <span>: {formatDate(member.createdAt)}</span>

              <span className="text-gray-500">Operator</span>
              <span>: {userCtx?.userName ?? member.updatedByName ?? "-"}</span>
            </div>
          </div>
        </div>

        {/* SUMMARY */}
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
          <table className="min-w-[2400px] w-full text-sm leading-relaxed">
            <thead className="bg-gray-50 text-xs text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left">Purchase Date</th>
                <th className="px-4 py-3 text-left">Masa Berlaku</th>
                <th className="px-4 py-3 text-left">Expired Date</th>
                <th className="px-4 py-3 text-center">Status Card</th>
                <th className="px-4 py-3 text-left">Card Category</th>
                <th className="px-4 py-3 text-left">Card Type</th>
                <th className="px-4 py-3 text-right">Total Quota</th>
                <th className="px-4 py-3 text-right">Remaining Quota</th>
                <th className="px-4 py-3 text-left">Serial Number</th>
                <th className="px-4 py-3 text-left">No. Reference EDC</th>
                <th className="px-4 py-3 text-right">FWC Price</th>
                <th className="px-4 py-3 text-left">Shift Date</th>
                <th className="px-4 py-3 text-left">Operator Name</th>
                <th className="px-4 py-3 text-left">Stasiun</th>
              </tr>
            </thead>

            <tbody>
              {transactions.map((trx, i) => (
                <tr key={i} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2 text-left">
                    {formatDate(trx.purchaseDate)}
                  </td>

                  <td className="px-4 py-2 text-left">{trx.duration}</td>

                  <td className="px-4 py-2 text-left">
                    {formatDate(trx.expiredDate)}
                  </td>

                  {/* STATUS */}
                  <td className="px-4 py-2 text-center">
                    <span
                      className={`inline-flex min-w-[72px] justify-center rounded px-2 py-1 text-xs font-medium
            ${
              trx.status === "Active"
                ? "bg-green-100 text-green-700"
                : trx.status === "Expired"
                ? "bg-red-100 text-red-700"
                : "bg-gray-100 text-gray-600"
            }`}
                    >
                      {trx.status}
                    </span>
                  </td>

                  <td className="px-4 py-2 text-left">{trx.cardCategory}</td>

                  <td className="px-4 py-2 text-left">{trx.cardType}</td>

                  <td className="px-4 py-2 text-center font-semibold">
                    {trx.quota}
                  </td>

                  <td className="px-4 py-2 text-center font-semibold">
                    {trx.remaining}
                  </td>

                  <td className="px-4 py-2 text-left">{trx.serialNumber}</td>

                  <td className="px-4 py-2 text-left">{trx.referenceEdc}</td>

                  <td className="px-4 py-2 text-right">{trx.price}</td>

                  <td className="px-4 py-2 text-left">
                    {formatDate(trx.shiftDate)}
                  </td>

                  <td className="px-4 py-2 text-left">{trx.operatorName}</td>

                  <td className="px-4 py-2 text-left">{trx.station}</td>
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
