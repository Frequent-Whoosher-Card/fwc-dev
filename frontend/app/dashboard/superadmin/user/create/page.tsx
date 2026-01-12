"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Phone, Mail, ChevronDown } from "lucide-react";

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
  roleId: string; // UUID
  stationId: string; // UUID
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
     HELPERS
  ====================== */
  const onlyNumber = (value: string) => value.replace(/\D/g, "");

  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  /* ======================
   FETCH ROLES
====================== */
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await getRoles();
        setRoles(res.data); // ⬅️ PENTING
      } catch (err) {
        console.error("Failed fetch roles", err);
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
    } catch (err) {
      console.error("Failed fetch stations", err);
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

    if (!form.name) newErrors.name = "Name is required";
    if (!form.nip) newErrors.nip = "NIP is required";
    if (!form.username) newErrors.username = "Username is required";
    if (!form.phone) newErrors.phone = "Phone number is required";

    if (!form.email) {
      newErrors.email = "Email is required";
    } else if (!isValidEmail(form.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!form.roleId) newErrors.roleId = "Role is required";
    if (!form.stationId) newErrors.stationId = "Stasiun is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);

      await createUser({
        username: form.username,
        fullName: form.name,
        email: form.email || null,
        phone: form.phone || null,
        nip: form.nip,
        roleId: form.roleId,
        password: "Default@123", // ⚠️ sesuaikan policy BE
      });

      setShowSuccess(true);
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Failed create user");
    } finally {
      setLoading(false);
    }
  };

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
              <input
                placeholder="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="h-11 w-full rounded-md border px-4 text-sm focus:ring-1 focus:ring-[#7A0C2E]"
              />
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name}</p>
              )}
            </div>

            {/* NIP */}
            <div>
              <input
                placeholder="NIP"
                value={form.nip}
                inputMode="numeric"
                onChange={(e) =>
                  setForm({
                    ...form,
                    nip: onlyNumber(e.target.value),
                  })
                }
                className="h-11 w-full rounded-md border px-4 text-sm focus:ring-1 focus:ring-[#7A0C2E]"
              />
              {errors.nip && (
                <p className="text-xs text-red-500">{errors.nip}</p>
              )}
            </div>

            {/* USERNAME */}
            <div>
              <input
                placeholder="Username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="h-11 w-full rounded-md border px-4 text-sm focus:ring-1 focus:ring-[#7A0C2E]"
              />
              {errors.username && (
                <p className="text-xs text-red-500">{errors.username}</p>
              )}
            </div>

            {/* ROLE */}
            <div className="relative">
              <select
                value={form.roleId}
                onChange={(e) => setForm({ ...form, roleId: e.target.value })}
                className="h-11 w-full appearance-none rounded-md border px-4 text-sm focus:ring-1 focus:ring-[#7A0C2E]"
              >
                <option value="">Role</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.roleName}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              {errors.roleId && (
                <p className="text-xs text-red-500">{errors.roleId}</p>
              )}
            </div>

            {/* PHONE */}
            <div className="relative md:col-span-2">
              <input
                placeholder="Phone Number"
                value={form.phone}
                inputMode="numeric"
                onChange={(e) =>
                  setForm({
                    ...form,
                    phone: onlyNumber(e.target.value),
                  })
                }
                className="h-11 w-full rounded-md border px-4 pr-10 text-sm focus:ring-1 focus:ring-[#7A0C2E]"
              />
              <Phone className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              {errors.phone && (
                <p className="text-xs text-red-500">{errors.phone}</p>
              )}
            </div>

            {/* EMAIL */}
            <div className="relative md:col-span-2">
              <input
                type="email"
                placeholder="Email Address"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="h-11 w-full rounded-md border px-4 pr-10 text-sm focus:ring-1 focus:ring-[#7A0C2E]"
              />
              <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email}</p>
              )}
            </div>

            {/* STASIUN */}
            <div className="relative md:col-span-2">
              <select
                value={form.stationId}
                onChange={(e) =>
                  setForm({ ...form, stationId: e.target.value })
                }
                className="h-11 w-full appearance-none rounded-md border px-4 text-sm focus:ring-1 focus:ring-[#7A0C2E]"
              >
                <option value="">Stasiun</option>
                {stations.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.stationName}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              {errors.stationId && (
                <p className="text-xs text-red-500">{errors.stationId}</p>
              )}
            </div>
          </div>

          {/* ACTION */}
          <div className="mt-10 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="h-11 rounded-md bg-[#7A0C2E] px-10 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Submit"}
            </button>
          </div>
        </div>
      </div>

      {/* SUCCESS MODAL */}
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
