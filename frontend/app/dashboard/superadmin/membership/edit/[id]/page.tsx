'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  ChevronDown,
  DollarSign,
} from 'lucide-react';

import SuccessModal from '../../components/ui/SuccessModal';

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
      <label className="text-xs text-gray-500">{label}</label>
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
  value,
  onChange,
}: {
  name: string;
  label: string;
  value: string;
  onChange: (e: any) => void;
}) {
  return (
    <Field label={label}>
      <input
        type="date"
        name={name}
        value={value}
        onChange={onChange}
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
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {children}
      </div>
    </div>
  );
}

/* ======================
   PAGE
====================== */
export default function EditMemberPage() {
  const router = useRouter();
  const { id } = useParams();

  const [showSuccess, setShowSuccess] = useState(false);

  const [form, setForm] = useState<any>({
    name: '',
    nik: '',
    nationality: '',
    gender: '',
    phone: '',
    email: '',
    address: '',
    membershipDate: '',
    expiredDate: '',
    purchasedDate: '',
    price: '',
    cardCategory: '',
    cardType: '',
    station: '',
    shiftDate: '',
    serialNumber: '',
    updateBy: '',
    note: '',
  });

  /* ======================
     LOAD DATA
  ====================== */
  useEffect(() => {
    const stored = JSON.parse(
      localStorage.getItem('fwc_memberships') || '[]'
    );

    const found = stored.find(
      (item: any) => item.id === Number(id)
    );

    if (!found) {
      router.push('/dashboard/superadmin/membership');
      return;
    }

    setForm({
      ...found,
      updateBy: found.updateBy || '',
      note: found.note || '',
    });
  }, [id, router]);

  /* ======================
     HANDLER
  ====================== */
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev: any) => ({ ...prev, [name]: value }));
  };

  const onlyNumber = (e: React.FormEvent<HTMLInputElement>) => {
    e.currentTarget.value = e.currentTarget.value.replace(/\D/g, '');
  };

  /* ======================
     SAVE
  ====================== */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const stored = JSON.parse(
      localStorage.getItem('fwc_memberships') || '[]'
    );

    const updated = stored.map((item: any) =>
      item.id === Number(id)
        ? {
            ...item,
            ...form,
            updatedAt: new Date().toISOString().split('T')[0],
          }
        : item
    );

    localStorage.setItem(
      'fwc_memberships',
      JSON.stringify(updated)
    );

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
          <h1 className="text-xl font-semibold">Edit Member</h1>
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
                value={form.name}
                onChange={handleChange}
                placeholder="Membership Name"
                className={base}
                required
              />
            </div>

            <input
              name="nik"
              value={form.nik}
              onChange={handleChange}
              onInput={onlyNumber}
              placeholder="NIK"
              className={base}
              required
            />

            <input
              name="nationality"
              value={form.nationality}
              onChange={handleChange}
              placeholder="Nationality"
              className={base}
              required
            />

            <div className="relative">
              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
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
                value={form.phone}
                onChange={handleChange}
                onInput={onlyNumber}
                placeholder="Phone Number"
                className={`${base} pl-10`}
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
                value={form.email}
                onChange={handleChange}
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
                value={form.address}
                onChange={handleChange}
                placeholder="Alamat"
                className={`${base} pl-10`}
                required
              />
            </div>

            <SectionCard title="Membership Period">
              <DateField
                name="membershipDate"
                label="Membership Date"
                value={form.membershipDate}
                onChange={handleChange}
              />
              <DateField
                name="expiredDate"
                label="Expired Date"
                value={form.expiredDate}
                onChange={handleChange}
              />
            </SectionCard>

            <SectionCard title="Purchase Information">
              <DateField
                name="purchasedDate"
                label="Purchased Date"
                value={form.purchasedDate}
                onChange={handleChange}
              />
              <Field label="FWC Price">
                <div className="relative">
                  <DollarSign
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    onInput={onlyNumber}
                    className={`${base} pr-10`}
                    required
                  />
                </div>
              </Field>
            </SectionCard>

            <SectionCard title="Card Information">
              <Field label="Card Category">
                <select
                  name="cardCategory"
                  value={form.cardCategory}
                  onChange={handleChange}
                  className={base}
                  required
                >
                  <option value="">Select</option>
                  <option value="Gold">Gold</option>
                  <option value="Silver">Silver</option>
                  <option value="KAI">KAI</option>
                </select>
              </Field>

              <Field label="Card Type">
                <select
                  name="cardType"
                  value={form.cardType}
                  onChange={handleChange}
                  className={base}
                  required
                >
                  <option value="">Select</option>
                  <option value="JaBan">JaBan</option>
                  <option value="JaKa">JaKa</option>
                  <option value="KaBan">KaBan</option>
                </select>
              </Field>
            </SectionCard>

            <SectionCard title="Operational Information">
              <Field label="Stasiun">
                <select
                  name="station"
                  value={form.station}
                  onChange={handleChange}
                  className={base}
                  required
                >
                  <option value="">Select</option>
                  <option value="Halim">Halim</option>
                  <option value="Karawang">Karawang</option>
                  <option value="Padalarang">Padalarang</option>
                  <option value="Tegalluar">Tegalluar</option>
                </select>
              </Field>

              <DateField
                name="shiftDate"
                label="Shift Date"
                value={form.shiftDate}
                onChange={handleChange}
              />
            </SectionCard>

            <div className="md:col-span-2">
              <input
                name="serialNumber"
                value={form.serialNumber}
                onChange={handleChange}
                placeholder="Serial Number"
                className={base}
                required
              />
            </div>

            {/* UPDATE BY */}
            <div className="md:col-span-2">
              <input
                name="updateBy"
                value={form.updateBy}
                onChange={handleChange}
                placeholder="Update By"
                className={base}
                required
              />
            </div>

            {/* NOTE */}
            <div className="md:col-span-2">
              <textarea
                name="note"
                value={form.note}
                onChange={handleChange}
                placeholder="Note"
                className="h-32 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
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

      {/* SUCCESS MODAL */}
      <SuccessModal
        open={showSuccess}
        onClose={() => {
          setShowSuccess(false);
          router.push('/dashboard/superadmin/membership');
        }}
      />
    </>
  );
}
