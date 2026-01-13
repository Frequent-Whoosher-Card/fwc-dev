"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Phone, Mail, ChevronDown } from "lucide-react";
import { phone as phoneLib } from "phone";

import { createUser, getRoles, RoleItem } from "@/lib/services/user.service";
import { getStations, StationItem } from "@/lib/services/station.service";

/* ======================
   TYPES
====================== */
interface UserForm {
  name: string;
  nip: string;
  username: string;
  email: string;
  phone: string;
  roleId: string;
  stationId: string;
}

/* ======================
   SUCCESS MODAL
====================== */
function SuccessModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-[420px] rounded-xl bg-white p-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <span className="text-xl font-bold text-green-600">✓</span>
        </div>

        <h3 className="text-lg font-semibold">Data Saved</h3>
        <p className="mt-2 text-sm text-gray-500">
          The new user has been saved to the database
        </p>

        <button
          onClick={onClose}
          className="mt-6 h-10 rounded-md bg-[#7A0C2E] px-8 text-sm text-white hover:opacity-90"
        >
          OK
        </button>
      </div>
    </div>
  );
}

/* ======================
   PAGE
====================== */
export default function CreateUserPage() {
  const router = useRouter();

  const [form, setForm] = useState<UserForm>({
    name: "",
    nip: "",
    username: "",
    email: "",
    phone: "",
    roleId: "",
    stationId: "",
  });

  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [stations, setStations] = useState<StationItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  /* ======================
     HELPERS (BEST PRACTICE)
  ====================== */
  const sanitizeNip = (value: string) => value.replace(/\D/g, "").slice(0, 20);

  const sanitizeUsername = (value: string) =>
    value.toLowerCase().replace(/[^a-z0-9_]/g, "");

  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const parsePhone = (value: string) => {
    const cleaned = value.replace(/[^\d+]/g, "");
    const result = phoneLib(cleaned);

    return {
      raw: cleaned,
      e164: result.isValid ? result.phoneNumber : "",
      isValid: result.isValid,
    };
  };

  /* ======================
     FETCH ROLES
  ====================== */
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await getRoles();
        setRoles(res.data);
      } catch {
        setRoles([]);
      }
    };
    fetchRoles();
  }, []);

  /* ======================
     FETCH STATIONS
  ====================== */
  useEffect(() => {
    const fetchStations = async () => {
      try {
        const res = await getStations({ limit: 50 });
        setStations(res.data?.items ?? []);
      } catch {
        setStations([]);
      }
    };
    fetchStations();
  }, []);

  /* ======================
     SUBMIT
  ====================== */
  const handleSubmit = async () => {
    const newErrors: Record<string, string> = {};

    if (!form.name || form.name.length < 3)
      newErrors.name = "Name must be at least 3 characters";

    if (!form.nip) newErrors.nip = "NIP is required";
    else if (form.nip.length < 6 || form.nip.length > 20)
      newErrors.nip = "NIP must be 6–20 digits";

    if (!form.username) newErrors.username = "Username is required";
    else if (form.username.length < 4)
      newErrors.username = "Username must be at least 4 characters";

    if (!form.email) newErrors.email = "Email is required";
    else if (!isValidEmail(form.email))
      newErrors.email = "Invalid email format";

    const phoneCheck = parsePhone(form.phone);

    if (!form.phone) {
      newErrors.phone = "Phone number is required";
    } else if (!phoneCheck.isValid) {
      newErrors.phone = "Invalid international phone number";
    }

    if (!form.roleId) newErrors.roleId = "Role is required";

    if (!form.stationId) newErrors.stationId = "Stasiun is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      const phoneCheck = parsePhone(form.phone);

      await createUser({
        username: form.username,
        fullName: form.name,
        email: form.email,
        phone: phoneCheck.e164, // ✅ FORMAT INTERNASIONAL
        nip: form.nip,
        roleId: form.roleId,
        password: "Default@123",
      });

      setShowSuccess(true);
    } catch (err: any) {
      alert(err?.message || "Failed create user");
    } finally {
      setLoading(false);
    }
  };

  /* ======================
     RENDER
  ====================== */
  return (
    <>
      <div className="space-y-6">
        <div className="rounded-lg border bg-white p-8">
          {/* HEADER */}
          <div className="mb-8 flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-semibold">Add Users</h2>
          </div>

          {/* FORM */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* NAME */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Name<span className="ml-1 text-red-500">*</span>
              </label>
              <input
                placeholder="Full name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="h-11 w-full rounded-md border px-4 text-sm"
              />
              <p className="mt-1 text-xs text-gray-400">Minimal 3 karakter</p>
            </div>

            {/* NIP */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                NIP<span className="ml-1 text-red-500">*</span>
              </label>
              <input
                placeholder="Angka saja"
                value={form.nip}
                inputMode="numeric"
                onChange={(e) =>
                  setForm({ ...form, nip: sanitizeNip(e.target.value) })
                }
                className="h-11 w-full rounded-md border px-4 text-sm"
              />
              <p className="mt-1 text-xs text-gray-400">
                6–20 digit, hanya angka
              </p>
            </div>

            {/* USERNAME */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Username<span className="ml-1 text-red-500">*</span>
              </label>
              <input
                placeholder="username"
                value={form.username}
                onChange={(e) =>
                  setForm({
                    ...form,
                    username: sanitizeUsername(e.target.value),
                  })
                }
                className="h-11 w-full rounded-md border px-4 text-sm"
              />
              <p className="mt-1 text-xs text-gray-400">
                Huruf kecil, tanpa spasi
              </p>
            </div>

            {/* ROLE */}
            <div className="relative">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Role<span className="ml-1 text-red-500">*</span>
              </label>
              <select
                value={form.roleId}
                onChange={(e) => setForm({ ...form, roleId: e.target.value })}
                className="h-11 w-full appearance-none rounded-md border px-4 text-sm"
              >
                <option value="">Pilih role</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.roleName}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-[55%] h-4 w-4 text-gray-400" />
            </div>

            {/* PHONE */}
            <div className="relative md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Phone Number<span className="ml-1 text-red-500">*</span>
              </label>
              <input
                placeholder="+6281…"
                value={form.phone}
                onChange={(e) =>
                  setForm({
                    ...form,
                    phone: e.target.value
                      .replace(/[^\d+]/g, "") // hanya angka & +
                      .slice(0, 16), // + + 15 digit
                  })
                }
                className="h-11 w-full rounded-md border px-4 pr-10 text-sm"
              />

              <p className="mt-1 text-xs text-gray-400">
                Gunakan format internasional (+kode negara)
              </p>
            </div>

            {/* EMAIL */}
            <div className="relative md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Email Address<span className="ml-1 text-red-500">*</span>
              </label>
              <input
                placeholder="example@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="h-11 w-full rounded-md border px-4 pr-10 text-sm"
              />
              <Mail className="absolute right-3 top-[55%] h-4 w-4 text-gray-400" />
              <p className="mt-1 text-xs text-gray-400">
                Gunakan email yang valid
              </p>
            </div>

            {/* STASIUN */}
            <div className="relative md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Stasiun<span className="ml-1 text-red-500">*</span>
              </label>
              <select
                value={form.stationId}
                onChange={(e) =>
                  setForm({ ...form, stationId: e.target.value })
                }
                className="h-11 w-full appearance-none rounded-md border px-4 text-sm"
              >
                <option value="">Pilih stasiun</option>
                {stations.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.stationName}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-[55%] h-4 w-4 text-gray-400" />
            </div>
          </div>

          {/* ACTION */}
          <div className="mt-10 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="h-11 rounded-md bg-[#7A0C2E] px-10 text-sm text-white disabled:opacity-50"
            >
              {loading ? "Saving..." : "Submit"}
            </button>
          </div>
        </div>
      </div>

      <SuccessModal
        open={showSuccess}
        onClose={() => {
          setShowSuccess(false);
          router.push("/dashboard/superadmin/user");
        }}
      />
    </>
  );
}
