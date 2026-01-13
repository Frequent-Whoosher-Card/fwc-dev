"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Phone, Mail, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";

import { getUserById, updateUser } from "@/lib/services/user.service";

/* ======================
   TYPES
====================== */
interface UserForm {
  name: string;
  nip: string;
  username: string;
  email: string;
  phone: string;
  roleId: string; // ROLE CODE
  stationId: string; // stationId / stationCode
}

/* ======================
   PAGE
====================== */
export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState<UserForm>({
    name: "",
    nip: "",
    username: "",
    email: "",
    phone: "",
    roleId: "",
    stationId: "",
  });

  /* ======================
     HELPERS
  ====================== */
  const onlyNumber = (v: string) => v.replace(/\D/g, "");
  const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  /* ======================
     FETCH USER DETAIL
  ====================== */
  useEffect(() => {
    if (!userId) return;

    const fetchDetail = async () => {
      try {
        setLoading(true);

        const res = await getUserById(userId);

        setForm({
          name: res.data.fullName ?? "",
          nip: res.data.nip ?? "",
          username: res.data.username ?? "",
          email: res.data.email ?? "",
          phone: res.data.phone ?? "",
  roleId: res.data.role?.id ?? "", // ✅ UUID
          stationId: res.data.stationId ?? "",
        });
      } catch (err) {
        toast.error("Failed to load user data");
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [userId]);

  /* ======================
     SUBMIT UPDATE
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
    if (!form.stationId) newErrors.stationId = "Station is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await updateUser(userId, {
        fullName: form.name,
        nip: form.nip,
        username: form.username,
        email: form.email,
        phone: form.phone,
        roleId: form.roleId,
        stationId: form.stationId,
      });

      toast.success("User updated successfully");
      router.push("/dashboard/superadmin/user");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update user");
    }
  };

  /* ======================
     LOADING STATE
  ====================== */
  if (loading) {
    return (
      <div className="p-6 text-sm text-gray-400">Loading user data...</div>
    );
  }

  /* ======================
     RENDER
  ====================== */
  return (
    <div className="rounded-lg border bg-white p-8">
      {/* HEADER */}
      <div className="mb-8 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-lg font-semibold">Edit User</h2>
      </div>

      {/* FORM */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* NAME */}
        <div>
          <input
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="h-11 w-full rounded-md border px-4 text-sm"
          />
          {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
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
            className="h-11 w-full rounded-md border px-4 text-sm"
          />
          {errors.nip && <p className="text-xs text-red-500">{errors.nip}</p>}
        </div>

        {/* USERNAME */}
        <div>
          <input
            placeholder="Username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            className="h-11 w-full rounded-md border px-4 text-sm"
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
            className="h-11 w-full appearance-none rounded-md border px-4 text-sm"
          >
            <option value="">Role</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="ADMIN">Admin</option>
            <option value="SPV">Supervisor</option>
            <option value="PETUGAS">Petugas</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          {errors.role && <p className="text-xs text-red-500">{errors.role}</p>}
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
            className="h-11 w-full rounded-md border px-4 pr-10 text-sm"
          />
          <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
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
            className="h-11 w-full rounded-md border px-4 pr-10 text-sm"
          />
          <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          {errors.email && (
            <p className="text-xs text-red-500">{errors.email}</p>
          )}
        </div>

        {/* STASIUN */}
        <div className="relative md:col-span-2">
          <select
            value={form.stationId}
            onChange={(e) => setForm({ ...form, stationId: e.target.value })}
            className="h-11 w-full appearance-none rounded-md border px-4 text-sm"
          >
            <option value="">Stasiun</option>
            <option value="HALIM">Halim</option>
            <option value="KARAWANG">Karawang</option>
            <option value="PADALARANG">Padalarang</option>
            <option value="TEGALLUAR">Tegalluar</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          {errors.stasiun && (
            <p className="text-xs text-red-500">{errors.stasiun}</p>
          )}
        </div>
      </div>

      {/* ACTION */}
      <div className="mt-10 flex justify-end">
        <button
          onClick={handleSubmit}
          className="h-11 rounded-md bg-[#7A0C2E] px-10 text-sm font-medium text-white hover:opacity-90"
        >
          Update
        </button>
      </div>
    </div>
  );
}