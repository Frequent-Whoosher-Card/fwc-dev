"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [showAuthError, setShowAuthError] = useState(false);

  const handleLogin = () => {
    let valid = true;

    // reset error
    setEmailError("");
    setPasswordError("");

    // 1️⃣ VALIDASI FIELD KOSONG
    if (!email.trim()) {
      setEmailError("Please enter your email");
      valid = false;
    }

    if (!password.trim()) {
      setPasswordError("Please enter your password");
      valid = false;
    }

    if (!valid) return;

    // 2️⃣ VALIDASI FORMAT EMAIL (CUSTOM, BUKAN BROWSER)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    // 3️⃣ DUMMY AUTH CHECK
    let role = "";
let name = "";

if (email === "admin@fwc.id" && password === "admin123") {
  role = "admin";
  name = "Admin FWC";
} else if (email === "petugas@fwc.id" && password === "petugas123") {
  role = "petugas";
  name = "Petugasname";
} else {
  setShowAuthError(true);
  return;
}

localStorage.setItem(
  "auth",
  JSON.stringify({
    token: "dummy-token",
    role,
    name,
    email,
  })
);

// setelah ini redirect ke /dashboard


    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* LEFT PANEL */}
      <div className="hidden md:flex w-1/2 bg-[var(--kcic)] items-center justify-center">
        <Image
          src="/assets/images/login3-bg.png"
          alt="Whoosh"
          width={420}
          height={160}
          priority
        />
      </div>

      {/* RIGHT PANEL */}
      <div className="flex w-full md:w-1/2">
        <div className="flex min-h-screen w-full flex-col justify-between px-6 py-10 md:px-12">
          {/* CONTENT */}
          <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-md -translate-y-6 md:-translate-y-10">
              {/* MOBILE LOGO */}
              <div className="md:hidden flex justify-center mb-8">
                <Image
                  src="/assets/images/login3-bg.png"
                  alt="Whoosh"
                  width={180}
                  height={70}
                />
              </div>

              {/* HEADER */}
              <div className="text-center mb-10 md:mb-12">
                <h1 className="text-[34px] md:text-[38px] font-bold text-gray-900 tracking-tight">
                  Welcome Back!
                </h1>
                <p className="text-sm md:text-base text-gray-500 mt-2">
                  Sign in to continue
                </p>
              </div>

              {/* FORM */}
              <form
                noValidate
                className="space-y-6"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleLogin();
                }}
              >
                {/* EMAIL */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Email
                  </label>
                  <input
                    type="text"
                    placeholder="username@gmail.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailError("");
                    }}
                    className={`h-11 w-full rounded-md border px-3 text-sm
                    focus:outline-none focus:ring-2
                    ${
                      emailError
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-300 focus:ring-[var(--kcic)]"
                    }`}
                  />
                  {emailError && (
                    <p className="mt-2 text-xs text-red-500">
                      {emailError}
                    </p>
                  )}
                </div>

                {/* PASSWORD */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setPasswordError("");
                      }}
                      className={`h-11 w-full rounded-md border px-3 pr-11 text-sm
                      focus:outline-none focus:ring-2
                      ${
                        passwordError
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:ring-[var(--kcic)]"
                      }`}
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      👁
                    </button>
                  </div>

                  {passwordError && (
                    <p className="mt-2 text-xs text-red-500">
                      {passwordError}
                    </p>
                  )}
                </div>

                {/* BUTTON */}
                <button
                  type="submit"
                  className="h-12 w-full bg-[var(--kcic)] text-white rounded-md
                  font-semibold text-sm tracking-wide hover:opacity-90 transition"
                >
                  Sign In
                </button>
              </form>
            </div>
          </div>

          {/* FOOTER */}
          <p className="text-xs text-gray-400 text-center">
            © 2026 PT KCIC. All rights reserved
          </p>
        </div>
      </div>

      {/* POPUP LOGIN GAGAL */}
      {showAuthError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-[320px] rounded-xl bg-white p-6 text-center shadow-lg">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              ❌
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Login Gagal
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Maaf, email atau password yang Anda masukkan salah.
            </p>
            <button
              onClick={() => setShowAuthError(false)}
              className="mt-6 h-10 w-full rounded-md bg-black text-white text-sm font-semibold"
            >
              Kembali
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
