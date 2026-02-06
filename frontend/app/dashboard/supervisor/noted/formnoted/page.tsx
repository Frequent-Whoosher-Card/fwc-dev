"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

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
      <label className="text-xs text-gray-500">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-gray-400">{hint}</p>}
    </div>
  );
}

/* ======================
   SECTION CARD (Membership Style)
====================== */
function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-gray-200 p-4 md:col-span-2">
      <h3 className="mb-4 text-sm font-semibold text-gray-700">{title}</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        {children}
      </div>
    </div>
  );
}

/* ======================
   YES / NO RADIO
====================== */
function YesNoRadio({
  value,
  onChange,
}: {
  value: "yes" | "no";
  onChange: (v: "yes" | "no") => void;
}) {
  return (
    <div className="flex gap-4">
      {["yes", "no"].map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v as "yes" | "no")}
          className={`rounded-md border px-4 py-2 text-sm ${value === v
              ? "border-[#8B1538] bg-[#8B1538]/10 text-[#8B1538]"
              : "border-gray-300 text-gray-500"
            }`}
        >
          {v.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

/* ======================
   PAGE
====================== */
export default function FormNoted() {
  const router = useRouter();

  const [batchCard, setBatchCard] = useState<number | "">("");
  const [station, setStation] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState("");

  const [goodQty, setGoodQty] = useState(0);

  const [hasDamaged, setHasDamaged] = useState<"yes" | "no">("no");
  const [damagedQty, setDamagedQty] = useState(0);
  const [damagedSerials, setDamagedSerials] = useState<string[]>([]);

  const [hasMissing, setHasMissing] = useState<"yes" | "no">("no");
  const [missingQty, setMissingQty] = useState(0);
  const [missingSerials, setMissingSerials] = useState<string[]>([]);

  const [message, setMessage] = useState("");

  /* ======================
   HANDLERS SUBMIT & CANCEL
  ====================== */

  const handleSubmit = async () => {
    const payload = {
      batchCard,
      station,
      category,
      type,
      goodQty,
      damaged: {
        hasDamaged,
        damagedQty,
        damagedSerials,
      },
      missing: {
        hasMissing,
        missingQty,
        missingSerials,
      },
      message,
    };

    try {
      const token = localStorage.getItem("fwc_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001"}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
          const errorText = await res.text();
          console.warn("Submit note failed:", errorText);
          
          if (res.status === 403) {
              alert("Akses Ditolak: Anda tidak memiliki izin untuk menyimpan catatan ini.");
          } else {
              alert(`Gagal menyimpan: ${errorText || "Server error"}`);
          }
          return;
      }

      alert("Data successfully saved!");
      router.push("/noted"); // redirect kalau mau
    } catch (err) {
      alert("Error submitting data");
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="rounded p-1 hover:bg-gray-100"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-semibold">Add New Noted</h1>
      </div>

      {/* BASIC INFORMATION */}
      <SectionCard title="Basic Information">
        {" "}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Field label="Batch Card" required>
            <input
              type="number"
              value={batchCard}
              onChange={(e) =>
                setBatchCard(
                  e.target.value === "" ? "" : Number(e.target.value)
                )
              }
              className={base}
            />
          </Field>
          <Field label="Station" required>
            <select
              value={station}
              onChange={(e) => setStation(e.target.value)}
              className={base}
            >
              <option value="">Select station</option> <option>Halim</option>{" "}
              <option>Karawang</option> <option>Padalarang</option>{" "}
              <option>Tegalluar</option>{" "}
            </select>
          </Field>
          <Field label="Card Category" required>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={base}
            >
              <option value="">Select category</option> <option>Gold</option>{" "}
              <option>Silver</option> <option>KAI</option>{" "}
            </select>
          </Field>
          <Field label="Card Product" required>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className={base}
            >
              <option value="">Select type</option> <option>JaKa</option>{" "}
              <option>JaBan</option> <option>KaBan</option>{" "}
            </select>
          </Field>
        </div>
      </SectionCard>

      {/* GOOD CARDS */}
      <SectionCard title="1. Good Cards">
        <div className="md:col-span-2">
          <Field label="Total good cards received" required>
            <input type="number" className={base} />
          </Field>
        </div>
      </SectionCard>

      {/* DAMAGED CARDS */}
      <SectionCard title="2. Damaged Cards">
        <div className="md:col-span-2">
          <YesNoRadio value={hasDamaged} onChange={setHasDamaged} />
        </div>

        {hasDamaged === "yes" && (
          <>
            <Field label="Damaged Quantity" required>
              <input
                type="number"
                min={1}
                value={damagedQty}
                onChange={(e) => {
                  const qty = Number(e.target.value);
                  setDamagedQty(qty);
                  setDamagedSerials(
                    Array.from(
                      { length: qty },
                      (_, i) => damagedSerials[i] || ""
                    )
                  );
                }}
                className={base}
              />
            </Field>

            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3">
              {damagedSerials.map((val, idx) => (
                <input
                  key={idx}
                  value={val}
                  onChange={(e) => {
                    const arr = [...damagedSerials];
                    arr[idx] = e.target.value;
                    setDamagedSerials(arr);
                  }}
                  className={base}
                  placeholder={`Damaged serial ${idx + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </SectionCard>

      {/* MISSING CARDS */}
      <SectionCard title="3. Missing Cards">
        <div className="md:col-span-2">
          <YesNoRadio value={hasMissing} onChange={setHasMissing} />
        </div>

        {hasMissing === "yes" && (
          <>
            <Field label="Missing Quantity" required>
              <input
                type="number"
                min={1}
                value={missingQty}
                onChange={(e) => {
                  const qty = Number(e.target.value);
                  setMissingQty(qty);
                  setMissingSerials(
                    Array.from(
                      { length: qty },
                      (_, i) => missingSerials[i] || ""
                    )
                  );
                }}
                className={base}
              />
            </Field>

            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3">
              {missingSerials.map((val, idx) => (
                <input
                  key={idx}
                  value={val}
                  onChange={(e) => {
                    const arr = [...missingSerials];
                    arr[idx] = e.target.value;
                    setMissingSerials(arr);
                  }}
                  className={base}
                  placeholder={`Missing serial ${idx + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </SectionCard>

      {/* NOTES */}
      <SectionCard title="Additional Notes">
        <div className="md:col-span-2">
          <textarea
            rows={4}
            className="w-full rounded-md border border-gray-300 p-3 text-sm"
            placeholder="Additional information (optional)"
          />
        </div>
      </SectionCard>

      {/* ACTION BAR */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          onClick={() => router.back()}
          className="rounded-md border px-6 py-2 text-sm"
        >
          Cancel
        </button>

        <button
          onClick={handleSubmit}
          className="rounded-md bg-[#8B1538] px-8 py-2 text-sm font-medium text-white"
        >
          Submit
        </button>
      </div>
    </div>
  );
}
