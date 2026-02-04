"use client";

import toast from "react-hot-toast";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Phone, Mail, ChevronDown, Eye, EyeOff } from "lucide-react";

import SuccessModal from "@/components/user/SuccesModal";
// sesuaikan path aslinya

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
  password?: string;
  confirmPassword?: string;
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
    password: "",
    confirmPassword: "",
  });

  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [stations, setStations] = useState<StationItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  // Simpan data text biasa di state
  const [confirmData, setConfirmData] = useState<Record<string, string>>({});
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // State khusus untuk toggle password di dalam modal
  const [showModalPassword, setShowModalPassword] = useState(false);

  /* ======================
     HELPERS (BEST PRACTICE)
  ====================== */
  const sanitizeNip = (value: string) => value.replace(/\D/g, "").slice(0, 8);

  const sanitizeUsername = (value: string) =>
    value.toLowerCase().replace(/[^a-z0-9_]/g, "");

  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  /* ======================
     FETCH ROLES
  ====================== */
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await getRoles();

        const roleItems = Array.isArray(res.data)
          ? res.data
          : res.data?.items ?? [];

        setRoles(roleItems);
      } catch (err) {
        console.error("fetchRoles error:", err);
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
        const res = await getStations();
        setStations(res.data.items); // ⬅️ INI FIX FINAL
      } catch (err) {
        console.error(err);
        setStations([]);
      }
    };

    fetchStations();
  }, []);

  /* ======================
     VALIDATION & SCROLL
  ====================== */
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!form.name || form.name.trim().length === 0)
      newErrors.name = "Name is required";
    else if (form.name.length > 50)
      newErrors.name = "Name cannot exceed 50 characters";

    if (!form.nip) newErrors.nip = "NIP is required";
    else if (form.nip.length !== 8)
      newErrors.nip = "NIP must be exactly 8 digits";

    if (!form.username) newErrors.username = "Username is required";
    else if (form.username.length < 4)
      newErrors.username = "Username must be at least 4 characters";
    else if (form.username.length > 20)
      newErrors.username = "Username cannot exceed 20 characters";

    if (!form.email) newErrors.email = "Email is required";
    else if (!isValidEmail(form.email))
      newErrors.email = "Invalid email format";

    if (!form.phone) newErrors.phone = "Phone number is required";
    else if (form.phone.length < 10)
      newErrors.phone = "Phone number must be at least 10 digits";
    else if (form.phone.length > 16)
      newErrors.phone = "Phone number cannot exceed 16 digits";

    if (!form.roleId) newErrors.roleId = "Role is required";
    if (!form.stationId) newErrors.stationId = "Stasiun is required";
    
    // PASSWORD VALIDATION
    if (!form.password) {
      newErrors.password = "Password is required";
    } else {
       // Rules: 8 chars, Start with Uppercase, Contain Number
       const passwordRegex = /^[A-Z](?=.*\d).{7,}$/;
       if (!passwordRegex.test(form.password)) {
          newErrors.password = "Password harus 8+ karakter, berawalan Huruf Besar, & mengandung Angka";
       }
    }

    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    return newErrors;
  };

  const handleBlur = (field: string) => {
      setErrors((prev) => {
        if (!prev[field]) return prev;
        const newErr = { ...prev };
        delete newErr[field];
        return newErr;
      });
  };

  const handleValidationAndScroll = () => {
    const formErrors = validateForm();
    const errorKeys = Object.keys(formErrors);
    
    if (errorKeys.length > 0) {
      // USER REQUEST: "satu aja dulu" (Show only the first error)
      const firstKey = errorKeys[0];
      const errorMessage = formErrors[firstKey]; // Get specific message
      const singleError = { [firstKey]: errorMessage };
      
      setErrors(singleError);
      toast.error(errorMessage); // Show specific error in toast
      
      // AUTO SCROLL TO FIRST ERROR
      const element = document.getElementById(firstKey);
      if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          element.focus();
      }
      return false; // Validation Failed
    }
    
    return true; // Validation Success
  };


  /* ======================
     SUBMIT
  ====================== */
  const handleSubmit = async () => {
    // Validation is already checking in button click, but double check
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
         // Re-apply single error logic if somehow bypassed, though button click handles it.
         // Effectively just reject.
        return;
    }

    try {
      setLoading(true);

      const payload = {
        username: form.username,
        password: form.password!,
        fullName: form.name,
        email: form.email,
        phone: form.phone,
        nip: form.nip,
        roleId: form.roleId,
        stationId: form.stationId,
        isActive: true,
      };

      console.log("CREATE USER PAYLOAD >>>", payload);

      await createUser(payload);

      toast.success("User successfully created");
      router.push("/dashboard/superadmin/user");
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || "Failed to create user";

      // Handle duplicate username explicitly
      if (
        errorMessage.includes("Unique constraint failed") && 
        errorMessage.includes("username")
      ) {
        console.warn("Validation Error: Duplicate username detected.");
        
        setErrors((prev) => ({
          ...prev,
          username: "Username sudah digunakan, silakan pilih yang lain",
        }));
        
        // Scroll to username error
        const element = document.getElementById("username");
        if (element) {
             element.scrollIntoView({ behavior: "smooth", block: "center" });
             element.focus();
        }
        
        toast.error("Username sudah terdaftar!");
      } else {
        console.error("CREATE USER ERROR FULL:", err);
        toast.error(errorMessage);
      }
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
                id="name" // ADDED ID
                placeholder="Full name"
                value={form.name}
                onChange={(e) => {
                  setForm({ ...form, name: e.target.value });
                  if (errors.name) setErrors((prev) => { const newErr = { ...prev }; delete newErr.name; return newErr; });
                }}
                onBlur={() => handleBlur("name")}
                className={`h-11 w-full rounded-md border px-4 text-sm ${errors.name ? 'border-red-500' : ''}`}
                autoComplete="off"
              />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
            </div>

            {/* NIP */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                NIP<span className="ml-1 text-red-500">*</span>
              </label>
              <input
                id="nip" // ADDED ID
                placeholder="8 Digit Angka"
                value={form.nip}
                inputMode="numeric"
                onChange={(e) => {
                  setForm({ ...form, nip: sanitizeNip(e.target.value) });
                  if (errors.nip) setErrors((prev) => { const newErr = { ...prev }; delete newErr.nip; return newErr; });
                }}
                onBlur={() => handleBlur("nip")}
                className={`h-11 w-full rounded-md border px-4 text-sm ${errors.nip ? 'border-red-500' : ''}`}
              />
              {errors.nip && <p className="mt-1 text-xs text-red-500">{errors.nip}</p>}
            </div>

            {/* USERNAME */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Username<span className="ml-1 text-red-500">*</span>
              </label>
              <input
                id="username" // ADDED ID
                placeholder="Masukkan username"
                value={form.username}
                onChange={(e) => {
                  setForm({
                    ...form,
                    username: sanitizeUsername(e.target.value),
                  });
                  // Clear error when user types
                  if (errors.username) {
                    setErrors((prev) => {
                      const newErr = { ...prev };
                      delete newErr.username;
                      return newErr;
                    });
                  }
                }}
                onBlur={() => handleBlur("username")}
                className={`h-11 w-full rounded-md border px-4 text-sm ${errors.username ? 'border-red-500' : ''}`}
                autoComplete="off"
              />
              {errors.username && <p className="mt-1 text-xs text-red-500">{errors.username}</p>}
            </div>

            {/* ROLE */}
            <div className="relative">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Role<span className="ml-1 text-red-500">*</span>
              </label>
              <select
                id="roleId" // ADDED ID
                value={form.roleId}
                onChange={(e) => {
                  setForm({ ...form, roleId: e.target.value });
                  if (errors.roleId) setErrors((prev) => { const newErr = { ...prev }; delete newErr.roleId; return newErr; });
                }}
                onBlur={() => handleBlur("roleId")}
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
                id="phone" // ADDED ID
                placeholder="08xxxxxxxx"
                value={form.phone}
                onChange={(e) => {
                  setForm({
                    ...form,
                    phone: e.target.value
                      .replace(/[^\d+]/g, "") // hanya angka & +
                      .slice(0, 16), // + + 15 digit
                  });
                  if (errors.phone) setErrors((prev) => { const newErr = { ...prev }; delete newErr.phone; return newErr; });
                }}
                onBlur={() => handleBlur("phone")}
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
                id="email" // ADDED ID
                placeholder="example@email.com"
                value={form.email}
                onChange={(e) => {
                  setForm({ ...form, email: e.target.value });
                  if (errors.email) setErrors((prev) => { const newErr = { ...prev }; delete newErr.email; return newErr; });
                }}
                onBlur={() => handleBlur("email")}
                className={`h-11 w-full rounded-md border px-4 pr-10 text-sm ${errors.email ? 'border-red-500' : ''}`}
                autoComplete="off"
              />
              <Mail className="absolute right-3 top-[55%] h-4 w-4 text-gray-400" />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
            </div>

            {/* STASIUN */}
            <div className="relative md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Stasiun<span className="ml-1 text-red-500">*</span>
              </label>
              <select
                id="stationId" // ADDED ID
                value={form.stationId}
                onChange={(e) => {
                  setForm({ ...form, stationId: e.target.value });
                  if (errors.stationId) setErrors((prev) => { const newErr = { ...prev }; delete newErr.stationId; return newErr; });
                }}
                onBlur={() => handleBlur("stationId")}
                className={`h-11 w-full appearance-none rounded-md border px-4 text-sm ${errors.stationId ? 'border-red-500' : ''}`}
              >
                <option value="">Pilih stasiun</option>
                {Array.isArray(stations) &&
                  stations.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.stationName}
                    </option>
                  ))}
              </select>
              <ChevronDown className="absolute right-3 top-[55%] h-4 w-4 text-gray-400" />
               {errors.stationId && <p className="mt-1 text-xs text-red-500">{errors.stationId}</p>}
            </div>

            {/* PASSWORD */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Password<span className="ml-1 text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="password" // ADDED ID
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={form.password}
                  onChange={(e) => {
                    const val = e.target.value;
                    setForm({ ...form, password: val });
                    
                    // Real-time validation
                    if (val) {
                      const passwordRegex = /^[A-Z](?=.*\d).{7,}$/;
                      if (!passwordRegex.test(val)) {
                        setErrors((prev) => ({
                          ...prev,
                          password: "Must start with Uppercase, contain Number, min 8 chars",
                        }));
                      } else {
                        setErrors((prev) => {
                          const newErr = { ...prev };
                          delete newErr.password;
                          return newErr;
                        });
                      }
                    } else {
                       setErrors((prev) => {
                          const newErr = { ...prev };
                          delete newErr.password;
                          return newErr;
                        });
                    }
                  }}
                  onBlur={() => handleBlur("password")}
                  className={`h-11 w-full rounded-md border px-4 pr-10 text-sm ${
                    errors.password ? "border-red-500" : ""
                  }`}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              
               {/* PASSWORD REQUIREMENTS CHECKLIST */}
               {form.password && (
                <div className="mt-2 text-xs space-y-1 p-2 bg-gray-50 rounded-md border text-gray-600">
                  <p className="font-semibold mb-1">Syarat Password:</p>
                  <div className={`flex items-center gap-2 ${form.password.length >= 8 ? "text-green-600" : "text-gray-500"}`}>
                    <span>{form.password.length >= 8 ? "✅" : "○"}</span> Minimal 8 Karakter
                  </div>
                  <div className={`flex items-center gap-2 ${/^[A-Z]/.test(form.password) ? "text-green-600" : "text-gray-500"}`}>
                     <span>{/^[A-Z]/.test(form.password) ? "✅" : "○"}</span> Berawalan Huruf Besar
                  </div>
                  <div className={`flex items-center gap-2 ${/\d/.test(form.password) ? "text-green-600" : "text-gray-500"}`}>
                     <span>{/\d/.test(form.password) ? "✅" : "○"}</span> Mengandung Angka
                  </div>
                </div>
               )}

              {errors.password && (
                <p className="mt-1 text-xs text-red-500">{errors.password}</p>
              )}
            </div>

            {/* CONFIRM PASSWORD */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Confirm Password<span className="ml-1 text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="confirmPassword" // ADDED ID
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  value={form.confirmPassword}
                  onChange={(e) => {
                    setForm({ ...form, confirmPassword: e.target.value });
                    if (errors.confirmPassword) setErrors((prev) => { const newErr = { ...prev }; delete newErr.confirmPassword; return newErr; });
                  }}
                  onBlur={() => handleBlur("confirmPassword")}
                  className={`h-11 w-full rounded-md border px-4 pr-10 text-sm ${errors.confirmPassword ? 'border-red-500' : ''}`}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
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
                   <div className={`flex items-center gap-2 ${form.confirmPassword === form.password && form.confirmPassword !== "" ? "text-green-600" : "text-gray-500"}`}>
                     <span>{form.confirmPassword === form.password && form.confirmPassword !== "" ? "✅" : "○"}</span> Password Cocok
                  </div>
                </div>
               )}

              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.confirmPassword}
                </p>
              )}
            </div>
          </div>

          {/* ACTION */}
          <div className="mt-10 flex justify-end">
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                // 1. VALIDATE FIRST
                const isValid = handleValidationAndScroll();
                if (!isValid) return;

                // 2. IF VALID, OPEN MODAL
                setConfirmData({
                  Name: form.name || "-",
                  NIP: form.nip || "-",
                  Username: form.username || "-",
                  Role:
                    roles.find((r) => r.id === form.roleId)?.roleName || "-",
                  "Phone Number": form.phone || "-",
                  "Email Address": form.email || "-",
                  Stasiun:
                    stations.find((s) => s.id === form.stationId)
                      ?.stationName || "-",
                  // Password tidak disimpan di state confirmData karena butuh interaksi
                });

                setShowConfirm(true); 
                setShowModalPassword(false); // Reset toggle modal saat dibuka
              }}
              className="h-11 rounded-md bg-[#7A0C2E] px-10 text-sm text-white disabled:opacity-50"
            >
              {loading ? "Saving..." : "Submit"}
            </button>
          </div>
        </div>
      </div>

      {/* ======================
   SUCCESS MODAL
====================== */}

      {/* ======================
   CONFIRM SAVE MODAL
====================== */}
      <SuccessModal
        open={showConfirm}
        title="Confirm Save"
        message="Please review the user data before saving"
        confirmText="Save"
        data={{
          ...confirmData,
          Password: (
             <div className="flex items-center justify-between">
              <span>
                {showModalPassword ? form.password : "•".repeat(8)}
              </span>
              <button
                type="button"
                onClick={() => setShowModalPassword((prev) => !prev)}
                 className="ml-2 text-gray-400 hover:text-gray-600"
              >
                  {showModalPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          ),
        }}
        onClose={() => {
          setShowConfirm(false);
        }}
        onConfirm={async () => {
          setShowConfirm(false);
          await handleSubmit(); // ✅ API BENAR-BENAR KEKIRIM DI SINI
        }}
      />
    </>
  );
}
