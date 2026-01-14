"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { API_BASE_URL } from "@/lib/apiConfig";

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
    <div className="rounded-md border border-gray-200 p-4">
      <h3 className="mb-4 text-sm font-semibold text-gray-700">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

/* ======================
   YES / NO RADIO
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
  const params = useParams();
  const stockOutId = params.id as string;

  // auto-filled (READ ONLY)
  const [batchCard, setBatchCard] = useState<number | "">("");
  const [station, setStation] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState("");

  const [goodQty, setGoodQty] = useState(0);

  // validation input
  const [hasDamaged, setHasDamaged] = useState<"yes" | "no">("no");
  const [damagedQty, setDamagedQty] = useState(0);
  const [damagedSerials, setDamagedSerials] = useState<string[]>([]);

  const [hasMissing, setHasMissing] = useState<"yes" | "no">("no");
  const [missingQty, setMissingQty] = useState(0);
  const [missingSerials, setMissingSerials] = useState<string[]>([]);

  const [message, setMessage] = useState("");
  /* ======================
     FETCH STOCK OUT DETAIL
  ====================== */
  useEffect(() => {
    async function fetchStockOut() {
      const token = localStorage.getItem("fwc_token");
      if (!token) return;

      const res = await fetch(`${API_BASE_URL}/stock/out/${stockOutId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await res.json();
      if (result.success) {
        const d = result.data;
        setBatchCard(Number(d.batchId));
        setStation(d.stationName);
        setCategory(d.cardCategory.name);
        setType(d.cardType.name);
        setGoodQty(d.quantity);
      }
    }

    fetchStockOut();
  }, [stockOutId]);

  /* ======================
     SUBMIT VALIDATION
  ====================== */

  const handleSubmit = async () => {
    const token = localStorage.getItem("fwc_token");
    if (!token) return alert("Session expired");

    const body = {
      title: `Validasi Stock Out - ${station}`,
      message,
      type: "STOCK_ISSUE_APPROVAL",
      payload: {
        stockOutId,
        batchCard,
        cardCategory: category,
        cardType: type,
        amountCard: goodQty,
        damagedSerials,
        missingSerials,
      },
    };

    try {
      const res = await fetch(`${API_BASE_URL}/inbox`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Submit failed");

      alert("Validasi berhasil dikirim ke Admin");
      router.push("/dashboard/supervisor/inbox");
    } catch (err) {
      alert("Error submitting data");
      console.error(err);
      alert("Gagal submit validasi");
    }
  };

  return (
    <div className="space-y-6 pb-10">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()}>
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-semibold">Validasi Stock In</h1>
      </div>
      {/* BASIC INFO (AUTO-FILL) */}
      {/* SUMMARY */}
      <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">
            Stock In Summary
          </h2>
          <span className="text-xs text-gray-400">Auto-filled</span>
        </div>

        <div className="grid grid-cols-2 gap-6 text-sm">
          <div>
            <p className="text-gray-500">Total Cards Sent</p>
            <p className="text-2xl font-bold">{goodQty}</p>
          </div>

          <div>
            <p className="text-gray-500">Total Issues</p>
            <p className="text-2xl font-bold text-red-600">
              {damagedSerials.length + missingSerials.length}
            </p>
          </div>

          <div>
            <p className="text-gray-500">Station</p>
            <p className="font-medium">{station || "-"}</p>
          </div>

          <div>
            <p className="text-gray-500">Card</p>
            <p className="font-medium">
              {category || "-"} – {type || "-"}
            </p>
          </div>
        </div>
      </div>
      {/* DAMAGED */}
      <SectionCard title="Apakah ada kartu yang rusak?">
        <div className="md:col-span-2">
          <YesNoToggle
            value={hasDamaged === "yes"}
            onChange={(v) => setHasDamaged(v ? "yes" : "no")}
          />
          <p className="mt-1 text-xs text-gray-500">
            {damagedSerials.length} dari {goodQty} kartu
          </p>
        </div>

        {hasDamaged === "yes" && (
          <div className="md:col-span-2 space-y-2">
            {damagedSerials.map((v, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-6 text-sm text-gray-400">{i + 1}.</span>
                <input
                  value={v}
                  onChange={(e) => {
                    const arr = [...damagedSerials];
                    arr[i] = e.target.value;
                    setDamagedSerials(arr);
                  }}
                  className={base}
                  placeholder="Enter damaged serial number"
                />
              </div>
            ))}

            <button
              type="button"
              onClick={() => setDamagedSerials([...damagedSerials, ""])}
              className="rounded-md border px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              + Add Damaged Serial
            </button>
          </div>
        )}
      </SectionCard>
      {/* MISSING */}
      <SectionCard title="Apakah ada kartu yang hilang?">
        <div className="md:col-span-2">
          <YesNoToggle
            value={hasMissing === "yes"}
            onChange={(v) => setHasMissing(v ? "yes" : "no")}
          />
          <p className="mt-1 text-xs text-gray-500">
            {missingSerials.length} dari {goodQty} kartu
          </p>
        </div>

        {hasMissing === "yes" && (
          <div className="md:col-span-2 space-y-2">
            {missingSerials.map((v, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-6 text-sm text-gray-400">{i + 1}.</span>
                <input
                  value={v}
                  onChange={(e) => {
                    const arr = [...missingSerials];
                    arr[i] = e.target.value;
                    setMissingSerials(arr);
                  }}
                  className={base}
                  placeholder="Enter missing serial number"
                />
              </div>
            ))}

            <button
              type="button"
              onClick={() => setMissingSerials([...missingSerials, ""])}
              className="rounded-md border px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              + Add Missing Serial
            </button>
          </div>
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

      {/* SUBMIT BUTTON */}
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
