"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Mail, ChevronDown, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

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
     HELPERS
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

    if (!form.name || form.name.trim().length === 0)
      newErrors.name = "Name is required";
    else if (form.name.length > 50)
      newErrors.name = "Name cannot exceed 50 characters";

    if (!form.nip)
      newErrors.nip = "NIP is required";
    // NIP validation: Max 8 enforced by input maxLength (not set here but should be implied or added in UI, currently strictly just removing logic validation).
    // Note: Render part has no maxLength prop for NIP in Edit, unlike Create. I should probably add maxLength in render separately or just trust logic.
    // Wait, Create page had maxLength=8 in input. Edit page does NOT have maxLength in input (verified in view_file, line 268 user input). 
    // I should probably clean up logic first.

    if (!form.email)
      newErrors.email = "Email is required";
    else if (!isValidEmail(form.email))
      newErrors.email = "Invalid email format";

    if (!form.phone) newErrors.phone = "Phone number is required";
    else if (form.phone.length > 16)
      newErrors.phone = "Phone number cannot exceed 16 digits";

    if (!form.roleId) newErrors.roleId = "Role is required";
    if (!form.stationId) newErrors.stationId = "Station is required";

    if (form.newPassword) {
       // Rules: 8 chars, Start with Uppercase, Contain Number
       const passwordRegex = /^[A-Z](?=.*\d).{7,}$/;
       if (!passwordRegex.test(form.newPassword)) {
          newErrors.newPassword = "Password harus 8+ karakter, berawalan Huruf Besar, & mengandung Angka";
       }
    }

    if (form.newPassword !== form.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    // CHECK ERRORS
    const errorKeys = Object.keys(newErrors);
    if (errorKeys.length > 0) {
      // USER REQUEST: "satu aja dulu" (Show only the first error)
      const firstKey = errorKeys[0];
      const errorMessage = newErrors[firstKey];
      setErrors({ [firstKey]: errorMessage });
      
      toast.error(errorMessage);
      
      // AUTO SCROLL
      const element = document.getElementById(firstKey);
      if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          element.focus();
      }
      return;
    }

    try {
      setLoading(true);

      const payload = {
        fullName: form.name,
        email: form.email,
        phone: form.phone,
        nip: form.nip,
        roleId: form.roleId,
        stationId: form.stationId,
      };

      await updateUser(userId, payload);

      // UPDATE PASSWORD IF PROVIDED
      if (form.newPassword) {
         await changePassword(userId, {
            newPassword: form.newPassword,
            confirmPassword: form.confirmPassword || "",
         });
      }
      
      toast.success("User updated successfully");
      router.push("/dashboard/superadmin/user");
    } catch (err: any) {
      // Parse error message
      const msg = err?.response?.data?.message || err?.message || "Failed update user";
      
      // Known validation errors (Prisma Unique Constraints or Manual Validation)
      const isUniqueError = msg.includes("Unique constraint") || msg.includes("already exists");
      
      if (isUniqueError) {
         if (msg.toLowerCase().includes("username")) {
            setErrors(prev => ({...prev, username: "Username already taken"}));
            toast.error("Username sudah digunakan! Silakan ganti.");
         } 
         else if (msg.toLowerCase().includes("nip")) {
            setErrors(prev => ({...prev, nip: "NIP already registered"}));
            toast.error("NIP sudah terdaftar! Silakan periksa kembali.");
         }
         else if (msg.toLowerCase().includes("email")) {
            setErrors(prev => ({...prev, email: "Email already registered"}));
            toast.error("Email sudah terdaftar! Gunakan email lain.");
         }
         else if (msg.toLowerCase().includes("phone")) {
            setErrors(prev => ({...prev, phone: "Phone already registered"}));
            toast.error("Nomor HP sudah terdaftar! Gunakan nomor lain.");
         }
         else {
             // Fallback for other unique errors
            toast.error("Data duplikat ditemukan (NIP/Email/Username/Phone). Cek kembali.");
         }
      } else {
         // Unknown errors -> Log full error for debugging and show message
         console.error("UPDATE USER ERROR:", err);
         toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

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

        {/* LOADING STATE */}
        {pageLoading ? (
            <div className="py-20 text-center text-gray-500">Loading user data...</div>
        ) : (
            <>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* NAME */}
            <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                Name<span className="ml-1 text-red-500">*</span>
                </label>
                <input
                id="name"
                value={form.name}
                onChange={(e) => {
                    setForm({ ...form, name: e.target.value });
                    if (errors.name) setErrors((prev) => { const newErr = { ...prev }; delete newErr.name; return newErr; });
                }}
                onBlur={() => {
                   setErrors((prev) => { const n = {...prev}; delete n.name; return n; });
                }}
                className={`h-11 w-full rounded-md border px-4 text-sm ${errors.name ? 'border-red-500' : ''}`}
                />
                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
            </div>

            {/* NIP */}
            <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                NIP<span className="ml-1 text-red-500">*</span>
                </label>
                <input
                id="nip"
                maxLength={8}
                value={form.nip}
                placeholder="8 Digit Angka"
                onChange={(e) => {
                    setForm({ ...form, nip: sanitizeNip(e.target.value) });
                    if (errors.nip) setErrors((prev) => { const newErr = { ...prev }; delete newErr.nip; return newErr; });
                }}
                onBlur={() => {
                   setErrors((prev) => { const n = {...prev}; delete n.nip; return n; });
                }}
                className={`h-11 w-full rounded-md border px-4 text-sm ${errors.nip ? 'border-red-500' : ''}`}
                />
                {errors.nip && <p className="mt-1 text-xs text-red-500">{errors.nip}</p>}
            </div>

            {/* USERNAME (READ ONLY usually) */}
            <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                Username
                </label>
                <input
                id="username"
                value={form.username}
                disabled
                className="h-11 w-full rounded-md border bg-gray-50 px-4 text-sm text-gray-500"
                />
            </div>

            {/* ROLE */}
            <div className="relative">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                Role<span className="ml-1 text-red-500">*</span>
                </label>
                <select
                id="roleId"
                value={form.roleId}
                onChange={(e) => {
                    setForm({ ...form, roleId: e.target.value });
                    if (errors.roleId) setErrors((prev) => { const newErr = { ...prev }; delete newErr.roleId; return newErr; });
                }}
                onBlur={() => {
                   setErrors((prev) => { const n = {...prev}; delete n.roleId; return n; });
                }}
                className={`h-11 w-full appearance-none rounded-md border px-4 text-sm ${errors.roleId ? 'border-red-500' : ''}`}
                >
                <option value="">Pilih role</option>
                {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                    {r.roleName}
                    </option>
                ))}
                </select>
                <ChevronDown className="absolute right-3 top-[55%] h-4 w-4 text-gray-400" />
                {errors.roleId && <p className="mt-1 text-xs text-red-500">{errors.roleId}</p>}
            </div>

            {/* PHONE */}
            <div className="relative md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                Phone Number<span className="ml-1 text-red-500">*</span>
                </label>
                <input
                id="phone"
                value={form.phone}
                onChange={(e) => {
                    setForm({
                    ...form,
                    phone: e.target.value.replace(/[^\d+]/g, "").slice(0, 16),
                    });
                    if (errors.phone) setErrors((prev) => { const newErr = { ...prev }; delete newErr.phone; return newErr; });
                }}
                onBlur={() => {
                   setErrors((prev) => { const n = {...prev}; delete n.phone; return n; });
                }}
                className={`h-11 w-full rounded-md border px-4 pr-10 text-sm ${errors.phone ? 'border-red-500' : ''}`}
                />
                {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
            </div>

            {/* EMAIL */}
            <div className="relative md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                Email Address<span className="ml-1 text-red-500">*</span>
                </label>
                <input
                id="email"
                value={form.email}
                onChange={(e) => {
                    setForm({ ...form, email: e.target.value });
                    if (errors.email) setErrors((prev) => { const newErr = { ...prev }; delete newErr.email; return newErr; });
                }}
                onBlur={() => {
                   setErrors((prev) => { const n = {...prev}; delete n.email; return n; });
                }}
                className={`h-11 w-full rounded-md border px-4 pr-10 text-sm ${errors.email ? 'border-red-500' : ''}`}
                />
                <Mail className="absolute right-3 top-[55%] h-4 w-4 text-gray-400" />
                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
            </div>

            {/* STATION */}
            <div className="relative md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                Station<span className="ml-1 text-red-500">*</span>
                </label>
                <select
                id="stationId"
                value={form.stationId}
                onChange={(e) => {
                    setForm({ ...form, stationId: e.target.value });
                    if (errors.stationId) setErrors((prev) => { const newErr = { ...prev }; delete newErr.stationId; return newErr; });
                }}
                onBlur={() => {
                   setErrors((prev) => { const n = {...prev}; delete n.stationId; return n; });
                }}
                className={`h-11 w-full appearance-none rounded-md border px-4 text-sm ${errors.stationId ? 'border-red-500' : ''}`}
                >
                <option value="">Pilih stasiun</option>
                {stations.map((s) => (
                    <option key={s.id} value={s.id}>
                    {s.stationName}
                    </option>
                ))}
                </select>
                <ChevronDown className="absolute right-3 top-[55%] h-4 w-4 text-gray-400" />
                {errors.stationId && <p className="mt-1 text-xs text-red-500">{errors.stationId}</p>}
            </div>

            {/* CHANGE PASSWORD SECTION */}
            <div className="md:col-span-2 mt-4 pt-4 border-t">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Change Password</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* NEW PASSWORD */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                        New Password
                        </label>
                        <div className="relative">
                            <input
                            id="newPassword"
                            type={showNewPassword ? "text" : "password"}
                            placeholder="Optional"
                            value={form.newPassword}
                            onChange={(e) => {
                                const val = e.target.value;
                                setForm({ ...form, newPassword: val });
                                if (val) {
                                  // Real-time
                                  const passwordRegex = /^[A-Z](?=.*\d).{7,}$/;
                                  if (!passwordRegex.test(val)) {
                                     setErrors(prev => ({...prev, newPassword: "Must start with Uppercase, contain Number, min 8 chars"}));
                                  } else {
                                     setErrors(prev => { const n = {...prev}; delete n.newPassword; return n; });
                                  }
                                } else {
                                     setErrors(prev => { const n = {...prev}; delete n.newPassword; return n; });
                                }
                            }}
                            className={`h-11 w-full rounded-md border px-4 pr-10 text-sm ${errors.newPassword ? 'border-red-500' : ''}`}
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

                        {errors.newPassword && <p className="mt-1 text-xs text-red-500">{errors.newPassword}</p>}
                    </div>

                    {/* CONFIRM PASSWORD */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                        Confirm New Password
                        </label>
                        <div className="relative">
                            <input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm New Password"
                            value={form.confirmPassword}
                            onChange={(e) => {
                                setForm({ ...form, confirmPassword: e.target.value });
                                if (errors.confirmPassword) setErrors(prev => { const n = {...prev}; delete n.confirmPassword; return n; });
                            }}
                            onBlur={() => {
                               setErrors((prev) => { const n = {...prev}; delete n.confirmPassword; return n; });
                            }}
                            className={`h-11 w-full rounded-md border px-4 pr-10 text-sm ${errors.confirmPassword ? 'border-red-500' : ''}`}
                            autoComplete="new-password"
                            />
                             <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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

                        {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>}
                    </div>
                </div>
            </div>

            </div> {/* End Grid */}

            {/* ACTION */}
            <div className="mt-10 flex justify-end">
                <button
                onClick={handleSubmit}
                disabled={loading}
                className="h-11 rounded-md bg-[#7A0C2E] px-10 text-sm text-white disabled:opacity-50 hover:bg-[#5f0923] transition-colors"
                >
                {loading ? "Saving..." : "Save Changes"}
                </button>
            </div>
            </>
        )}
      </div>
    </div>
  );
}
