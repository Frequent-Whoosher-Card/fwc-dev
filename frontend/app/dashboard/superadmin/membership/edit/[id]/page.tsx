'use client';

import { useContext } from 'react';
import { UserContext } from '@/components/dashboard-layout';
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
import {
  getMemberById,
  updateMember,
} from '@/lib/services/membership.service';


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
  const { id } = useParams<{ id: string }>();

  const userCtx = useContext(UserContext);

  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);

  const [form, setForm] = useState<any>({
    name: '',
    nik: '',
    nationality: '',
    gender: '',
    phone: '',
    email: '',
    address: '',
    membership_date: '',
    expired_date: '',
    purchased_date: '',
    price: '',
    card_category: '',
    card_type: '',
    station: '',
    shift_date: '',
    serial_number: '',
    update_by: '',
    note: '',
  });

  /* ======================
     DISPLAY USER LOGIN (DISPLAY ONLY)
  ====================== */
const loggedInUser =
  typeof document !== 'undefined'
    ? (() => {
        const cookies = document.cookie
          .split(';')
          .map((c) => c.trim());

        const userCookie = cookies.find((c) =>
          c.startsWith('fwc_user_name=')
        );

        if (!userCookie) return '';

        return decodeURIComponent(
          userCookie.split('=')[1]
        );
      })()
    : '';

  /* ======================
     LOAD DATA (API)
  ====================== */
  useEffect(() => {
    if (!id) return;

    const fetchDetail = async () => {
      try {
        setLoading(true);
        const res = await getMemberById(id);
        const d = res.data;

        setForm({
          name: d.name ?? '',
          nik: d.nik ?? '',
          nationality: d.nationality ?? '',
          gender: d.gender ?? '',
          phone: d.phone ?? '',
          email: d.email ?? '',
          address: d.address ?? '',
          membership_date: d.membership_date ?? '',
          expired_date: d.expired_date ?? '',
          purchased_date: d.purchased_date ?? '',
          price: d.price ?? '',
          card_category: d.card_category ?? '',
          card_type: d.card_type ?? '',
          station: d.station ?? '',
          shift_date: d.shift_date ?? '',
          serial_number: d.serial_number ?? '',
          update_by: d.update_by ?? '',
          note: d.note ?? '',
        });
      } catch (err) {
        router.push('/dashboard/superadmin/membership');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
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
     SAVE (API)
  ====================== */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // 🔒 update_by DIAMBIL BE DARI REQUEST
      await updateMember(id, form);
      setShowSuccess(true);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

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
                name="membership_date"
                label="Membership Date"
                value={form.membership_date}
                onChange={handleChange}
              />
              <DateField
                name="expired_date"
                label="Expired Date"
                value={form.expired_date}
                onChange={handleChange}
              />
            </SectionCard>

            <SectionCard title="Purchase Information">
              <DateField
                name="purchased_date"
                label="Purchased Date"
                value={form.purchased_date}
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
                  name="card_category"
                  value={form.card_category}
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
                  name="card_type"
                  value={form.card_type}
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
                name="shift_date"
                label="Shift Date"
                value={form.shift_date}
                onChange={handleChange}
              />
            </SectionCard>

            <div className="md:col-span-2">
              <input
                name="serial_number"
                value={form.serial_number}
                onChange={handleChange}
                placeholder="Serial Number"
                className={base}
                required
              />
            </div>

            {/* UPDATED BY – DISPLAY ONLY */}
            {/* UPDATED BY – DISPLAY ONLY */}
<div className="md:col-span-2">
  <label className="mb-1 block text-xs text-gray-500">
    Updated By
  </label>
  <div className="h-10 flex items-center rounded-md border border-gray-300 bg-gray-50 px-3 text-sm text-gray-700">
    {form.update_by || userCtx?.userName || '-'}
  </div>
</div>


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
