"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Mail, ChevronDown } from "lucide-react";

import {
  getRoles,
  getUserById,
  updateUser,
  RoleItem,
} from "@/lib/services/user.service";
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
   PAGE
====================== */
export default function EditUserPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("id");

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
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  /* ======================
     HELPERS (SAMA DENGAN ADD)
  ====================== */
  const sanitizeNip = (value: string) =>
    value.replace(/\D/g, "").slice(0, 20);

  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  /* ======================
     FETCH INITIAL DATA
  ====================== */
  useEffect(() => {
    if (!userId) {
      alert("Invalid user id");
      router.back();
      return;
    }

    const init = async () => {
      try {
        setPageLoading(true);

        const [userRes, roleRes, stationRes] = await Promise.all([
          getUserById(userId),
          getRoles(),
          getStations(),
        ]);

        const user = userRes.data;

        setForm({
          name: user.fullName ?? "",
          nip: user.nip ?? "",
          username: user.username ?? "",
          email: user.email ?? "",
          phone: user.phone ?? "",
          roleId: user.role?.id ?? "",
          stationId: user.station?.id ?? "",
        });

        const roleItems = Array.isArray(roleRes.data)
          ? roleRes.data
          : roleRes.data?.items ?? [];

        setRoles(roleItems);
        setStations(stationRes.data?.items ?? []);
      } catch (err) {
        console.error("LOAD USER ERROR:", err);
        alert("Failed load user data");
        router.back();
      } finally {
        setPageLoading(false);
      }
    };

    init();
  }, [userId, router]);

  /* ======================
     SUBMIT (UPDATE)
  ====================== */
  const handleSubmit = async () => {
    if (!userId) return;

    const newErrors: Record<string, string> = {};

    if (!form.name || form.name.length < 3)
      newErrors.name = "Name must be at least 3 characters";

    if (!form.nip)
      newErrors.nip = "NIP is required";
    else if (form.nip.length < 6 || form.nip.length > 20)
      newErrors.nip = "NIP must be 6–20 digits";

    if (!form.email)
      newErrors.email = "Email is required";
    else if (!isValidEmail(form.email))
      newErrors.email = "Invalid email format";

    if (!form.phone || form.phone.length < 10)
      newErrors.phone = "Phone number is required";

    if (!form.roleId)
      newErrors.roleId = "Role is required";

    if (!form.stationId)
      newErrors.stationId = "Stasiun is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);

      await updateUser(userId, {
        fullName: form.name,
        email: form.email,
        phone: form.phone, // ✅ SAMA PERSIS DENGAN ADD
        nip: form.nip,
        roleId: form.roleId,
        stationId: form.stationId,
        isActive: true,
      });

      router.push("/dashboard/superadmin/user");
    } catch (err: any) {
      console.error("UPDATE USER ERROR:", err);
      alert(err?.response?.data?.message || "Failed update user");
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="p-8 text-sm text-gray-400">
        Loading user data...
      </div>
    );
  }

  /* ======================
     RENDER
  ====================== */
  return (
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
          <h2 className="text-lg font-semibold">Edit User</h2>
        </div>

        {/* FORM */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* NAME */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Name<span className="ml-1 text-red-500">*</span>
            </label>
            <input
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
              className="h-11 w-full rounded-md border px-4 text-sm"
            />
          </div>

          {/* NIP */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              NIP<span className="ml-1 text-red-500">*</span>
            </label>
            <input
              value={form.nip}
              inputMode="numeric"
              onChange={(e) =>
                setForm({
                  ...form,
                  nip: sanitizeNip(e.target.value),
                })
              }
              className="h-11 w-full rounded-md border px-4 text-sm"
            />
          </div>

          {/* USERNAME */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              value={form.username}
              disabled
              className="h-11 w-full rounded-md border bg-gray-100 px-4 text-sm"
            />
          </div>

          {/* ROLE */}
          <div className="relative">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Role<span className="ml-1 text-red-500">*</span>
            </label>
            <select
              value={form.roleId}
              onChange={(e) =>
                setForm({ ...form, roleId: e.target.value })
              }
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
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Phone Number<span className="ml-1 text-red-500">*</span>
            </label>
            <input
              value={form.phone}
              onChange={(e) =>
                setForm({
                  ...form,
                  phone: e.target.value
                    .replace(/[^\d+]/g, "")
                    .slice(0, 16),
                })
              }
              className="h-11 w-full rounded-md border px-4 text-sm"
            />
          </div>

          {/* EMAIL */}
          <div className="relative md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Email Address<span className="ml-1 text-red-500">*</span>
            </label>
            <input
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
              className="h-11 w-full rounded-md border px-4 pr-10 text-sm"
            />
            <Mail className="absolute right-3 top-[55%] h-4 w-4 text-gray-400" />
          </div>

          {/* STATION */}
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
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
