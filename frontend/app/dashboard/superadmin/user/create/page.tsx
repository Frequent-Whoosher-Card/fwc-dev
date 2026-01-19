"use client";

import { ArrowLeft, Calendar, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/* ======================
   CONFIG
====================== */
const API_BASE_URL = "http://localhost:3001";

/* ======================
   BASE INPUT STYLE
====================== */
const base =
  "h-10 w-full rounded-md border border-gray-300 px-3 text-sm text-gray-700 focus:border-gray-400 focus:outline-none";

/* ======================
   DATE HELPER (LOCAL TODAY)
====================== */
const getTodayLocalDate = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

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
   PAGE
====================== */
export default function AddPurchasePage() {
  const router = useRouter();

  /* ======================
     CUSTOMER
  ====================== */
  const [customerName, setCustomerName] = useState("");
  const [nik, setNik] = useState("");
  const [nip, setNip] = useState("");
  const [memberId, setMemberId] = useState<string | null>(null);

  /* ======================
     CARD PRODUCT
  ====================== */
  const [cardProducts, setCardProducts] = useState<any[]>([]);
  const [cardProductId, setCardProductId] = useState("");
  const [price, setPrice] = useState("");
  const [masaBerlaku, setMasaBerlaku] = useState(0);

  /* ======================
     CARD (SERIAL)
  ====================== */
  const [cards, setCards] = useState<any[]>([]);
  const [cardId, setCardId] = useState("");

  /* ======================
     STATION
  ====================== */
  const [stations, setStations] = useState<any[]>([]);
  const [stationId, setStationId] = useState("");

  /* ======================
     PURCHASE (LOCKED DATE)
  ====================== */
  const [purchaseDate, setPurchaseDate] = useState("");
  const [expiredDate, setExpiredDate] = useState("");
  const [edcRef, setEdcRef] = useState("");

  /* ======================
     INIT LOAD
  ====================== */
  useEffect(() => {
    fetch(`${API_BASE_URL}/card-products`)
      .then((r) => r.json())
      .then((r) => setCardProducts(Array.isArray(r.data) ? r.data : []));

    fetch(`${API_BASE_URL}/stations`)
      .then((r) => r.json())
      .then((r) => setStations(r?.data?.items ?? []));

    // ✅ SET PURCHASE DATE SEKALI (ANTI HYDRATION BUG)
    setPurchaseDate(getTodayLocalDate());
  }, []);

  /* ======================
     EXPIRED DATE AUTO SYNC
     (PURCHASE DATE + MASA BERLAKU)
  ====================== */
  useEffect(() => {
    if (!purchaseDate || !masaBerlaku) {
      setExpiredDate("");
      return;
    }

    const d = new Date(purchaseDate);
    d.setDate(d.getDate() + masaBerlaku);
    setExpiredDate(d.toISOString().slice(0, 10));
  }, [purchaseDate, masaBerlaku]);

  /* ======================
     MEMBER RESOLVE
  ====================== */
  async function resolveMember(): Promise<string> {
    const res = await fetch(`${API_BASE_URL}/members?identityNumber=${nik}`);
    const json = await res.json();

    if (json?.data?.items?.length > 0) {
      const m = json.data.items[0];
      setMemberId(m.id);
      setCustomerName(m.name);
      setNip(m.nippKai || "");
      return m.id;
    }

    const create = await fetch(`${API_BASE_URL}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: customerName,
        identityNumber: nik,
        nippKai: nip || null,
      }),
    });

    const created = await create.json();
    setMemberId(created.data.id);
    return created.data.id;
  }

  /* ======================
     CARD PRODUCT CHANGE
  ====================== */
  async function handleProductChange(id: string) {
    setCardProductId(id);
    setCardId("");
    setCards([]);

    const product = cardProducts.find((p) => p.id === id);
    if (!product) return;

    setPrice(product.price);
    setMasaBerlaku(product.masaBerlaku);

    const res = await fetch(
      `${API_BASE_URL}/cards?cardProductId=${id}&status=IN_STATION`,
    );
    const json = await res.json();
    setCards(json?.data?.items ?? []);
  }

  /* ======================
     SUBMIT
  ====================== */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const resolvedMemberId = memberId ?? (await resolveMember());

    await fetch(`${API_BASE_URL}/purchases`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        memberId: resolvedMemberId,
        cardId,
        stationId,
        purchaseDate,
        edcReferenceNumber: edcRef,
        price: Number(price),
      }),
    });

    router.push("/dashboard/purchases");
  }

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
        <h1 className="text-xl font-semibold">Purchased</h1>
      </div>

      {/* FORM */}
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-lg border bg-white p-6"
      >
        <SectionCard title="Customer Information">
          <div className="md:col-span-2">
            <Field label="Customer Name" required>
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className={base}
              />
            </Field>
          </div>

          <Field label="NIK" required>
            <input
              value={nik}
              onChange={(e) =>
                setNik(e.target.value.replace(/\D/g, "").slice(0, 20))
              }
              className={base}
            />
          </Field>

          <Field label="NIP">
            <input
              value={nip}
              onChange={(e) =>
                setNip(e.target.value.replace(/\D/g, "").slice(0, 5))
              }
              className={base}
            />
          </Field>
        </SectionCard>

        <SectionCard title="Card Information">
          <Field label="Card Product" required>
            <select
              className={`${base} appearance-none pr-10`}
              value={cardProductId}
              onChange={(e) => handleProductChange(e.target.value)}
            >
              <option value="">Select Card Product</option>
              {cardProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.category.categoryName} - {p.type.typeName}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Serial Number" required>
            <select
              className={`${base} appearance-none pr-10`}
              disabled={!cardProductId}
              value={cardId}
              onChange={(e) => setCardId(e.target.value)}
            >
              <option value="">Pilih Serial Number</option>
              {cards.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.serialNumber}
                </option>
              ))}
            </select>
          </Field>
        </SectionCard>

        <SectionCard title="Purchase Information">
          <Field label="Purchased Date" required>
            <div className="relative">
              <Calendar
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />

              {/* INPUT TAMPILAN (TIDAK BISA APA-APA) */}
              <input
                type="date"
                value={purchaseDate}
                disabled
                className={`${base} pr-10 bg-gray-50 cursor-not-allowed`}
              />

              {/* INPUT ASLI UNTUK SUBMIT */}
              <input type="hidden" name="purchaseDate" value={purchaseDate} />
            </div>
          </Field>

          <Field label="Expired Date" required>
            <>
              <input
                type="date"
                value={expiredDate}
                disabled
                className={`${base} bg-gray-50 cursor-not-allowed`}
              />

              <input type="hidden" name="expiredDate" value={expiredDate} />
            </>
          </Field>

          <div className="md:col-span-2">
            <Field label="FWC Price" required>
              <input value={price} readOnly className={`${base} bg-gray-50`} />
            </Field>
          </div>
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

          <Field label="Shift Date" required>
            <input
              type="date"
              value={purchaseDate}
              readOnly
              className={`${base} bg-gray-50 cursor-not-allowed`}
            />
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
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
