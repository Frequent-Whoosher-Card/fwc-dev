'use client';


import { useRouter } from 'next/navigation';
import { useState, useEffect, useContext } from 'react';
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
}: {
  name: string;
  label: string;
}) {
  return (
    <Field label={label}>
      <input type="date" name={name} className={base} required />
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
   ROW PREVIEW
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
   SUCCESS MODAL
====================== */
function SuccessModal({
  open,
  data,
  onBack,
  onConfirm,
}: {
  open: boolean;
  data: Record<string, any> | null;
  onBack: () => void;
  onConfirm: () => void;
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
            Data Member
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Please review the member data before continuing
          </p>
        </div>

        {/* PREVIEW DATA */}
       <div className="mt-4 flex-1 overflow-auto rounded-md border bg-gray-50 p-4 text-sm">
  {/* MEMBER INFO */}
  <PreviewRow label="Membership Name" value={data.name} />
  <PreviewRow label="Nationality" value={data.nationality} />
  <PreviewRow label="Gender" value={data.gender} />
  <PreviewRow label="Identity Number" value={data.nik} />
  <PreviewRow label="Address" value={data.address} />
  <PreviewRow label="Phone Number" value={data.phone} />
  <PreviewRow label="Email Address" value={data.email} />

   {/* CARD INFO */}
  <PreviewRow label="Card Category" value={data.cardCategory} />
  <PreviewRow label="Card Type" value={data.cardType} />

  {/* MEMBERSHIP PERIOD */}
  <PreviewRow label="Membership Date" value={data.membershipDate} />
  <PreviewRow label="Expired Date" value={data.expiredDate} />


  {/* PURCHASE */}
  <PreviewRow label="Purchased Date" value={data.purchasedDate} />
  <PreviewRow label="Kuota" value={data.price} />

  {/* OPERATIONAL */}
  <PreviewRow label="Stasiun" value={data.station} />
  <PreviewRow label="Shift Date" value={data.shiftDate} />
  <PreviewRow label="Serial Number" value={data.serialNumber} />
</div>


        {/* ACTION BUTTON */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={onBack}
            className="w-1/2 rounded-md border border-gray-300 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Back
          </button>

          <button
            onClick={onConfirm}
            className="w-1/2 rounded-md bg-[#8B1538] py-2 text-sm font-medium text-white hover:bg-[#73122E]"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}


/* ======================
   PAGE
====================== */

const CARD_RULES = {
  JaBan: {
    Gold: { price: 2000000, days: 60 },
    Silver: { price: 1350000, days: 30 },
    KAI: { price: 500000, days: 30 }, // ✅ KAI INTERNAL
  },
  JaKa: {
    Gold: { price: 500000, days: 60 },
    Silver: { price: 450000, days: 30 },
    KAI: { price: 200000, days: 30 }, // ✅ KAI INTERNAL
  },
  KaBan: {
    Gold: { price: 1000000, days: 60 },
    Silver: { price: 750000, days: 30 },
    KAI: { price: 300000, days: 30 }, // ✅ KAI INTERNAL
  },
};


export default function AddMemberPage() {
  const router = useRouter();
  const [showSuccess, setShowSuccess] = useState(false);
  const [shiftDate, setShiftDate] = useState('');
  const [savedData, setSavedData] =
  
    useState<Record<string, any> | null>(null);

    useEffect(() => {
  const today = new Date().toISOString().split('T')[0];

  setMembershipDate(today);
}, []);

    useEffect(() => {
  const today = new Date().toISOString().split('T')[0];

  setMembershipDate(today);
  setShiftDate(today);
}, []);


  const onlyNumber = (e: React.FormEvent<HTMLInputElement>) => {
    e.currentTarget.value = e.currentTarget.value.replace(/\D/g, '');
  };

    // ======================
  // CARD AUTO CONFIG STATE
  // ======================
  const [cardCategory, setCardCategory] = useState('');
  const [cardType, setCardType] = useState('');
  const [price, setPrice] = useState('');
  const [expiredDate, setExpiredDate] = useState('');
    const [membershipDate, setMembershipDate] = useState('');


useEffect(() => {
  if (!cardCategory || !cardType || !membershipDate) return;

  const rule = CARD_RULES[cardType]?.[cardCategory];
  if (!rule) return;

  // 💰 AUTO PRICE
  setPrice(rule.price.toString());

  // 📅 EXPIRED BASED ON MEMBERSHIP DATE
  const baseDate = new Date(membershipDate);
  baseDate.setDate(baseDate.getDate() + rule.days);

  setExpiredDate(baseDate.toISOString().split('T')[0]);
}, [cardCategory, cardType, membershipDate]);

  /* ======================
     SUBMIT (API + TOKEN)
  ====================== */
  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    const formData = Object.fromEntries(
      new FormData(e.currentTarget).entries()
    );

    // 🔑 TOKEN SESUAI AUTH KAMU
    const token = localStorage.getItem('fwc_token');

    if (!token) {
      alert('Token not found. Please login again.');
      return;
    }

    // 📦 PAYLOAD SESUAI API /members
    const payload = {
      name: formData.name,
      identityNumber: formData.nik,
      nationality: formData.nationality,
      email: formData.email,
      phone: formData.phone,
      gender: formData.gender,
      alamat: formData.address,
      nipKai: '',
    };

    try {
      const res = await fetch(
        'http://localhost:3001/members',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw err;
      }

      const saved = await res.json();

      setSavedData({
        ...formData,
        createdAt: saved.createdAt,
      });

      setShowSuccess(true);
    } catch (error) {
      console.error('CREATE MEMBER ERROR', error);
      alert('Failed to save member data');
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()}>
            <ArrowLeft />
          </button>
          <h1 className="text-xl font-semibold">Add Member</h1>
        </div>

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
<Field label="Membership Date">
  <input
  type="date"
  name="membershipDate"
  className={`${base} bg-gray-100 cursor-not-allowed`}
  value={membershipDate}
  readOnly
/>

</Field>
<Field label="Expired Date">
  <input
    name="expiredDate"
    className={`${base} bg-gray-100`}
    value={expiredDate}
    readOnly
  />
</Field>
            </SectionCard>

            <SectionCard title="Purchase Information">
  <Field label="Purchased Date">
    <input
      type="date"
      name="purchasedDate"
      value={membershipDate}
      readOnly
      className={`${base} bg-gray-100 cursor-not-allowed`}
    />
  </Field>

  <Field label="FWC Price">
    <div className="relative">
      <DollarSign
        size={16}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
      />
      <input
        name="price"
        value={price}
        readOnly
        className={`${base} pr-10 bg-gray-100 cursor-not-allowed`}
        required
      />
    </div>
  </Field>
</SectionCard>


            <SectionCard title="Card Information">
              <Field label="Card Category">
                <select
  name="cardCategory"
  className={base}
  required
  value={cardCategory}
  onChange={(e) => setCardCategory(e.target.value)}
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
  className={base}
  required
  value={cardType}
  onChange={(e) => setCardType(e.target.value)}
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
  data={savedData}
  onBack={() => setShowSuccess(false)}
  onConfirm={() =>
    router.push('/dashboard/superadmin/membership')
  }
/>
    </>
  );
}
