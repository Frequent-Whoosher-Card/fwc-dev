"use client";

import { ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "@/lib/axios";
import SuccessModal from "../../../membership/components/ui/SuccessModal";

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
  const [cardProducts, setCardProducts] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [cards, setCards] = useState<any[]>([]);

  const [categoryId, setCategoryId] = useState<string>();
  const [typeId, setTypeId] = useState<string>();
  const [cardId, setCardId] = useState<string>();

  const [categoryName, setCategoryName] = useState("");
  const [typeName, setTypeName] = useState("");
  const [serialNumber, setSerialNumber] = useState("");

  // editable - operators and stations
  const [operators, setOperators] = useState<any[]>([]);
  const [stations, setStations] = useState<any[]>([]);
  const [operatorId, setOperatorId] = useState<string>("");
  const [stationId, setStationId] = useState<string>("");
  const [memberId, setMemberId] = useState<string>("");

  // otomatis
  const [price, setPrice] = useState(0);
  const [purchaseDate, setPurchaseDate] = useState("");
  const [shiftDate, setShiftDate] = useState("");
  const [operatorName, setOperatorName] = useState("");
  const [stationName, setStationName] = useState("");
  const [updatedBy, setUpdatedBy] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");

  // editable transaksi
  const [edcRef, setEdcRef] = useState("");
  const [note, setNote] = useState("");

  // modal confirmation
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // card mismatch correction
  const [showCorrection, setShowCorrection] = useState(false);
  const [wrongCardSerial, setWrongCardSerial] = useState("");
  const [correctCardSerial, setCorrectCardSerial] = useState("");
  const [correctionNote, setCorrectionNote] = useState("");

  /* ======================
     INIT LOAD
  ====================== */
  useEffect(() => {
    async function init() {
      try {
        const [trx, cat, ops, sts] = await Promise.all([
          axios.get(`/purchases/${id}`),
          axios.get("/card/category/"),
          axios.get("/users"),
          axios.get("/station"),
        ]);

        const p = trx.data?.data;
        if (!p) throw new Error("Data tidak ditemukan");

        // customer
        setCustomerName(p.member?.name ?? "");
        setIdentityNumber(p.member?.identityNumber ?? "");
        setMemberType(p.member?.type ?? "");
        setNip(p.member?.nippKai ?? "");
        setMemberId(p.memberId ?? "");

        // card
        setCategoryName(p.card?.cardProduct?.category?.categoryName ?? "");
        setTypeName(p.card?.cardProduct?.type?.typeName ?? "");
        setSerialNumber(p.card?.serialNumber ?? "");

        // editable - operator and station
        setOperatorId(p.operatorId ?? "");
        setOperatorName(p.operator?.fullName ?? "");
        setStationId(p.stationId ?? "");
        setStationName(p.station?.stationName ?? "");
        setOperators(ops.data?.data?.items ?? []);
        setStations(sts.data?.data?.items ?? []);

        // otomatis
        setPrice(p.price ?? 0);
        setPurchaseDate(formatDate(p.purchaseDate));
        setShiftDate(p.shiftDate ? formatDate(p.shiftDate) : "");
        setUpdatedBy(p.updatedByName ?? p.operator?.fullName ?? "");
        setUpdatedAt(p.updatedAt ? formatDate(p.updatedAt) : "");

        // editable
        setEdcRef(p.edcReferenceNumber ?? "");
        setNote(p.notes ?? "");

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
    setPrice(0);

    if (!id) return;

    const selected = categories.find((c) => c.id === id);
    setCategoryName(selected?.categoryName ?? "");

    // Load card products untuk mendapatkan price
    const [typesRes, productsRes] = await Promise.all([
      axios.get("/card/types", { params: { categoryId: id } }),
      axios.get("/card/product", { params: { categoryId: id } }),
    ]);

    setTypes(typesRes.data?.data ?? []);
    setCardProducts(productsRes.data?.data ?? []);
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

    if (!id) {
      setPrice(0);
      return;
    }

    // Set price dari cardProduct yang sesuai dengan categoryId DAN typeId
    const matchedProduct = cardProducts.find(
      (product: any) =>
        product.categoryId === categoryId && product.type?.id === id,
    );
    if (matchedProduct) {
      setPrice(Number(matchedProduct.price) || 0);
    }

    // Load cards dengan filter categoryId DAN typeId
    const res = await axios.get("/cards", {
      params: {
        categoryId: categoryId,
        typeId: id,
        status: "IN_STATION",
      },
    });
    setCards(res.data?.data?.items ?? []);
  }

  /* ======================
     CARD CORRECTION
  ====================== */
  async function handleCorrectCard() {
    if (!wrongCardSerial || !correctCardSerial) {
      alert("Harap isi Wrong Card Serial dan Correct Card Serial");
      return;
    }

    if (
      !confirm(
        "Apakah Anda yakin ingin melakukan koreksi kartu? Kartu yang salah akan di-set ke status DELETED (permanent).",
      )
    ) {
      return;
    }

    try {
      // Find wrong card ID by serial number
      const wrongCardRes = await axios.get("/cards", {
        params: { search: wrongCardSerial },
      });
      const wrongCard = wrongCardRes.data?.data?.items?.find(
        (c: any) => c.serialNumber === wrongCardSerial,
      );

      if (!wrongCard) {
        alert(`Card dengan serial ${wrongCardSerial} tidak ditemukan`);
        return;
      }

      // Find correct card ID by serial number
      const correctCardRes = await axios.get("/cards", {
        params: { search: correctCardSerial },
      });
      const correctCard = correctCardRes.data?.data?.items?.find(
        (c: any) => c.serialNumber === correctCardSerial,
      );

      if (!correctCard) {
        alert(`Card dengan serial ${correctCardSerial} tidak ditemukan`);
        return;
      }

      // Call correction endpoint
      await axios.patch(`/purchases/${id}/correct-card-mismatch`, {
        wrongCardId: wrongCard.id,
        correctCardId: correctCard.id,
        notes: correctionNote,
      });

      alert("Koreksi kartu berhasil!");
      router.refresh();
      router.back();
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message || "Gagal melakukan koreksi kartu";
      alert(message);
    }
  }

  /* ======================
     SUBMIT
  ====================== */
  function openConfirmDialog(e: React.FormEvent) {
    e.preventDefault();
    setShowConfirm(true);
  }

  async function handleConfirmSubmit() {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const updateData: any = {};

      if (memberId) updateData.memberId = memberId;
      if (operatorId) updateData.operatorId = operatorId;
      if (stationId) updateData.stationId = stationId;
      if (edcRef) updateData.edcReferenceNumber = edcRef;
      if (price) updateData.price = price;
      if (note) updateData.notes = note;
      if (shiftDate) {
        // Convert YYYY-MM-DD to ISO datetime
        const date = new Date(shiftDate);
        updateData.shiftDate = date.toISOString();
      }

      await axios.patch(`/purchases/${id}`, updateData);

      router.back();
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message || "Gagal memperbarui transaksi";
      alert(message);
    } finally {
      setIsSubmitting(false);
      setShowConfirm(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    openConfirmDialog(e);
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
              disabled
              className={`${base} bg-gray-100`}
            />
          </Field>

          <Field label="Identity Number">
            <input
              value={identityNumber}
              disabled
              className={`${base} bg-gray-100`}
            />
          </Field>

          <Field label="NIP (Khusus KAI)">
            <input
              value={nip}
              disabled
              placeholder={
                memberType === "KAI"
                  ? "Masukkan NIP KAI"
                  : "Tidak berlaku (Non-KAI)"
              }
              className={`${base} bg-gray-100 ${
                memberType !== "KAI" ? "italic" : ""
              }`}
            />
          </Field>
        </SectionCard>

        <SectionCard
          title="Data Kartu"
          description="Kategori, tipe, dan kartu yang digunakan"
        >
          <Field label="Card Category">
            <input
              value={categoryName}
              disabled
              className={`${base} bg-gray-100`}
            />
          </Field>

          <Field label="Card Type">
            <input
              value={typeName}
              disabled
              className={`${base} bg-gray-100`}
            />
          </Field>

          <Field label="Serial Number">
            <input
              value={serialNumber}
              disabled
              className={`${base} bg-gray-100`}
            />
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
              type="date"
              value={shiftDate}
              disabled
              className={`${base} bg-gray-100`}
            />
          </Field>
        </SectionCard>

        <SectionCard title="Operasional">
          <Field label="Operator">
            <select
              value={operatorId}
              onChange={(e) => setOperatorId(e.target.value)}
              className={base}
            >
              <option value="">{operatorName || "Pilih Operator"}</option>
              {operators.map((op) => (
                <option key={op.id} value={op.id}>
                  {op.fullName}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Stasiun">
            <select
              value={stationId}
              onChange={(e) => setStationId(e.target.value)}
              className={base}
            >
              <option value="">{stationName || "Pilih Stasiun"}</option>
              {stations.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.stationName}
                </option>
              ))}
            </select>
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

          {updatedAt && (
            <>
              <Field label="Terakhir Diperbarui Oleh">
                <input
                  value={updatedBy}
                  disabled
                  className={`${base} bg-gray-100`}
                />
              </Field>

              {/* ROW 2 */}
              <Field label="Terakhir Diperbarui Pada">
                <input
                  value={updatedAt}
                  disabled
                  className={`${base} bg-gray-100`}
                />
              </Field>
            </>
          )}

          {/* ROW 3 - FULL WIDTH */}
          <div className="md:col-span-2">
            <Field label="Noted">
              <textarea
                value={note}
                disabled
                className="min-h-[96px] w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
                placeholder="Tambahkan catatan jika diperlukan"
              />
            </Field>
          </div>
        </SectionCard>

        {/* CARD MISMATCH CORRECTION - Only show if no note exists */}
        {!note && (
          <SectionCard
            title="Koreksi Kartu (Card Mismatch)"
            description="Gunakan jika petugas salah memberikan kartu ke customer"
          >
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  id="showCorrection"
                  checked={showCorrection}
                  onChange={(e) => setShowCorrection(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label
                  htmlFor="showCorrection"
                  className="text-sm font-medium text-gray-700"
                >
                  Aktifkan Koreksi Kartu
                </label>
              </div>
            </div>

            {showCorrection && (
              <>
                <Field label="Wrong Card Serial (yang salah dikasih)">
                  <input
                    value={wrongCardSerial}
                    onChange={(e) => setWrongCardSerial(e.target.value)}
                    placeholder="Contoh: 0111001"
                    className={base}
                  />
                </Field>

                <Field label="Correct Card Serial (yang benar seharusnya)">
                  <input
                    value={correctCardSerial}
                    onChange={(e) => setCorrectCardSerial(e.target.value)}
                    placeholder="Contoh: 0111002"
                    className={base}
                  />
                </Field>

                <div className="md:col-span-2">
                  <Field label="Alasan Koreksi">
                    <textarea
                      value={correctionNote}
                      onChange={(e) => setCorrectionNote(e.target.value)}
                      className="min-h-[80px] w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
                      placeholder="Jelaskan alasan koreksi kartu"
                    />
                  </Field>
                </div>

                <div className="md:col-span-2">
                  <div className="rounded-md bg-yellow-50 border border-yellow-200 p-3">
                    <p className="text-xs text-yellow-800">
                      <strong>Perhatian:</strong> Koreksi kartu akan:
                    </p>
                    <ul className="text-xs text-yellow-700 mt-1 ml-4 list-disc">
                      <li>Card lama ({serialNumber}) return ke IN_STATION</li>
                      <li>
                        Wrong card (yang salah dikasih) jadi status DELETED
                        (permanent)
                      </li>
                      <li>Correct card (yang benar) jadi SOLD_ACTIVE</li>
                      <li>Price transaksi tetap (tidak berubah)</li>
                    </ul>
                  </div>
                </div>

                <div className="md:col-span-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleCorrectCard}
                    className="rounded-md bg-orange-600 px-6 py-2 text-sm font-medium text-white hover:bg-orange-700"
                  >
                    Lakukan Koreksi Kartu
                  </button>
                </div>
              </>
            )}
          </SectionCard>
        )}

        <div className="flex justify-end pt-4">
          <button 
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-[#8B1538] px-8 py-2 text-sm font-medium text-white hover:bg-[#73122E] disabled:opacity-50"
          >
            {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </form>

      <SuccessModal
        open={showConfirm}
        title="Edit Transaction Data"
        message="Please review the transaction data before saving"
        data={{
          // Customer
          "Customer Name": customerName || "-",
          "Identity Number": identityNumber || "-",
          "NIP": nip || "-",
          
          // Card Info
          "Card Category": categoryName || "-",
          "Card Type": typeName || "-",
          "Serial Number": serialNumber || "-",
          
          // Transaction
          "Purchase Date": formatDate(purchaseDate),
          "Shift Date": formatDate(shiftDate),
          "Price": rupiah(price),
          "No. Reference EDC": edcRef || "-",
          
          // Operational
          "Operator": operatorName || "-",
          "Station": stationName || "-",
          "Notes": note || "-",
        }}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmSubmit}
      />
    </div>
  );
}
