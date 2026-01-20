"use client";

import { ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/* ======================
   CONFIG
====================== */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

/* ======================
   BASE INPUT STYLE
====================== */
const base =
  "h-10 w-full rounded-md border border-gray-300 px-3 text-sm text-gray-700 focus:border-gray-400 focus:outline-none";

/* ======================
   DATE HELPER
====================== */
const formatDate = (iso?: string | null) => (iso ? iso.slice(0, 10) : "");

/* ======================
   FIELD WRAPPER
====================== */
function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-500">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

/* ======================
   SECTION CARD
====================== */
function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-gray-200 p-4">
      <h3 className="mb-4 text-sm font-semibold text-gray-700">{title}</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>
    </div>
  );
}

/* ======================
   PAGE (EDIT)
====================== */
export default function EditTransactionPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  /* ======================
     STATE
  ====================== */
  const [customerName, setCustomerName] = useState("");
  const [nik, setNik] = useState("");
  const [nip, setNip] = useState("");
  const [memberId, setMemberId] = useState<string | null>(null);

  const [stations, setStations] = useState<any[]>([]);
  const [stationId, setStationId] = useState("");

  const [purchaseDate, setPurchaseDate] = useState("");
  const [expiredDate, setExpiredDate] = useState("");
  const [price, setPrice] = useState("");
  const [edcRef, setEdcRef] = useState("");

  const [loading, setLoading] = useState(true);

  /* ======================
     INIT LOAD (SAFE)
  ====================== */
  useEffect(() => {
    async function init() {
      try {
        const [purchaseRes, stationRes] = await Promise.all([
          fetch(`${API_BASE_URL}/purchases/${id}`).then((r) => r.json()),
          fetch(`${API_BASE_URL}/stations`).then((r) => r.json()),
        ]);

        const p = purchaseRes?.data;
        if (!p) throw new Error("Purchase data not found");

        setCustomerName(p.member?.name ?? "");
        setNik(p.member?.identityNumber ?? "");
        setNip(p.member?.nippKai ?? "");
        setMemberId(p.member?.id ?? null);

        setStations(stationRes?.data?.items ?? []);
        setStationId(p.station?.id ?? "");

        setPurchaseDate(formatDate(p.purchaseDate));
        setExpiredDate(formatDate(p.card?.expiredDate));
        setPrice(String(p.price ?? ""));
        setEdcRef(p.edcReferenceNumber ?? "");
      } catch (err) {
        console.error("INIT EDIT ERROR:", err);
        alert("Gagal memuat data transaksi");
      } finally {
        setLoading(false); // 🔥 PENTING
      }
    }

    if (id) init();
  }, [id]);

  /* ======================
     SUBMIT (UPDATE)
  ====================== */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      await fetch(`${API_BASE_URL}/purchases/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId,
          stationId,
          purchaseDate,
          edcReferenceNumber: edcRef,
          price: Number(price),
        }),
      });

      router.push("/dashboard/superadmin/transaksi");
    } catch (err) {
      console.error("UPDATE FAILED:", err);
      alert("Gagal update transaksi");
    }
  }

  /* ======================
     LOADING
  ====================== */
  if (loading) {
    return <div className="p-6 text-gray-500">Loading...</div>;
  }

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
        <h1 className="text-xl font-semibold">Edit Transaction</h1>
      </div>

      {/* FORM */}
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-lg border bg-white p-6"
      >
        <SectionCard title="Customer Information">
          <div className="md:col-span-2">
            <Field label="Customer Name">
              <input
                value={customerName}
                disabled
                className={`${base} bg-gray-50`}
              />
            </Field>
          </div>

          <Field label="NIK">
            <input value={nik} disabled className={`${base} bg-gray-50`} />
          </Field>

          <Field label="NIP">
            <input value={nip} disabled className={`${base} bg-gray-50`} />
          </Field>
        </SectionCard>

        <SectionCard title="Purchase Information">
          <Field label="Purchased Date">
            <input
              type="date"
              value={purchaseDate}
              disabled
              className={`${base} bg-gray-50`}
            />
          </Field>

          <Field label="Expired Date">
            <input
              type="date"
              value={expiredDate}
              disabled
              className={`${base} bg-gray-50`}
            />
          </Field>

          <Field label="FWC Price">
            <input value={price} readOnly className={`${base} bg-gray-50`} />
          </Field>
        </SectionCard>

        <SectionCard title="Operational Information">
          <Field label="Stasiun" required>
            <select
              className={base}
              value={stationId}
              onChange={(e) => setStationId(e.target.value)}
            >
              <option value="">Select</option>
              {stations.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.stationName}
                </option>
              ))}
            </select>
          </Field>
        </SectionCard>

        <Field label="No. Reference EDC" required>
          <input
            value={edcRef}
            onChange={(e) => setEdcRef(e.target.value)}
            className={base}
          />
        </Field>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            className="rounded-md bg-[#8B1538] px-8 py-2 text-sm font-medium text-white hover:bg-[#73122E]"
          >
            Update
          </button>
        </div>
      </form>
    </div>
  );
}