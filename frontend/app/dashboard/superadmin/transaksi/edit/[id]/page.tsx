"use client";

import { ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "@/lib/axios";

/* ======================
   STYLE
====================== */
const base =
  "h-10 w-full rounded-md border border-gray-300 px-3 text-sm text-gray-700 focus:border-gray-400 focus:outline-none";

/* ======================
   HELPERS
====================== */
const formatDate = (iso?: string | null) =>
  iso ? iso.slice(0, 10) : "Tidak tersedia";

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);

/* ======================
   UI HELPERS
====================== */
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-600">{label}</label>
      {children}
    </div>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        {description && (
          <p className="mt-1 text-xs text-gray-500">{description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>
    </div>
  );
}

/* ======================
   PAGE
====================== */
export default function EditTransactionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  /* ======================
     STATE
  ====================== */
  const [loading, setLoading] = useState(true);

  // customer (editable)
  const [customerName, setCustomerName] = useState("");
  const [identityNumber, setIdentityNumber] = useState("");
  const [nip, setNip] = useState("");
  const [memberType, setMemberType] = useState("");

  // card (dropdown)
  const [categories, setCategories] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [cards, setCards] = useState<any[]>([]);

  const [categoryId, setCategoryId] = useState<string>();
  const [typeId, setTypeId] = useState<string>();
  const [cardId, setCardId] = useState<string>();

  const [categoryName, setCategoryName] = useState("");
  const [typeName, setTypeName] = useState("");
  const [serialNumber, setSerialNumber] = useState("");

  // otomatis
  const [price, setPrice] = useState(0);
  const [purchaseDate, setPurchaseDate] = useState("");
  const [shiftDate, setShiftDate] = useState("");
  const [operatorName, setOperatorName] = useState("");
  const [stationName, setStationName] = useState("");
  const [updatedBy, setUpdatedBy] = useState("");

  // editable transaksi
  const [edcRef, setEdcRef] = useState("");
  const [note, setNote] = useState("");

  /* ======================
     INIT LOAD
  ====================== */
  useEffect(() => {
    async function init() {
      try {
        const [trx, cat] = await Promise.all([
          axios.get(`/purchases/${id}`),
          axios.get("/card/category/"),
        ]);

        const p = trx.data?.data;
        if (!p) throw new Error("Data tidak ditemukan");

        // customer
        setCustomerName(p.member?.name ?? "");
        setIdentityNumber(p.member?.identityNumber ?? "");
        setMemberType(p.member?.type ?? "");
        setNip(p.member?.nippKai ?? "");

        // card
        setCategoryName(p.card?.cardProduct?.category?.categoryName ?? "");
        setTypeName(p.card?.cardProduct?.type?.typeName ?? "");
        setSerialNumber(p.card?.serialNumber ?? "");

        // otomatis
        setPrice(p.price ?? 0);
        setPurchaseDate(formatDate(p.purchaseDate));
        setShiftDate(formatDate(p.shiftDate));
        setOperatorName(p.operator?.fullName ?? "");
        setStationName(p.station?.stationName ?? "");
        setUpdatedBy(p.updatedBy?.fullName ?? p.operator?.fullName ?? "");

        // editable
        setEdcRef(p.edcReferenceNumber ?? "");
        setNote(p.note ?? "");

        setCategories(cat.data?.data ?? []);
      } catch {
        alert("Gagal memuat data transaksi");
      } finally {
        setLoading(false);
      }
    }

    if (id) init();
  }, [id]);

  /* ======================
     CATEGORY CHANGE
  ====================== */
  async function onCategoryChange(id?: string) {
    setCategoryId(id);
    setTypeId(undefined);
    setCardId(undefined);
    setTypes([]);
    setCards([]);

    if (!id) return;

    const selected = categories.find((c) => c.id === id);
    setCategoryName(selected?.categoryName ?? "");

    // harga otomatis (sementara BRD)
    if (selected?.categoryName === "GOLD") setPrice(500000);
    else if (selected?.categoryName === "SILVER") setPrice(300000);
    else setPrice(0);

    const res = await axios.get("/card/types", {
      params: { categoryId: id },
    });
    setTypes(res.data?.data ?? []);
  }

  /* ======================
     TYPE CHANGE
  ====================== */
  async function onTypeChange(id?: string) {
    setTypeId(id);
    setCardId(undefined);
    setCards([]);

    const t = types.find((x) => x.id === id);
    setTypeName(t?.typeName ?? "");

    if (!id) return;

    const res = await axios.get("/cards", {
      params: { cardTypeId: id, status: "IN_STATION" },
    });
    setCards(res.data?.data?.items ?? []);
  }

  /* ======================
     SUBMIT (sementara UI only)
  ====================== */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // endpoint edit belum aktif
    console.log({
      customerName,
      identityNumber,
      nip,
      cardId,
      edcRef,
      note,
    });

    alert("Endpoint update belum tersedia");
  }

  if (loading) return <div className="p-6">Memuat data…</div>;

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
        <h1 className="text-xl font-semibold">Edit Transaksi</h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-lg border bg-gray-50 p-6"
      >
        <SectionCard
          title="Data Customer"
          description="Informasi identitas pemegang kartu"
        >
          <Field label="Nama Customer">
            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className={base}
            />
          </Field>

          <Field label="Identity Number">
            <input
              value={identityNumber}
              onChange={(e) => setIdentityNumber(e.target.value)}
              className={base}
            />
          </Field>

          <Field label="NIP (Khusus KAI)">
            <input
              value={nip}
              onChange={(e) => setNip(e.target.value)}
              disabled={memberType !== "KAI"}
              placeholder={
                memberType === "KAI"
                  ? "Masukkan NIP KAI"
                  : "Tidak berlaku (Non-KAI)"
              }
              className={`${base} ${
                memberType !== "KAI" ? "bg-gray-100 italic" : ""
              }`}
            />
          </Field>
        </SectionCard>

        <SectionCard
          title="Data Kartu"
          description="Kategori, tipe, dan kartu yang digunakan"
        >
          <Field label="Card Category">
            <select
              className={base}
              onChange={(e) => onCategoryChange(e.target.value)}
            >
              <option value="">{categoryName || "Pilih Category"}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.categoryName}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Card Type">
            <select
              className={base}
              disabled={!categoryId}
              onChange={(e) => onTypeChange(e.target.value)}
            >
              <option value="">{typeName || "Pilih Type"}</option>
              {types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.typeName}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Serial Number">
            <select
              className={base}
              disabled={!typeId}
              onChange={(e) => setCardId(e.target.value)}
            >
              <option value="">{serialNumber || "Pilih Serial"}</option>
              {cards.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.serialNumber}
                </option>
              ))}
            </select>
          </Field>

          <Field label="FW Price (Otomatis)">
            <input
              value={rupiah(price)}
              disabled
              className={`${base} bg-gray-100`}
            />
          </Field>
        </SectionCard>

        <SectionCard title="Informasi Transaksi">
          <Field label="Purchase Date">
            <input
              value={purchaseDate}
              disabled
              className={`${base} bg-gray-100`}
            />
          </Field>
          <Field label="Shift Date">
            <input
              value={shiftDate}
              disabled
              className={`${base} bg-gray-100`}
            />
          </Field>
        </SectionCard>

        <SectionCard title="Operasional">
          <Field label="Operator">
            <input
              value={operatorName}
              disabled
              className={`${base} bg-gray-100`}
            />
          </Field>
          <Field label="Stasiun">
            <input
              value={stationName}
              disabled
              className={`${base} bg-gray-100`}
            />
          </Field>
        </SectionCard>

        <SectionCard
          title="Informasi Pembaruan"
          description="Data yang dapat diperbarui pada transaksi ini"
        >
          {/* ROW 1 */}
          <Field label="No. Reference EDC">
            <input
              value={edcRef}
              onChange={(e) => setEdcRef(e.target.value)}
              className={base}
            />
          </Field>

          <Field label="Terakhir Diperbarui Oleh">
            <input
              value={updatedBy}
              disabled
              className={`${base} bg-gray-100`}
            />
          </Field>

          {/* ROW 2 - FULL WIDTH */}
          <div className="md:col-span-2">
            <Field label="Catatan Transaksi">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="min-h-[96px] w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
                placeholder="Tambahkan catatan jika diperlukan"
              />
            </Field>
          </div>
        </SectionCard>

        <div className="flex justify-end pt-4">
          <button className="rounded-md bg-[#8B1538] px-8 py-2 text-sm font-medium text-white hover:bg-[#73122E]">
            Simpan Perubahan
          </button>
        </div>
      </form>
    </div>
  );
}
