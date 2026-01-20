"use client";

import SuccessModal from "@/app/dashboard/superadmin/user/components/SuccesModal";

import { getStations } from "@/lib/services/station.service";

import { ArrowLeft, Calendar, ChevronDown } from "lucide-react";
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

  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  /* ======================
     INIT LOAD
  ====================== */
  useEffect(() => {
    const token = localStorage.getItem("fwc_token");

    fetch(`${API_BASE_URL}/card/product`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((r) => r.json())
      .then((r) => {
        setCardProducts(Array.isArray(r.data) ? r.data : []);
      })
      .catch(() => setCardProducts([]));

    getStations({ page: 1, limit: 50 })
      .then((res) => setStations(res.data.items))
      .catch(() => setStations([]));

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
    const token = localStorage.getItem("fwc_token");

    if (!token) {
      throw new Error("Token tidak ditemukan");
    }

    // === CEK MEMBER ===
    const res = await fetch(`${API_BASE_URL}/members?identityNumber=${nik}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error("Gagal cek member");
    }

    const json = await res.json();

    if (json?.data?.items?.length > 0) {
      const m = json.data.items[0];
      setMemberId(m.id);
      setCustomerName(m.name);
      setNip(m.nippKai || "");
      return m.id;
    }

    // === CREATE MEMBER ===
    const create = await fetch(`${API_BASE_URL}/members`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // ✅ WAJIB
      },
      body: JSON.stringify({
        name: customerName,
        identityNumber: nik,
        nippKai: nip || null,
      }),
    });

    if (!create.ok) {
      throw new Error("Gagal membuat member");
    }

    const created = await create.json();
    setMemberId(created.data.id);
    return created.data.id;
  }

  /* ======================
   CARD PRODUCT CHANGE (FIX)
====================== */
  async function handleProductChange(id: string) {
    const token = localStorage.getItem("fwc_token");

    setCardProductId(id);
    setCardId("");
    setCards([]);

    const product = cardProducts.find((p) => p.id === id);
    if (!product) return;

    setPrice(product.price);
    setMasaBerlaku(product.masaBerlaku);

    const res = await fetch(
      `${API_BASE_URL}/cards?cardProductId=${id}&status=IN_STATION`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const json = await res.json();

    setCards(Array.isArray(json?.data?.items) ? json.data.items : []);
  }

  /* ======================
     SUBMIT
  ====================== */
  async function submitPurchase() {
    const token = localStorage.getItem("fwc_token");

    if (!token) {
      alert("Token tidak ditemukan, silakan login ulang");
      return;
    }

    // ======================
    // VALIDATION
    // ======================
    if (!customerName.trim()) return alert("Customer Name wajib diisi");
    if (!nik || nik.length < 6) return alert("NIK tidak valid");
    if (!cardProductId) return alert("Card Product wajib dipilih");
    if (!cardId) return alert("Serial Number wajib dipilih");
    if (!stationId) return alert("Stasiun wajib dipilih");
    if (!edcRef) return alert("No. Reference EDC wajib diisi");

    // ======================
    // SUBMIT
    // ======================
    const resolvedMemberId = memberId ?? (await resolveMember());

    const res = await fetch(`${API_BASE_URL}/purchases`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // ✅ INI YANG HILANG
      },
      body: JSON.stringify({
        memberId: resolvedMemberId,
        cardId,
        stationId,
        purchaseDate,
        edcReferenceNumber: edcRef,
        price: Number(price),
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      alert(err?.message || "Gagal menyimpan transaksi");
      return;
    }

    router.push("/dashboard/superadmin/transaksi");
  }

  return (
    <>
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
        <div className="space-y-4 rounded-lg border bg-white p-6">
          <SectionCard title="Customer Information">
            <div className="md:col-span-2">
              <Field label="Customer Name" required>
                <input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Masukkan nama lengkap customer"
                  className={base}
                />
                <p className="text-[11px] text-gray-400">
                  Nama sesuai identitas resmi
                </p>
              </Field>
            </div>

            <Field label="NIK" required>
              <input
                value={nik}
                onChange={(e) =>
                  setNik(e.target.value.replace(/\D/g, "").slice(0, 20))
                }
                placeholder="Identity Number (max 20 digit)"
                className={base}
              />
            </Field>

            <Field label="NIP">
              <input
                value={nip}
                onChange={(e) =>
                  setNip(e.target.value.replace(/\D/g, "").slice(0, 5))
                }
                placeholder="Nomor Induk Pegawai (KAI)"
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
                    {p.category?.categoryName} - {p.type?.typeName}
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
              <input
                type="date"
                value={purchaseDate}
                disabled
                className={`${base} bg-gray-50 cursor-not-allowed`}
              />
            </Field>

            <Field label="Expired Date" required>
              <input
                type="date"
                value={expiredDate}
                disabled
                className={`${base} bg-gray-50 cursor-not-allowed`}
              />
            </Field>

            <div className="md:col-span-2">
              <Field label="FWC Price" required>
                <input
                  value={price}
                  readOnly
                  className={`${base} bg-gray-50`}
                />
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
              onChange={(e) =>
                setEdcRef(e.target.value.replace(/\D/g, "").slice(0, 20))
              }
              placeholder="Masukkan nomor referensi EDC"
              className={base}
            />
          </Field>

          {/* ACTION */}
          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={() => setShowConfirm(true)}
              className="rounded-md bg-[#8B1538] px-8 py-2 text-sm font-medium text-white
              hover:bg-[#73122E]"
            >
              Save
            </button>
          </div>
        </div>
      </div>

      {/* ===== CONFIRM MODAL ===== */}
      <SuccessModal
        open={showConfirm}
        title="Confirm Save"
        message="Please review transaction data before saving"
        confirmText={saving ? "Saving..." : "Save"}
        onClose={() => setShowConfirm(false)}
        onConfirm={async () => {
          setSaving(true);
          setShowConfirm(false); // ✅ TUTUP MODAL DULU
          await submitPurchase();
          setSaving(false);
        }}
      />
    </>
  );
}
