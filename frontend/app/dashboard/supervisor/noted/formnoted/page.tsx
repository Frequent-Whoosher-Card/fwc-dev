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
  const searchParams = useSearchParams();
  const id = searchParams.get("id"); // ✅ pakai id

  /* ======================
     STATE
  ====================== */
  const [loading, setLoading] = useState(true);

  const [station, setStation] = useState("-");
  const [category, setCategory] = useState("-");
  const [type, setType] = useState("-");
  const [goodQty, setGoodQty] = useState(0);
  const [sender, setSender] = useState("-");
  const [movementAt, setMovementAt] = useState("-");

  const [hasDamaged, setHasDamaged] = useState(false);
  const [damagedSerials, setDamagedSerials] = useState<string[]>([]);

  const [hasMissing, setHasMissing] = useState(false);
  const [missingSerials, setMissingSerials] = useState<string[]>([]);

  const [message, setMessage] = useState("");

  /* ======================
     TOTAL ISSUES
  ====================== */
  const totalIssues =
    damagedSerials.filter((s) => s.trim()).length +
    missingSerials.filter((s) => s.trim()).length;

  /* ======================
     FETCH DETAIL
  ====================== */
  useEffect(() => {
    if (!id) {
      console.warn("⛔ id kosong dari query");
      setLoading(false);
      return;
    }

    async function fetchDetail() {
      try {
        console.log("🚀 Fetch stock out detail:", id);

        const res = await api.get(`/stock/out/${id}`, {
          validateStatus: (status) => status < 500, // ✅ allow 422
        });

        console.log("📦 RAW RESPONSE:", res.data);

        // normal + validator fallback
        let movement =
          res.data?.data?.movement ?? res.data?.found?.data?.movement;

        if (!movement) {
          console.error("❌ movement tidak ditemukan:", res.data);
          alert("Data stock out tidak ditemukan");
          return;
        }

        // patch batchId jika tidak dikirim backend
        if (!("batchId" in movement)) {
          movement = {
            ...movement,
            batchId: movement.id,
          };
          console.warn("⚠️ batchId missing → fallback to id");
        }

        console.log("✅ movement normalized:", movement);

        // map ke state
        setStation(movement.station?.name || "-");
        setCategory(movement.cardCategory?.name || "-");
        setType(movement.cardType?.name || "-");
        setGoodQty(Number(movement.quantity || 0));
        setSender(movement.createdByName || "-");

        if (movement.movementAt) {
          const date = new Date(movement.movementAt);
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
      } catch (err) {
        console.error("❌ Fetch stock out detail error:", err);
        alert("Gagal mengambil detail stock out");
      } finally {
        setLoading(false);
      }
    }

    fetchDetail();
  }, [id]);

  /* ======================
     SUBMIT
  ====================== */
  const handleSubmit = async () => {
    if (!message.trim()) return alert("Notes wajib diisi.");

    if (hasDamaged && damagedSerials.some((s) => !s.trim())) {
      return alert("Semua serial rusak wajib diisi.");
    }

    if (hasMissing && missingSerials.some((s) => !s.trim())) {
      return alert("Semua serial hilang wajib diisi.");
    }

    if (!id) return alert("ID tidak valid.");

    const payload = {
      stockOutId: id, // backend tetap minta stockOutId
      damagedSerialNumbers: damagedSerials.filter((s) => s.trim()),
      lostSerialNumbers: missingSerials.filter((s) => s.trim()),
      notes: message,
    };

    try {
      await api.post("/stock/out/validate", payload);

      alert("✅ Validasi berhasil disimpan");
      router.push("/dashboard/supervisor/noted");
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

      {/* LOADING */}
      {loading && (
        <div className="p-6 text-sm text-gray-500">
          Loading stock out detail...
        </div>
      )}

      {/* CONTENT */}
      {!loading && (
        <>
          {/* SUMMARY */}
          <div className="rounded-xl border bg-white p-5 sm:p-6 shadow-sm space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <SummaryBox label="Total Cards" value={goodQty} />
              <SummaryBox label="Total Issues" value={totalIssues} danger />
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
              <YesNoToggle
                value={hasDamaged}
                onChange={(v) => {
                  setHasDamaged(v);
                  if (!v) setDamagedSerials([]);
                }}
              />
              <p className="mt-1 text-xs text-gray-500">
                {damagedSerials.filter((s) => s.trim() !== "").length} dari{" "}
                {goodQty} kartu
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
              <YesNoToggle
                value={hasMissing}
                onChange={(v) => {
                  setHasMissing(v);
                  if (!v) setMissingSerials([]);
                }}
              />
              <p className="mt-1 text-xs text-gray-500">
                {missingSerials.filter((s) => s.trim() !== "").length} dari{" "}
                {goodQty} kartu
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
              className="w-full rounded-md border p-3 text-sm focus:border-gray-400 focus:outline-none"
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
        </>
      )}
    </div>
  );
}

/* ======================
   SMALL UI HELPERS
====================== */

function SummaryBox({
  label,
  value,
  danger,
}: {
  label: string;
  value: number;
  danger?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-4 ${danger ? "bg-red-50" : "bg-gray-50"}`}
    >
      <p className="text-xs text-gray-500">{label}</p>
      <p
        className={`text-3xl font-bold ${
          danger ? "text-red-700" : "text-gray-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

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
    <div className="space-y-2">
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
