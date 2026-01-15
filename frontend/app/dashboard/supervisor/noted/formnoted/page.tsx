"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import api from "@/lib/axios";

/* ======================
   BASE INPUT STYLE
====================== */
const base =
  "h-10 w-full rounded-md border border-gray-300 px-3 text-sm focus:border-gray-400 focus:outline-none";

/* ======================
   FIELD
====================== */
function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-500">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-gray-400">{hint}</p>}
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

/* ======================
   YES / NO TOGGLE
====================== */
function YesNoToggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="inline-flex rounded-full bg-gray-100 p-1">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`px-6 py-2 text-sm rounded-full transition ${
          value ? "bg-[#8B1538] text-white shadow" : "text-gray-500"
        }`}
      >
        Yes
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`px-6 py-2 text-sm rounded-full transition ${
          !value ? "bg-[#8B1538] text-white shadow" : "text-gray-500"
        }`}
      >
        No
      </button>
    </div>
  );
}

/* ======================
   PAGE
====================== */
export default function FormNoted() {
  const router = useRouter();

  /* ======================
     QUERY PARAM
  ====================== */
  const searchParams = useSearchParams();
  const rawId = searchParams.get("stockOutId");
  const stockOutId = rawId ? Number(rawId) : null;

  /* ======================
     STATE
  ====================== */
  const [station, setStation] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState("");
  const [goodQty, setGoodQty] = useState(0);

  const [sender, setSender] = useState("-");
  const [movementAt, setMovementAt] = useState("-");

  const [hasDamaged, setHasDamaged] = useState(false);
  const [damagedSerials, setDamagedSerials] = useState<string[]>([]);

  const [hasMissing, setHasMissing] = useState(false);
  const [missingSerials, setMissingSerials] = useState<string[]>([]);

  const [message, setMessage] = useState("");

  /* ======================
     FETCH STOCK OUT DETAIL
  ====================== */
  useEffect(() => {
    if (!stockOutId || Number.isNaN(stockOutId)) {
      console.warn("⛔ stockOutId invalid:", stockOutId);
      return;
    }

    async function fetchStockOut() {
      try {
        console.log("✅ FETCH stockOutId =", stockOutId);

        const res = await api.get(`/stock/out/${stockOutId}`);
        const d = res.data?.data ?? res.data;

        if (!d) {
          console.warn("⚠️ Response kosong:", res.data);
          return;
        }

        setStation(d.stationName || "-");
        setCategory(d.cardCategory?.name || "-");
        setType(d.cardType?.name || "-");
        setGoodQty(d.quantity || 0);
        setSender(d.createdByName || "-");

        if (d.movementAt) {
          const date = new Date(d.movementAt);
          setMovementAt(
            date.toLocaleDateString("id-ID", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            }) +
              " • " +
              date.toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
              }) +
              " WIB"
          );
        }
      } catch (err: any) {
        console.error("❌ Fetch stock out detail error");
        console.error("➡️ status:", err?.response?.status);
        console.error("➡️ data:", err?.response?.data);
      }
    }

    fetchStockOut();
  }, [stockOutId]);

  /* ======================
     SUBMIT VALIDATION
  ====================== */
  const handleSubmit = async () => {
    if (!message.trim()) {
      return alert("Notes wajib diisi.");
    }

    if (hasDamaged && damagedSerials.some((s) => !s.trim())) {
      return alert("Semua serial rusak wajib diisi.");
    }

    if (hasMissing && missingSerials.some((s) => !s.trim())) {
      return alert("Semua serial hilang wajib diisi.");
    }

    if (!stockOutId) {
      return alert("StockOut ID tidak valid.");
    }

    const payload = {
      stockOutId, // number ✅
      damagedSerialNumbers: damagedSerials,
      lostSerialNumbers: missingSerials,
      notes: message,
    };

    try {
      await api.post("/stock/out/validate", payload);
      alert("Validasi berhasil disimpan");
      router.push("/dashboard/supervisor/inbox");
    } catch (err) {
      console.error("❌ Submit validation error:", err);
      alert("Gagal submit validasi");
    }
  };

  /* ======================
     RENDER
  ====================== */
  return (
    <div className="space-y-6 pb-10">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()}>
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-semibold">Validasi Stock In</h1>
      </div>

      {/* SUMMARY */}
      <div className="rounded-xl border bg-white p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-800">
              Stock In Summary
            </h2>
            <p className="text-xs text-gray-400">
              Data otomatis dari superadmin
            </p>
          </div>

          <span className="text-[11px] px-2 py-1 rounded-full bg-gray-100 text-gray-500">
            Auto-filled
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border bg-gray-50 p-4">
            <p className="text-xs text-gray-500">Total Cards</p>
            <p className="text-3xl font-bold text-gray-900">{goodQty}</p>
            <p className="text-[11px] text-gray-400">Kartu dikirim</p>
          </div>

          <div className="rounded-lg border bg-red-50 p-4">
            <p className="text-xs text-red-600">Total Issues</p>
            <p className="text-3xl font-bold text-red-700">
              {damagedSerials.length + missingSerials.length}
            </p>
            <p className="text-[11px] text-red-500">Rusak / Hilang</p>
          </div>
        </div>

        <div className="h-px bg-gray-100" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-5 text-sm">
          <Info label="Sender" value={sender} />
          <Info label="Waktu Stock Out" value={movementAt} />
          <Info label="Station" value={station} />
          <div>
            <p className="text-[11px] uppercase tracking-wide text-gray-400">
              Card
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <Tag text={category} />
              <Tag text={type} />
            </div>
          </div>
        </div>
      </div>

      {/* DAMAGED */}
      <SectionCard title="Apakah ada kartu yang rusak?">
        <div className="md:col-span-2">
          <YesNoToggle value={hasDamaged} onChange={setHasDamaged} />
          <p className="mt-1 text-xs text-gray-500">
            {damagedSerials.length} dari {goodQty} kartu
          </p>
        </div>

        {hasDamaged && (
          <SerialList
            values={damagedSerials}
            onChange={setDamagedSerials}
            placeholder="Enter damaged serial number"
          />
        )}
      </SectionCard>

      {/* MISSING */}
      <SectionCard title="Apakah ada kartu yang hilang?">
        <div className="md:col-span-2">
          <YesNoToggle value={hasMissing} onChange={setHasMissing} />
          <p className="mt-1 text-xs text-gray-500">
            {missingSerials.length} dari {goodQty} kartu
          </p>
        </div>

        {hasMissing && (
          <SerialList
            values={missingSerials}
            onChange={setMissingSerials}
            placeholder="Enter missing serial number"
          />
        )}
      </SectionCard>

      {/* NOTES */}
      <SectionCard title="Notes">
        <textarea
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full rounded-md border p-3 text-sm md:col-span-2 focus:border-gray-400 focus:outline-none"
        />
      </SectionCard>

      {/* ACTION */}
      <div className="sticky bottom-0 flex justify-end gap-3">
        <button
          onClick={() => router.back()}
          className="rounded-md border px-6 py-2 text-sm"
        >
          Cancel
        </button>

        <button
          onClick={handleSubmit}
          className="rounded-md bg-[#8B1538] px-8 py-2 text-sm font-medium text-white shadow"
        >
          Submit Validation
        </button>
      </div>
    </div>
  );
}

/* ======================
   SMALL UI HELPERS
====================== */

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-gray-400">
        {label}
      </p>
      <p className="font-semibold text-gray-800">{value || "-"}</p>
    </div>
  );
}

function Tag({ text }: { text: string }) {
  return (
    <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
      {text || "-"}
    </span>
  );
}

function SerialList({
  values,
  onChange,
  placeholder,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
}) {
  return (
    <div className="md:col-span-2 space-y-2">
      {values.map((v, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="w-6 text-sm text-gray-400">{i + 1}.</span>
          <input
            value={v}
            onChange={(e) => {
              const arr = [...values];
              arr[i] = e.target.value;
              onChange(arr);
            }}
            className={base}
            placeholder={placeholder}
          />
        </div>
      ))}

      <button
        type="button"
        onClick={() => onChange([...values, ""])}
        className="rounded-md border px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
      >
        + Add Serial
      </button>
    </div>
  );
}
