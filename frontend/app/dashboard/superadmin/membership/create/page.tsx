'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  ChevronDown,
  DollarSign,
  CheckCircle,
} from 'lucide-react';

/* ======================
   BASE INPUT STYLE
====================== */
const base =
  'h-10 w-full rounded-md border border-gray-300 px-3 text-sm text-gray-700 focus:border-gray-400 focus:outline-none';

/* ======================
   FIELD WRAPPER
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
      <label className="text-xs text-gray-500">
        {label}
      </label>
      {children}
    </div>
  );
}

/* ======================
   DATE FIELD
====================== */
function DateField({
  name,
  label,
}: {
  name: string;
  label: string;
}) {
  return (
    <Field label={label}>
      <input
        type="date"
        name={name}
        className={base}
        required
      />
    </Field>
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
    <div className="md:col-span-2 rounded-md border border-gray-200 p-4">
      <h3 className="mb-4 text-sm font-semibold text-gray-700">
        {title}
      </h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 items-start">
        {children}
      </div>
    </div>
  );
}

/* ======================
   ROW PREVIEW (UNTUK MODAL)
====================== */
function PreviewRow({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  return (
    <div className="flex justify-between gap-4 border-b py-1 last:border-b-0">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-800">
        {value || '-'}
      </span>
    </div>
  );
}

/* ======================
   SUCCESS MODAL (DATA PREVIEW)
====================== */
function SuccessModal({
  open,
  data,
  onClose,
}: {
  open: boolean;
  data: Record<string, any> | null;
  onClose: () => void;
}) {
  if (!open || !data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
<div className="w-[560px] max-h-[85vh] rounded-xl bg-white p-6 flex flex-col">
        {/* HEADER */}
        <div className="mb-4 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <CheckCircle size={28} className="text-green-600" />
          </div>
          <h2 className="text-lg font-semibold">
            Data Saved
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Please review the saved data below
          </p>
        </div>

        {/* DATA STRUCTURE PREVIEW */}
<div className="mt-4 flex-1 overflow-auto rounded-md border bg-gray-50 p-4 text-sm">
  <PreviewRow label="Membership Name" value={data.name} />
  <PreviewRow label="Membership Date" value={data.membershipDate} />
  <PreviewRow label="Expired Date" value={data.expiredDate} />
  <PreviewRow label="Nationality" value={data.nationality} />
  <PreviewRow label="Identity Number" value={data.nik} />
  <PreviewRow label="Address" value={data.address} />
  <PreviewRow label="Phone Number" value={data.phone} />
  <PreviewRow label="Email Address" value={data.email} />
  <PreviewRow label="Card Category" value={data.cardCategory} />
  <PreviewRow label="Card Type" value={data.cardType} />
  <PreviewRow label="Purchased Date" value={data.purchasedDate} />
  <PreviewRow label="Kuota" value={data.price} />
  <PreviewRow label="Stasiun" value={data.station} />
  <PreviewRow label="Operator Name" value={data.operatorName} />
</div>


        {/* ACTION */}
        <button
          onClick={onClose}
          className="mt-6 w-full rounded-md bg-[#8B1538] py-2 text-sm font-medium text-white hover:bg-[#73122E]"
        >
          Close
        </button>
      </div>
    </div>
  );
}

/* ======================
   PAGE
====================== */
export default function AddMemberPage() {
  const router = useRouter();
  const [showSuccess, setShowSuccess] = useState(false);
  const [savedData, setSavedData] = useState<Record<string, any> | null>(null);

  const onlyNumber = (e: React.FormEvent<HTMLInputElement>) => {
    e.currentTarget.value =
      e.currentTarget.value.replace(/\D/g, '');
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const data = Object.fromEntries(
      new FormData(e.currentTarget).entries()
    );

    const payload = {
      id: Date.now(),
      ...data,
      updatedAt: new Date().toISOString().split('T')[0],
    };

    const stored = JSON.parse(
      localStorage.getItem('fwc_memberships') || '[]'
    );

    stored.push(payload);

    localStorage.setItem(
      'fwc_memberships',
      JSON.stringify(stored)
    );

    // 🔥 SIMPAN DATA UNTUK DITAMPILKAN DI MODAL
    setSavedData(payload);
    setShowSuccess(true);
  };

  return (
    <>
      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()}>
            <ArrowLeft />
          </button>
          <h1 className="text-xl font-semibold">
            Add Member
          </h1>
        </div>

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="rounded-lg border bg-white p-6"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <input
                name="name"
                placeholder="Membership Name"
                className={base}
                required
              />
            </div>

            <input
              name="nik"
              placeholder="NIK"
              className={base}
              onInput={onlyNumber}
              required
            />

            <input
              name="nationality"
              placeholder="Nationality"
              className={base}
              required
            />

            <div className="relative">
              <select
                name="gender"
                className={`${base} appearance-none pr-10`}
                required
              >
                <option value="">Gender</option>
                <option value="Laki - Laki">Laki - Laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
              <ChevronDown
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
            </div>

            <div className="relative">
              <Phone
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                name="phone"
                placeholder="Phone Number"
                className={`${base} pl-10`}
                onInput={onlyNumber}
                required
              />
            </div>

            <div className="relative md:col-span-2">
              <Mail
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                className={`${base} pl-10`}
                required
              />
            </div>

            <div className="relative md:col-span-2">
              <MapPin
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                name="address"
                placeholder="Alamat"
                className={`${base} pl-10`}
                required
              />
            </div>

            <SectionCard title="Membership Period">
              <DateField name="membershipDate" label="Membership Date" />
              <DateField name="expiredDate" label="Expired Date" />
            </SectionCard>

            <SectionCard title="Purchase Information">
              <DateField name="purchasedDate" label="Purchased Date" />
              <Field label="FWC Price">
                <div className="relative">
                  <DollarSign
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    name="price"
                    className={`${base} pr-10`}
                    onInput={onlyNumber}
                    required
                  />
                </div>
              </Field>
            </SectionCard>

            <SectionCard title="Card Information">
              <Field label="Card Category">
                <select name="cardCategory" className={base} required>
                  <option value="">Select</option>
                  <option value="Gold">Gold</option>
                  <option value="Silver">Silver</option>
                  <option value="KAI">KAI</option>
                </select>
              </Field>

              <Field label="Card Type">
                <select name="cardType" className={base} required>
                  <option value="">Select</option>
                  <option value="JaBan">JaBan</option>
                  <option value="JaKa">JaKa</option>
                  <option value="KaBan">KaBan</option>
                </select>
              </Field>
            </SectionCard>

            <SectionCard title="Operational Information">
              <Field label="Stasiun">
                <select name="station" className={base} required>
                  <option value="">Select</option>
                  <option value="Halim">Halim</option>
                  <option value="Karawang">Karawang</option>
                  <option value="Padalarang">Padalarang</option>
                  <option value="Tegalluar">Tegalluar</option>
                </select>
              </Field>

              <DateField name="shiftDate" label="Shift Date" />
            </SectionCard>

            <div className="md:col-span-2">
              <input
                name="serialNumber"
                placeholder="Serial Number"
                className={base}
                required
              />
            </div>

            <div className="md:col-span-2">
              <input
                name="operatorName"
                placeholder="Operator Name"
                className={base}
                required
              />
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              className="rounded-md bg-[#8B1538] px-8 py-2 text-sm font-medium text-white hover:bg-[#73122E]"
            >
              Save
            </button>
          </div>
        </form>
      </div>

      {/* ✅ SUCCESS POPUP DENGAN DATA */}
      <SuccessModal
        open={showSuccess}
        data={savedData}
        onClose={() =>
          router.push('/dashboard/superadmin/membership')
        }
      />
    </>
  );
}
