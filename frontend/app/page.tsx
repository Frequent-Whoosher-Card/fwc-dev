"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "../lib/apiConfig";

export default function LoginPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [showAuthError, setShowAuthError] = useState(false);
  const [authErrorMessage, setAuthErrorMessage] = useState<string | null>(null);

  const handleLogin = async () => {
    let valid = true;

    // reset error
    setUsernameError("");
    setPasswordError("");

    // 1️⃣ VALIDASI FIELD KOSONG
    if (!username.trim()) {
      setUsernameError("Please enter your username");
      valid = false;
    }

    if (!password.trim()) {
      setPasswordError("Please enter your password");
      valid = false;
    }

    if (!valid) return;

    // 3️⃣ CALL BACKEND AUTH
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username, // backend expects username/email in this field
          password,
        }),
      });

      if (!response.ok) {
        // Try to read error message from backend
        try {
          const errorJson = await response.json();
          const message =
            errorJson?.error?.message ||
            "Login gagal. Periksa kembali username dan password Anda.";
          setAuthErrorMessage(message);
        } catch {
          setAuthErrorMessage(
            "Login gagal. Periksa kembali username dan password Anda."
          );
        }
        setShowAuthError(true);
        return;
      }

      const json = await response.json();

      if (!json.success || !json.data) {
        const message =
          json?.error?.message ||
          "Login gagal. Periksa kembali username dan password Anda.";
        setAuthErrorMessage(message);
        setShowAuthError(true);
        return;
      }

      const { user, token } = json.data as {
        user: {
          id: string;
          username: string;
          fullName: string;
          email: string | null;
          role: { id: string; roleCode: string; roleName: string };
        };
        token: string;
      };

      const role =
        (user.role.roleCode && user.role.roleCode.toLowerCase()) || "";

      // Note: token disimpan di HTTP-only cookie oleh backend.
      // Frontend hanya menyimpan info ringan untuk kebutuhan UI & routing.
      document.cookie = `fwc_role=${role}; path=/;`;
      localStorage.setItem(
        "auth",
        JSON.stringify({
          role,
          name: user.fullName || user.username,
          email: user.email,
          username: user.username,
        })
      );

      router.push("/dashboard");
    } catch (error) {
      setAuthErrorMessage(
        "Terjadi kesalahan jaringan atau server. Silakan coba beberapa saat lagi."
      );
      setShowAuthError(true);
    }
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
                {/* USERNAME */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    placeholder="username"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setUsernameError("");
                    }}
                    className={`h-11 w-full rounded-md border px-3 text-sm
                    focus:outline-none focus:ring-2
                    ${
                      usernameError
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-300 focus:ring-[var(--kcic)]"
                    }`}
                  />
                  {usernameError && (
                    <p className="mt-2 text-xs text-red-500">
                      {usernameError}
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
              {authErrorMessage ||
                "Maaf, username atau password yang Anda masukkan salah."}
            </p>
            <button
              onClick={() => {
                setShowAuthError(false);
                setAuthErrorMessage(null);
              }}
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
