"use client";

import SuccessModal from "@/app/dashboard/superadmin/user/components/SuccesModal";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/* ======================
   CONFIG
====================== */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

/* ======================
   BASE INPUT STYLE
====================== */
const base =
  "h-10 w-full rounded-md border border-gray-300 px-3 text-sm text-gray-700 focus:border-gray-400 focus:outline-none";

/* ======================
   DATE HELPER
====================== */
const getTodayLocalDate = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

/* ======================
   UI HELPERS
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
     CORE STATE
  ====================== */
  const [identityNumber, setIdentityNumber] = useState("");
  const [memberId, setMemberId] = useState<string | null>(null);

  const [cardCategory, setCardCategory] = useState<
    "GOLD" | "SILVER" | "KAI" | ""
  >("");

  const [cardTypes, setCardTypes] = useState<any[]>([]);
  const [cardTypeId, setCardTypeId] = useState("");

  const [cards, setCards] = useState<any[]>([]);
  const [cardId, setCardId] = useState("");

  const [price, setPrice] = useState<number>(0);
  const [purchaseDate, setPurchaseDate] = useState("");
  const [shiftDate, setShiftDate] = useState("");

  const [edcRef, setEdcRef] = useState("");

  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  /* ======================
     INIT
  ====================== */
  useEffect(() => {
    const today = getTodayLocalDate();
    setPurchaseDate(today);
    setShiftDate(today);
  }, []);

  /* ======================
     CARD CATEGORY CHANGE
  ====================== */
  async function handleCategoryChange(
    category: "GOLD" | "SILVER" | "KAI",
  ) {
    const token = localStorage.getItem("fwc_token");

    setCardCategory(category);
    setCardTypeId("");
    setCardId("");
    setCards([]);

    // ✅ PRICE BY CATEGORY (BRD)
    if (category === "GOLD") setPrice(500000);
    if (category === "SILVER") setPrice(300000);
    if (category === "KAI") setPrice(0);

    const res = await fetch(`${API_BASE_URL}/card/types`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const json = await res.json();
    setCardTypes(json.data || []);
  }

  /* ======================
     CARD TYPE CHANGE
  ====================== */
  async function handleTypeChange(typeId: string) {
    const token = localStorage.getItem("fwc_token");

    setCardTypeId(typeId);
    setCardId("");

    const res = await fetch(
      `${API_BASE_URL}/cards?cardTypeId=${typeId}&status=IN_STATION`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    const json = await res.json();
    setCards(json.data?.items || []);
  }

  /* ======================
     MEMBER RESOLVE
  ====================== */
  async function resolveMember(): Promise<string> {
    const token = localStorage.getItem("fwc_token");

    const res = await fetch(
      `${API_BASE_URL}/members?identityNumber=${identityNumber}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    const json = await res.json();
    if (json.data?.items?.length) {
      return json.data.items[0].id;
    }

    const create = await fetch(`${API_BASE_URL}/members`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        identityNumber,
        type: cardCategory === "KAI" ? "KAI" : "PUBLIC",
      }),
    });

    const created = await create.json();
    return created.data.id;
  }

  /* ======================
     SUBMIT
  ====================== */
  async function submitPurchase() {
    const token = localStorage.getItem("fwc_token");
    if (!token) return alert("Unauthorized");

    if (!identityNumber) return alert("Identity Number wajib");
    if (!cardCategory) return alert("Card Category wajib");
    if (!cardTypeId) return alert("Card Type wajib");
    if (!cardId) return alert("Serial Number wajib");
    if (!edcRef) return alert("No. Reference EDC wajib");

    const resolvedMemberId = memberId ?? (await resolveMember());

    const res = await fetch(`${API_BASE_URL}/purchases`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        memberId: resolvedMemberId,
        cardId,
        purchaseDate,
        shiftDate,
        edcReferenceNumber: edcRef,
        price,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      return alert(err?.message || "Gagal menyimpan transaksi");
    }

    router.push("/dashboard/superadmin/transaksi");
  }

  /* ======================
     RENDER
  ====================== */
  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="rounded p-1 hover:bg-gray-100"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-semibold">Add Purchase</h1>
        </div>

        <div className="space-y-4 rounded-lg border bg-white p-6">
          <SectionCard title="Customer">
            <Field label="Identity Number" required>
              <input
                className={base}
                value={identityNumber}
                onChange={(e) =>
                  setIdentityNumber(e.target.value.replace(/\D/g, ""))
                }
                placeholder={
                  cardCategory === "KAI" ? "NIPP KAI" : "NIK Customer"
                }
              />
            </Field>
          </SectionCard>

          <SectionCard title="Card">
            <Field label="Card Category" required>
              <select
                className={base}
                value={cardCategory}
                onChange={(e) =>
                  handleCategoryChange(e.target.value as any)
                }
              >
                <option value="">Select</option>
                <option value="GOLD">Gold</option>
                <option value="SILVER">Silver</option>
                <option value="KAI">KAI</option>
              </select>
            </Field>

            <Field label="Card Type" required>
              <select
                className={base}
                value={cardTypeId}
                onChange={(e) => handleTypeChange(e.target.value)}
                disabled={!cardCategory}
              >
                <option value="">Select</option>
                {cardTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.typeName}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Serial Number" required>
              <select
                className={base}
                value={cardId}
                onChange={(e) => setCardId(e.target.value)}
                disabled={!cardTypeId}
              >
                <option value="">Select</option>
                {cards.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.serialNumber}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="FWC Price">
              <input
                className={`${base} bg-gray-50`}
                readOnly
                value={price}
              />
            </Field>
          </SectionCard>

          <SectionCard title="System Info">
            <Field label="Purchase Date">
              <input
                className={`${base} bg-gray-50`}
                readOnly
                value={purchaseDate}
              />
            </Field>

            <Field label="Shift Date">
              <input
                className={`${base} bg-gray-50`}
                readOnly
                value={shiftDate}
              />
            </Field>
          </SectionCard>

          <Field label="No. Reference EDC" required>
            <input
              className={base}
              value={edcRef}
              onChange={(e) =>
                setEdcRef(e.target.value.replace(/\D/g, "").slice(0, 20))
              }
            />
          </Field>

          <div className="flex justify-end pt-4">
            <button
              onClick={() => setShowConfirm(true)}
              className="rounded-md bg-[#8B1538] px-8 py-2 text-sm font-medium text-white"
            >
              Save
            </button>
          </div>
        </div>
      </div>

      <SuccessModal
        open={showConfirm}
        title="Confirm Save"
        message="Please review transaction data before saving"
        confirmText={saving ? "Saving..." : "Save"}
        onClose={() => setShowConfirm(false)}
        onConfirm={async () => {
          setSaving(true);
          setShowConfirm(false);
          await submitPurchase();
          setSaving(false);
        }}
      />
    </>
  );
}
