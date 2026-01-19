"use client";

import { ArrowLeft, Calendar, ChevronDown, DollarSign } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

/* ======================
   BASE INPUT STYLE
====================== */
const base =
  "h-10 w-full rounded-md border border-gray-300 px-3 text-sm text-gray-700 focus:border-gray-400 focus:outline-none";

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

  const [nik, setNik] = useState("");
  const [nip, setNip] = useState("");

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
      <form className="space-y-4 rounded-lg border bg-white p-6">
        {/* CUSTOMER INFORMATION */}
        <SectionCard title="Customer Information">
          {/* CUSTOMER NAME - FULL */}
          <div className="md:col-span-2">
            <Field label="Customer Name" required>
              <input
                placeholder="Masukkan nama lengkap customer"
                className={base}
              />
            </Field>
          </div>

          {/* NIK - LEFT */}
          <Field label="NIK" required>
            <input
              value={nik}
              onChange={(e) =>
                setNik(e.target.value.replace(/\D/g, "").slice(0, 20))
              }
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={20}
              placeholder="Identity Number (max 20 digit)"
              className={base}
            />
          </Field>

          {/* NIP - RIGHT */}
          <Field label="NIP">
            <input
              value={nip}
              onChange={(e) =>
                setNip(e.target.value.replace(/\D/g, "").slice(0, 5))
              }
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={5}
              placeholder="Nomor Induk Pegawai (KAI)"
              className={base}
            />
          </Field>
        </SectionCard>

        {/* CARD INFORMATION */}
        <SectionCard title="Card Information">
          <Field label="Card Product" required>
            <div className="relative">
              <select className={`${base} appearance-none pr-10`} defaultValue="">
                <option value="">Select Card Product</option>
                <option>Gift - Jatim</option>
                <option>Gold - JaBan</option>
                <option>Gold - JaKa</option>
                <option>Gold - KaBan</option>
                <option>KAI - JaBan</option>
                <option>Silver - JaBan</option>
                <option>Silver - JaKa</option>
                <option>Silver - Jatim</option>
                <option>Silver - KaBan</option>
              </select>
              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
            </div>
          </Field>

          <Field label="Serial Number" required>
            <div className="relative">
              <select
                className={`${base} appearance-none pr-10 bg-gray-50`}
                disabled
              >
                <option>Pilih Card Product terlebih dahulu</option>
              </select>
              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
            </div>
          </Field>
        </SectionCard>

        {/* PURCHASE INFORMATION */}
        <SectionCard title="Purchase Information">
          <Field label="Purchased Date" required>
            <div className="relative">
              <Calendar
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input type="date" className={`${base} pr-10`} />
            </div>
          </Field>

          <Field label="Expired Date" required>
            <div className="relative">
              <Calendar
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input type="date" className={`${base} pr-10`} />
            </div>
          </Field>

          {/* FWC PRICE - FULL */}
          <div className="md:col-span-2">
            <Field label="FWC Price" required>
              <div className="relative">
                <DollarSign
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  placeholder="Harga otomatis dari card product"
                  className={`${base} pr-10 bg-gray-50`}
                  readOnly
                />
              </div>
            </Field>
          </div>
        </SectionCard>

        {/* OPERATIONAL INFORMATION */}
        <SectionCard title="Operational Information">
          <Field label="Stasiun" required>
            <select className={base}>
              <option value="">Select</option>
              <option>Halim</option>
              <option>Karawang</option>
              <option>Padalarang</option>
              <option>Tegalluar</option>
            </select>
          </Field>

          <Field label="Shift Date" required>
            <div className="relative">
              <Calendar
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input type="date" className={`${base} pr-10`} />
            </div>
          </Field>
        </SectionCard>

        {/* EDC */}
        <Field label="No. Reference EDC" required>
          <input
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Masukkan nomor referensi EDC"
            className={base}
          />
        </Field>

        {/* ACTION */}
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
