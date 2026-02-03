"use client";

import { useEffect, useState, useContext, Fragment } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";

import { getMemberById } from "@/lib/services/membership.service";
import { getPurchases } from "@/lib/services/purchase.service";
import { UserContext } from "@/app/dashboard/superadmin/dashboard/dashboard-layout";
import { getEmployeeTypes } from "@/lib/services/employee-type.service";

/* ======================
   TYPES
====================== */
interface Membership {
  id: string;
  name: string;
  identityNumber: string;
  nippKai?: string | null;
  employeeTypeId?: string | null;
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

interface BulkCardItem {
  serialNumber: string;
  categoryName: string;
  typeName: string;
  totalQuota: number;
  remaining: number;
  price: string;
  status: string;
}

interface Transaction {
  id: string;
  programType: "FWC" | "VOUCHER" | null;
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
  bulkCount?: number;
  bulkItems?: BulkCardItem[];
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
  const [employeeTypeName, setEmployeeTypeName] = useState<string>("-");
  const [viewFilter, setViewFilter] = useState<"all" | "FWC" | "VOUCHER">("all");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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

        // Resolve employee type name if exists
        if (memberData.employeeTypeId) {
          try {
            const employeeTypesRes = await getEmployeeTypes();
            const employeeType = employeeTypesRes.data?.find(
              (type) => type.id === memberData.employeeTypeId,
            );
            setEmployeeTypeName(employeeType?.name || "-");
          } catch (err) {
            console.error("Failed to load employee type:", err);
          }
        }

        // 2️⃣ GET PURCHASES BY NIK
        const purchaseRes = await getPurchases({
          search: memberData.identityNumber,
          limit: 50,
        });

        const items = purchaseRes.data?.items ?? [];

        const mapped: Transaction[] = items.map((p: any) => {
          const programType = p.programType ?? "FWC";
          const isVoucher = programType === "VOUCHER";
          const bulkItems = p.bulkPurchaseItems ?? [];
          const hasBulk = isVoucher && bulkItems.length > 0;

          const purchaseDate = p.purchaseDate;
          const firstCard = p.card ?? bulkItems[0]?.card;
          const masaBerlaku = firstCard?.cardProduct?.masaBerlaku ?? 0;

          const expiredDate =
            purchaseDate && masaBerlaku
              ? new Date(
                  new Date(purchaseDate).getTime() +
                    masaBerlaku * 24 * 60 * 60 * 1000,
                ).toISOString()
              : "";

          const duration = masaBerlaku ? `${masaBerlaku} Days` : "-";

          const price =
            typeof p.price === "number" ? p.price.toLocaleString("id-ID") : "-";

          let totalQuota = p.card?.cardProduct?.totalQuota ?? 0;
          let remainingQuota = p.card?.quotaTicket ?? 0;
          if (hasBulk) {
            totalQuota = bulkItems.reduce(
              (s: number, b: any) => s + (b.card?.cardProduct?.totalQuota ?? 0),
              0,
            );
            remainingQuota = bulkItems.reduce(
              (s: number, b: any) => s + (b.card?.quotaTicket ?? 0),
              0,
            );
          }

          let status: "Active" | "Expired" | "-" = "-";
          if (p.card) {
            status =
              p.card.status === "SOLD_ACTIVE"
                ? "Active"
                : p.card.status === "SOLD_EXPIRED"
                  ? "Expired"
                  : "-";
          } else if (hasBulk) {
            const anyActive = bulkItems.some(
              (b: any) => b.card?.status === "SOLD_ACTIVE",
            );
            const anyExpired = bulkItems.some(
              (b: any) => b.card?.status === "SOLD_EXPIRED",
            );
            if (anyActive) status = "Active";
            else if (anyExpired) status = "Expired";
          }

          const cardCategory = hasBulk
            ? bulkItems[0]?.card?.cardProduct?.category?.categoryName ?? "-"
            : p.card?.cardProduct?.category?.categoryName ?? "-";
          const cardType = hasBulk
            ? bulkItems[0]?.card?.cardProduct?.type?.typeName ?? "-"
            : p.card?.cardProduct?.type?.typeName ?? "-";

          const serialNumber = hasBulk
            ? bulkItems.length > 1
              ? `${bulkItems.length} items`
              : bulkItems[0]?.card?.serialNumber ?? "-"
            : p.card?.serialNumber ?? "-";

          const bulkItemsMapped: BulkCardItem[] = hasBulk
            ? bulkItems.map((b: any) => ({
                serialNumber: b.card?.serialNumber ?? "-",
                categoryName:
                  b.card?.cardProduct?.category?.categoryName ?? "-",
                typeName: b.card?.cardProduct?.type?.typeName ?? "-",
                totalQuota: b.card?.cardProduct?.totalQuota ?? 0,
                remaining: b.card?.quotaTicket ?? 0,
                price:
                  typeof b.price === "number"
                    ? b.price.toLocaleString("id-ID")
                    : "-",
                status:
                  b.card?.status === "SOLD_ACTIVE"
                    ? "Active"
                    : b.card?.status === "SOLD_EXPIRED"
                      ? "Expired"
                      : "-",
              }))
            : [];

          return {
            id: p.id,
            programType,
            purchaseDate,
            expiredDate,
            duration,
            status,
            cardCategory,
            cardType,
            quota: totalQuota,
            remaining: remainingQuota,
            serialNumber,
            referenceEdc: p.edcReferenceNumber ?? "-",
            price,
            shiftDate: purchaseDate,
            operatorName: p.operator?.fullName ?? p.createdByName ?? "-",
            station: p.station?.stationName ?? "-",
            bulkCount: hasBulk ? bulkItems.length : undefined,
            bulkItems: bulkItemsMapped.length > 0 ? bulkItemsMapped : undefined,
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

  const filteredTransactions =
    viewFilter === "all"
      ? transactions
      : transactions.filter((t) => t.programType === viewFilter);

  const totalQuota = filteredTransactions.reduce((sum, t) => sum + t.quota, 0);

  const redeemed = filteredTransactions.reduce(
    (sum, t) => sum + (t.quota - t.remaining),
    0,
  );

  const formatDate = (d?: string) => {
    if (!d) return "-";

    const date = new Date(d);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  };

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
    filteredTransactions.find((t) => t.status === "Active") ??
    filteredTransactions[0];

  const CARD_COLOR_MAP: Record<string, string> = {
    Silver: "bg-gray-200 text-gray-800",
    Gold: "bg-yellow-400 text-gray-900",
    KAI: "bg-green-500 text-white",
  };

  const isVoucherView = viewFilter === "VOUCHER";
  const cardBg = isVoucherView
    ? "bg-teal-600 text-white"
    : CARD_COLOR_MAP[activeTransaction?.cardCategory ?? ""] ??
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
              {isVoucherView ? (
                <>
                  <span className="text-base font-semibold">Voucher</span>
                  <span className="text-xs font-normal">
                    {capitalize(activeTransaction.cardCategory)} -{" "}
                    {capitalize(activeTransaction.cardType)}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-base font-semibold">
                    {capitalize(activeTransaction.cardType)}
                  </span>
                  <span className="text-xs font-normal">
                    {capitalize(activeTransaction.cardCategory)}
                  </span>
                </>
              )}
            </div>
          ) : (
            <div className="flex h-24 w-40 items-center justify-center rounded bg-gray-100 text-sm text-gray-500">
              {viewFilter === "all" && transactions.length === 0
                ? "No Card"
                : viewFilter === "FWC"
                  ? "No FWC"
                  : viewFilter === "VOUCHER"
                    ? "No Voucher"
                    : "No Card"}
            </div>
          )}

          {/* MEMBER INFO */}
          <div className="space-y-2 text-sm">
            <p className="text-base font-semibold">{member.name}</p>

            <div className="grid grid-cols-[140px_1fr] gap-y-1">
              <span className="text-gray-500">Identity Number</span>
              <span>: {member.identityNumber}</span>

              {/* ✅ NIP / NIPP KAI — hanya tampil jika ada */}
              {member.nippKai && (
                <>
                  <span className="text-gray-500">NIP / NIPP KAI</span>
                  <span>: {member.nippKai}</span>
                </>
              )}

              <span className="text-gray-500">Employee Type</span>
              <span>: {employeeTypeName}</span>

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
        <div className="text-right text-sm">
          {viewFilter !== "VOUCHER" && (
            <>
              <p>
                Total Quota (Trips): <b>{totalQuota}</b>
              </p>
              <p>
                Redeemed: <b>{redeemed}</b>
              </p>
            </>
          )}
          {viewFilter === "VOUCHER" && (
            <p>
              Total Voucher: <b>{filteredTransactions.length}</b> transaksi
            </p>
          )}
          {viewFilter === "all" && (
            <p className="text-gray-500">
              FWC: {transactions.filter((t) => t.programType === "FWC").length} | Voucher:{" "}
              {transactions.filter((t) => t.programType === "VOUCHER").length}
            </p>
          )}
        </div>
      </div>

      {/* TRANSACTION HISTORY */}
      <div className="rounded-lg border bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
          <span className="font-semibold">Transaction History</span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Tampilkan:</span>
            <select
              value={viewFilter}
              onChange={(e) =>
                setViewFilter(e.target.value as "all" | "FWC" | "VOUCHER")
              }
              className="h-8 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:border-[#8D1231] focus:outline-none focus:ring-1 focus:ring-[#8D1231]"
            >
              <option value="all">Semua</option>
              <option value="FWC">FWC</option>
              <option value="VOUCHER">Voucher</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[2400px] w-full table-fixed text-sm leading-relaxed">
            <thead className="bg-gray-50 text-xs text-gray-600">
              <tr>
                <th className="w-10 px-2 py-3"></th>
                <th className="px-4 py-3 text-left w-[140px]">Purchase Date</th>
                <th className="px-4 py-3 text-left">Masa Berlaku</th>
                <th className="px-4 py-3 text-left">Expired Date</th>
                <th className="px-4 py-3 text-center w-[110px]">Status Card</th>
                <th className="px-4 py-3 text-left">Card Category</th>
                <th className="px-4 py-3 text-left">
                  {isVoucherView ? "Class" : "Card Type"}
                </th>
                <th className="px-4 py-3 text-right">Total Quota</th>
                <th className="px-4 py-3 text-right">Remaining Quota</th>
                <th className="px-4 py-3 text-left">Serial Number</th>
                <th className="px-4 py-3 text-left">No. Reference EDC</th>
                <th className="px-4 py-3 text-right w-[120px]">
                  {isVoucherView ? "Harga" : "FWC Price"}
                </th>
                <th className="px-4 py-3 text-left">Shift Date</th>
                <th className="px-4 py-3 text-left">Operator Name</th>
                <th className="px-4 py-3 text-left">Stasiun</th>
              </tr>
            </thead>

            <tbody>
              {filteredTransactions.map((trx, i) => {
                const isVoucherBulk =
                  trx.programType === "VOUCHER" &&
                  trx.bulkItems &&
                  trx.bulkItems.length > 0;
                const isExpanded = expandedRows.has(trx.id);
                const quantity = trx.bulkItems?.length ?? 0;

                return (
                  <Fragment key={trx.id ?? i}>
                    <tr className="border-t hover:bg-gray-50">
                      <td className="w-10 px-2 py-3 text-center">
                        {isVoucherBulk ? (
                          <button
                            type="button"
                            onClick={() => toggleExpanded(trx.id)}
                            className="text-gray-500 hover:text-gray-700"
                            title={
                              isExpanded ? "Tutup" : "Lihat semua kartu voucher"
                            }
                          >
                            {isExpanded ? (
                              <ChevronUp size={18} />
                            ) : (
                              <ChevronDown size={18} />
                            )}
                          </button>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-left">
                        {formatDate(trx.purchaseDate)}
                      </td>

                      <td className="px-4 py-3 text-left">{trx.duration}</td>

                      <td className="px-4 py-3 text-left">
                        {formatDate(trx.expiredDate)}
                      </td>

                      <td className="px-4 py-3 text-center">
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

                      <td className="px-4 py-3 text-left">{trx.cardCategory}</td>
                      <td className="px-4 py-3 text-left">{trx.cardType}</td>

                      <td className="px-4 py-3 text-right font-semibold">
                        {trx.quota}
                      </td>

                      <td className="px-4 py-3 text-right font-semibold">
                        {trx.remaining}
                      </td>

                      <td className="px-4 py-3 text-left">{trx.serialNumber}</td>
                      <td className="px-4 py-3 text-left">{trx.referenceEdc}</td>

                      <td className="px-4 py-3 text-right">{trx.price}</td>

                      <td className="px-4 py-3 text-left">
                        {formatDate(trx.shiftDate)}
                      </td>

                      <td className="px-4 py-3 text-left">{trx.operatorName}</td>
                      <td className="px-4 py-3 text-left">{trx.station}</td>
                    </tr>

                    {/* Expanded: daftar semua kartu voucher dengan kuota (sama seperti di transaksi) */}
                    {isVoucherBulk && isExpanded && trx.bulkItems && (
                      <tr className="bg-gray-50">
                        <td colSpan={15} className="px-4 py-3">
                          <div className="space-y-2">
                            <div className="mb-2 text-xs font-semibold text-gray-600">
                              Voucher Items ({quantity}):
                            </div>
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                              {trx.bulkItems.map((card, idx) => (
                                <div
                                  key={idx}
                                  className="rounded border border-gray-200 bg-white p-3 text-xs"
                                >
                                  <div className="font-mono font-medium">
                                    {idx + 1}. {card.serialNumber}
                                  </div>
                                  <div className="mt-1 text-gray-600">
                                    {card.categoryName} - {card.typeName}
                                  </div>
                                  <div className="mt-2 flex justify-between text-gray-700">
                                    <span>Kuota:</span>
                                    <span className="font-medium">
                                      {card.remaining} / {card.totalQuota}
                                    </span>
                                  </div>
                                  <div className="mt-1 flex items-center justify-between">
                                    <span className="text-gray-500">Status</span>
                                    <span
                                      className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                                        card.status === "Active"
                                          ? "bg-green-100 text-green-700"
                                          : card.status === "Expired"
                                            ? "bg-red-100 text-red-700"
                                            : "bg-gray-100 text-gray-600"
                                      }`}
                                    >
                                      {card.status}
                                    </span>
                                  </div>
                                  <div className="mt-1 font-medium text-[#8D1231]">
                                    Rp {card.price}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
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
