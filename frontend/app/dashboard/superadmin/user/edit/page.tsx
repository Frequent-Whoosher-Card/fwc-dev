"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Mail, ChevronDown, Eye, EyeOff } from "lucide-react";

import {
  getRoles,
  getUserById,
  updateUser,
  changePassword,
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
  newPassword?: string;
  confirmPassword?: string;
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
    newPassword: "",
    confirmPassword: "",
  });

  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [stations, setStations] = useState<StationItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  /* ======================
     HELPERS (SAMA DENGAN ADD)
  ====================== */
  const sanitizeNip = (value: string) =>
    value.replace(/\D/g, "").slice(0, 20);

  const sanitizeUsername = (value: string) =>
    value.toLowerCase().replace(/[^a-z0-9_]/g, "");

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
          roleId: user.roleId ?? "",
          stationId: user.stationId ?? "",
          newPassword: "",
          confirmPassword: "",
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

    if (!form.stationId)
      newErrors.stationId = "Stasiun is required";

    // PASSWORD VALIDATION (OPTIONAL)
    if (form.newPassword) {
       // Rules: 8 chars, Start with Uppercase, Contain Number
       const passwordRegex = /^[A-Z](?=.*\d).{7,}$/;
       if (!passwordRegex.test(form.newPassword)) {
          newErrors.newPassword = "Password harus 8+ karakter, berawalan Huruf Besar, & mengandung Angka";
       }

       if (form.newPassword !== form.confirmPassword) {
          newErrors.confirmPassword = "Passwords do not match";
       }
    }

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

      // UPDATE PASSWORD IF PROVIDED
      if (form.newPassword) {
         await changePassword(userId, {
            newPassword: form.newPassword,
            confirmPassword: form.confirmPassword || "",
         });
      }

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
              onChange={(e) =>
                setForm({
                  ...form,
                  username: sanitizeUsername(e.target.value),
                })
              }
              className="h-11 w-full rounded-md border px-4 text-sm"
              placeholder="Username"
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
          
           {/* === CHANGE PASSWORD SECTION (OPTIONAL) === */}
           <div className="mt-8 border-t pt-6 md:col-span-2">
            <h3 className="mb-4 text-base font-semibold text-gray-800">
              Change Password <span className="text-xs font-normal text-gray-400">(Optional)</span>
            </h3>

             <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {/* NEW PASSWORD */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Leave empty to keep current"
                    value={form.newPassword}
                    onChange={(e) => {
                      const val = e.target.value;
                      setForm({ ...form, newPassword: val });

                      // Real-time validation
                      if (val) {
                          const passwordRegex = /^[A-Z](?=.*\d).{7,}$/;
                          if (!passwordRegex.test(val)) {
                          setErrors((prev) => ({
                              ...prev,
                              newPassword: "Must start with Uppercase, contain Number, min 8 chars",
                          }));
                          } else {
                          setErrors((prev) => {
                              const newErr = { ...prev };
                              delete newErr.newPassword;
                              return newErr;
                          });
                          }
                      } else {
                          setErrors((prev) => {
                              const newErr = { ...prev };
                              delete newErr.newPassword;
                              return newErr;
                          });
                      }
                    }}
                    className={`h-11 w-full rounded-md border px-4 pr-10 text-sm ${
                      errors.newPassword ? "border-red-500 ring-1 ring-red-500" : ""
                    }`}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                 {errors.newPassword && (
                  <p className="mt-1 text-xs text-red-500">{errors.newPassword}</p>
                )}
                
                {/* PASSWORD REQUIREMENTS CHECKLIST */}
               {form.newPassword && (
                <div className="mt-2 text-xs space-y-1 p-2 bg-gray-50 rounded-md border text-gray-600">
                  <p className="font-semibold mb-1">Syarat Password:</p>
                  <div className={`flex items-center gap-2 ${form.newPassword.length >= 8 ? "text-green-600" : "text-gray-500"}`}>
                    <span>{form.newPassword.length >= 8 ? "✅" : "○"}</span> Minimal 8 Karakter
                  </div>
                  <div className={`flex items-center gap-2 ${/^[A-Z]/.test(form.newPassword) ? "text-green-600" : "text-gray-500"}`}>
                     <span>{/^[A-Z]/.test(form.newPassword) ? "✅" : "○"}</span> Berawalan Huruf Besar
                  </div>
                  <div className={`flex items-center gap-2 ${/\d/.test(form.newPassword) ? "text-green-600" : "text-gray-500"}`}>
                     <span>{/\d/.test(form.newPassword) ? "✅" : "○"}</span> Mengandung Angka
                  </div>
                </div>
               )}
              </div>

                {/* CONFIRM PASSWORD */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    className="h-11 w-full rounded-md border px-4 pr-10 text-sm"
                    disabled={!form.newPassword}
                    autoComplete="new-password" 
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={!form.newPassword}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* CONFIRM PASSWORD CHECKLIST */}
                 {form.confirmPassword && (
                  <div className="mt-2 text-xs space-y-1 p-2 bg-gray-50 rounded-md border text-gray-600">
                    <p className="font-semibold mb-1">Syarat Password:</p>
                    <div className={`flex items-center gap-2 ${form.confirmPassword.length >= 8 ? "text-green-600" : "text-gray-500"}`}>
                      <span>{form.confirmPassword.length >= 8 ? "✅" : "○"}</span> Minimal 8 Karakter
                    </div>
                    <div className={`flex items-center gap-2 ${/^[A-Z]/.test(form.confirmPassword) ? "text-green-600" : "text-gray-500"}`}>
                       <span>{/^[A-Z]/.test(form.confirmPassword) ? "✅" : "○"}</span> Berawalan Huruf Besar
                    </div>
                    <div className={`flex items-center gap-2 ${/\d/.test(form.confirmPassword) ? "text-green-600" : "text-gray-500"}`}>
                       <span>{/\d/.test(form.confirmPassword) ? "✅" : "○"}</span> Mengandung Angka
                    </div>
                    {/* MATCH CHECK */}
                     <div className={`flex items-center gap-2 ${form.confirmPassword === form.newPassword && form.confirmPassword !== "" ? "text-green-600" : "text-gray-500"}`}>
                       <span>{form.confirmPassword === form.newPassword && form.confirmPassword !== "" ? "✅" : "○"}</span> Password Cocok
                    </div>
                  </div>
                 )}

                 {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>
                )}
              </div>
             </div>
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
