<<<<<<< HEAD
'use client';

import { useContext, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  ChevronDown,
  DollarSign,
} from 'lucide-react';

import { UserContext } from '@/app/dashboard/superadmin/dashboard/dashboard-layout';
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

/* ======================
   SECTION CARD
====================== */


/* ======================
   PAGE
====================== */
export default function EditMemberPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const userCtx = useContext(UserContext);

  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);

  const [form, setForm] = useState({
    name: '',
    nik: '',
    nationality: '',
    gender: '',
    phone: '',
    email: '',
    address: '',
    update_by: '',
    note: '',
  });

  /* ======================
     FETCH DETAIL (FROM LIST)
  ====================== */
  useEffect(() => {
  if (!id) return;

  const fetchDetail = async () => {
    try {
      setLoading(true);

      // 🔥 PAKAI DETAIL ENDPOINT
      const res = await getMemberById(id);
      const item = res.data;

      if (!item) throw new Error('Data not found');

        setForm({
  // ======================
  // MEMBER
  // ======================
  name: item.name ?? '',
  nik: item.identityNumber ?? '',
  nationality: item.nationality ?? '',
  gender: item.gender ?? '',
  phone: item.phone ?? '',
  email: item.email ?? '',
  address: item.alamat ?? '',

  update_by:
    item.operatorName ??
    item.operator_name ??
    item.updatedByName ??
    item.createdByName ??
    '',

  // ======================
  // NOTE
  // ======================
  note: item.note ?? '',
});

      } catch (err) {
        console.error(err);
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
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onlyNumber = (e: React.FormEvent<HTMLInputElement>) => {
    e.currentTarget.value = e.currentTarget.value.replace(/\D/g, '');
  };

  /* ======================
     SAVE
  ====================== */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateMember(id, {
        name: form.name,
        phone: form.phone,
        email: form.email,
        address: form.address,
        gender: form.gender,
        nationality: form.nationality,
        note: form.note,
      });

      setShowSuccess(true);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  /* ======================
     RENDER
  ====================== */
  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()}>
            <ArrowLeft />
          </button>
          <h1 className="text-xl font-semibold">Edit Member</h1>
        </div>

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
                className={base}
                required
              />
            </div>

            <input
              name="nik"
              value={form.nik}
              onInput={onlyNumber}
              readOnly
              className={base}
              required
            />

            <input
              name="nationality"
              value={form.nationality}
              onChange={handleChange}
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
                onInput={onlyNumber}
                onChange={handleChange}
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
                className={`${base} pl-10`}
                required
              />
            </div>

            <div className="md:col-span-2">
  <Field label="Operator">
    <input
      value={form.update_by || '-'}
      readOnly
      className={`${base} bg-gray-100`}
    />
  </Field>
</div>


            <div className="md:col-span-2">
              <textarea
                name="note"
                value={form.note}
                onChange={handleChange}
                className="h-32 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="Note"
              />
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              className="rounded-md bg-[#8B1538] px-8 py-2 text-sm text-white"
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
=======
'use client';

import { useContext, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  ChevronDown,
} from 'lucide-react';

import { UserContext } from '@/app/dashboard/superadmin/dashboard/dashboard-layout';
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
        {required && <span className="text-red-500"> *</span>}
      </label>
      {children}
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

  const [form, setForm] = useState({
    name: '',
    nik: '',
    nationality: '',
    gender: '',
    phone: '',
    email: '',
    address: '',
    update_by: '',
    note: '',
  });

  /* ======================
     FETCH DETAIL
  ====================== */
  useEffect(() => {
    if (!id) return;

    const fetchDetail = async () => {
      try {
        setLoading(true);

        const res = await getMemberById(id);
        const item = res.data;

        if (!item) throw new Error('Data not found');

        setForm({
          name: item.name ?? '',
          nik: item.identityNumber ?? '',
          nationality: item.nationality ?? '',
          gender: item.gender ?? '',
          phone: item.phone ?? '',
          email: item.email ?? '',
          address: item.alamat ?? '',
          update_by:
            item.operatorName ??
            item.operator_name ??
            item.updatedByName ??
            item.createdByName ??
            '',
          note: item.note ?? '',
        });
      } catch (err) {
        console.error(err);
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
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onlyNumber = (e: React.FormEvent<HTMLInputElement>) => {
    e.currentTarget.value = e.currentTarget.value.replace(/\D/g, '');
  };

  /* ======================
     SAVE
  ====================== */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ VALIDASI WAJIB NOTE
    if (!form.note.trim()) {
      alert('Note wajib diisi');
      return;
    }

    try {
      await updateMember(id, {
        name: form.name,
        phone: form.phone,
        email: form.email,
        address: form.address,
        gender: form.gender,
        nationality: form.nationality,
        note: form.note,
      });

      setShowSuccess(true);
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan perubahan');
    }
  };

  if (loading) {
    return <div className="p-6 text-sm text-gray-500">Loading...</div>;
  }

  /* ======================
     RENDER
  ====================== */
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
            {/* NAME */}
            <div className="md:col-span-2">
              <Field label="Customer Name" required>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className={base}
                  required
                />
              </Field>
            </div>

            {/* NIK */}
            <Field label="NIK" required>
              <input
                name="nik"
                value={form.nik}
                readOnly
                className={`${base} bg-gray-100`}
              />
            </Field>

            {/* NATIONALITY */}
            <Field label="Nationality" required>
              <input
                name="nationality"
                value={form.nationality}
                onChange={handleChange}
                className={base}
                required
              />
            </Field>

            {/* GENDER */}
          <Field label="Gender" required>
  <div className="relative">
    <select
      name="gender"
      value={form.gender}
      onChange={handleChange}
      className={`${base} appearance-none pr-10`}
      required
    >
      <option value="">Pilih Gender</option>
      <option value="L">Laki - Laki</option>
      <option value="P">Perempuan</option>
    </select>
    <ChevronDown
      size={16}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
    />
  </div>
</Field>


            {/* PHONE */}
            <Field label="Phone" required>
              <div className="relative">
                <Phone
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  name="phone"
                  value={form.phone}
                  onInput={onlyNumber}
                  onChange={handleChange}
                  className={`${base} pl-10`}
                  required
                />
              </div>
            </Field>

            {/* EMAIL */}
            <div className="md:col-span-2">
              <Field label="Email" required>
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className={`${base} pl-10`}
                    required
                  />
                </div>
              </Field>
            </div>

            {/* ADDRESS */}
            <div className="md:col-span-2">
              <Field label="Address" required>
                <div className="relative">
                  <MapPin
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    className={`${base} pl-10`}
                    required
                  />
                </div>
              </Field>
            </div>

            {/* OPERATOR */}
            <div className="md:col-span-2">
              <Field label="Operator">
                <input
                  value={form.update_by || '-'}
                  readOnly
                  className={`${base} bg-gray-100`}
                />
              </Field>
            </div>

            {/* NOTE */}
            <div className="md:col-span-2">
              <Field label="Note" required>
                <textarea
                  name="note"
                  value={form.note}
                  onChange={handleChange}
                  required
                  className="h-32 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Note"
                />
              </Field>
            </div>
          </div>

          {/* ACTION */}
          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              className="rounded-md bg-[#8B1538] px-8 py-2 text-sm text-white"
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
>>>>>>> da9ad286010c29f3d8e17c72ef368bf0864559eb
