'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '../lib/apiConfig';
import { setupAppCheck, getAppCheckToken, isAppCheckEnabled } from '../lib/firebase';
import { executeTurnstile, isTurnstileEnabled, initializeTurnstile } from '../lib/turnstile';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [showAuthError, setShowAuthError] = useState(false);
  const [authErrorMessage, setAuthErrorMessage] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  // Initialize Firebase App Check and Cloudflare Turnstile on component mount
  useEffect(() => {
    const initializeSecurity = async () => {
      // Initialize Firebase App Check
      if (isAppCheckEnabled()) {
        setupAppCheck();
        try {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          await getAppCheckToken();
        } catch (error) {
          console.warn('[App Check] Pre-warm failed, will retry on login');
        }
      }

      // Initialize Cloudflare Turnstile Managed (checkbox terlihat dengan branding Cloudflare)
      if (isTurnstileEnabled()) {
        try {
          // Wait for DOM to be ready
          await new Promise((resolve) => setTimeout(resolve, 100));
          await initializeTurnstile('turnstile-container');
          console.log('[Turnstile] Widget initialized - checkbox should appear');
        } catch (error) {
          console.warn('[Turnstile] Initialization failed:', error);
        }
      }
    };

    initializeSecurity();
  }, []);

  const handleLogin = async () => {
    let valid = true;

    // reset error
    setUsernameError('');
    setPasswordError('');
    setAuthErrorMessage(null);
    setShowAuthError(false);

    // VALIDASI FIELD
    if (!username.trim()) {
      setUsernameError('Please enter your username');
      valid = false;
    }

    if (!password.trim()) {
      setPasswordError('Please enter your password');
      valid = false;
    }

    if (!valid) return;

    setIsLoading(true);

    try {
      // Ensure App Check is initialized before getting token
      if (isAppCheckEnabled()) {
        setupAppCheck();
        // Wait a bit for App Check to initialize if needed
        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      // Get Firebase App Check token (required)
      let appCheckToken: string | null = null;
      if (isAppCheckEnabled()) {
        let retries = 3;
        while (retries > 0) {
          try {
            appCheckToken = await getAppCheckToken();
            if (appCheckToken) {
              break;
            }
          } catch (error) {
            console.warn(`[App Check] Failed to get token, retries left: ${retries - 1}`, error);
            retries--;
            if (retries > 0) {
              await new Promise((resolve) => setTimeout(resolve, 500));
            }
          }
        }

        if (!appCheckToken) {
          console.error('[App Check] Failed to get token after retries');
          setAuthErrorMessage('Gagal memverifikasi aplikasi. Silakan refresh halaman dan coba lagi.');
          setShowAuthError(true);
          setIsLoading(false);
          return;
        }
      } else {
        // App Check disabled - use dummy token for backend compatibility
        appCheckToken = 'disabled';
      }

      // Execute Cloudflare Turnstile (required)
      let turnstileToken: string | null = null;
      if (isTurnstileEnabled()) {
        let retries = 3;
        while (retries > 0) {
          try {
            turnstileToken = await executeTurnstile();
            if (turnstileToken) {
              break;
            }
          } catch (error) {
            console.warn(`[Turnstile] Failed to execute, retries left: ${retries - 1}`, error);
            retries--;
            if (retries > 0) {
              await new Promise((resolve) => setTimeout(resolve, 500));
            }
          }
        }

        if (!turnstileToken) {
          console.error('[Turnstile] Failed to get token after retries');
          setAuthErrorMessage('Verifikasi keamanan tidak lengkap. Pastikan Turnstile checkbox sudah dicentang sebelum login.');
          setShowAuthError(true);
          setIsLoading(false);
          return;
        }
      } else {
        setAuthErrorMessage('Konfigurasi keamanan tidak lengkap. Silakan hubungi administrator.');
        setShowAuthError(true);
        setIsLoading(false);
        return;
      }

      // Prepare request body with required tokens
      const requestBody: {
        username: string;
        password: string;
        appCheckToken: string;
        turnstileToken: string;
      } = {
        username,
        password,
        appCheckToken,
        turnstileToken,
      };

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const json = await response.json();

      // ❌ LOGIN GAGAL
      if (!response.ok || !json?.success) {
        let message = 'Login gagal. Periksa kembali username dan password Anda.';

        if (json?.error?.code === 'AUTH_INVALID') {
          message = 'Username atau password salah.';
        } else if (json?.error?.code === 'ACCOUNT_INACTIVE') {
          message = 'Akun belum aktif. Hubungi administrator.';
        } else if (response.status === 403) {
          // Handle App Check or Turnstile verification failures
          message = json?.error?.message || 'Verifikasi keamanan gagal. Silakan coba lagi.';
        }

        setAuthErrorMessage(message);
        setShowAuthError(true);
        setIsLoading(false);
        return;
      }

      // ✅ LOGIN SUKSES (SESUAI KONTRAK API)
      const { user, token } = json.data as {
        user: {
          id: string;
          username: string;
          fullName: string;
          email: string | null;
          role: {
            id: string;
            roleCode: string;
            roleName: string;
          };
        };
        token: string;
      };

      // 🔑 SIMPAN TOKEN (INI YANG PALING PENTING)
      localStorage.setItem('fwc_token', token);

      // (OPTIONAL) simpan data user basic
      localStorage.setItem(
        'fwc_user',
        JSON.stringify({
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          email: user.email,
          role: user.role?.roleCode,
        })
      );

      toast.success('Login berhasil, selamat datang');
      await delay(1500);
      setIsLoading(false);

      // role sudah ADA di json.data.user
      const role = user.role?.roleCode?.toLowerCase();

      switch (role) {
        case 'superadmin':
          router.push('/dashboard/superadmin/dashboard');
          break;
        case 'admin':
          router.push('/dashboard/admin');
          break;
        case 'petugas':
          router.push('/dashboard/petugas');
          break;
        case 'supervisor':
        case 'spv':
          router.push('/dashboard/supervisor/membership');
          break;
        default:
          router.push('/dashboard');
      }
    } catch (error) {
      setIsLoading(false);

      if (process.env.NODE_ENV === 'development') {
        console.error('Login error:', error);
      }

      setAuthErrorMessage('Terjadi gangguan sistem. Silakan coba beberapa saat lagi.');
      setShowAuthError(true);
    }
  };

  /* ===== UI DI BAWAH TIDAK DIUBAH ===== */

  return (
    <div className="min-h-screen flex bg-white">
      {/* LEFT PANEL */}
      <div className="hidden md:flex w-1/2 bg-[var(--kcic)] items-center justify-center">
        <Image src="/assets/images/login3-bg.png" alt="Whoosh" width={420} height={160} priority />
      </div>

      {/* RIGHT PANEL */}
      <div className="flex w-full md:w-1/2">
        <div className="flex min-h-screen w-full flex-col justify-between px-6 py-10 md:px-12">
          {/* CONTENT */}
          <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-md -translate-y-6 md:-translate-y-10">
              {/* MOBILE LOGO */}
              <div className="md:hidden flex justify-center mb-8">
                <Image src="/assets/images/login3-bg.png" alt="Whoosh" width={180} height={70} />
              </div>

              {/* HEADER */}
              <div className="text-center mb-10 md:mb-12">
                <h1 className="text-[34px] md:text-[38px] font-bold text-gray-900 tracking-tight">Welcome Back!</h1>
                <p className="text-sm md:text-base text-gray-500 mt-2">Sign in to continue</p>
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
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Username</label>
                  <input
                    type="text"
                    placeholder="username"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setUsernameError('');
                    }}
                    className={`h-11 w-full rounded-md border px-3 text-sm
                    focus:outline-none focus:ring-2
                    ${usernameError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-[var(--kcic)]'}`}
                  />
                  {usernameError && <p className="mt-2 text-xs text-red-500">{usernameError}</p>}
                </div>

                {/* PASSWORD */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setPasswordError('');
                      }}
                      className={`h-11 w-full rounded-md border px-3 pr-11 text-sm
                      focus:outline-none focus:ring-2
                      ${passwordError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-[var(--kcic)]'}`}
                    />

                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600">
                      👁
                    </button>
                  </div>

                  {passwordError && <p className="mt-2 text-xs text-red-500">{passwordError}</p>}
                </div>

                {/* Cloudflare Turnstile Managed - Checkbox terlihat dengan branding Cloudflare */}
                {isTurnstileEnabled() && (
                  <div className="flex justify-center">
                    <div id="turnstile-container"></div>
                  </div>
                )}

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
          <p className="text-xs text-gray-400 text-center">© 2026 PT KCIC. All rights reserved</p>
        </div>
      </div>

      {/* POPUP LOGIN GAGAL */}
      {showAuthError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-[320px] rounded-xl bg-white p-6 text-center shadow-lg">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">❌</div>
            <h2 className="text-lg font-semibold text-gray-900">Login Gagal</h2>
            <p className="mt-2 text-sm text-gray-500">{authErrorMessage}</p>
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

      {/* LOADING OVERLAY */}
      {isLoading && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black">
          <div className="flex flex-col items-center gap-4">
            <div className="h-14 w-14 animate-spin-ease rounded-full border-[6px] border-gray-700 border-t-[var(--kcic)]" />
            <span className="text-sm text-gray-400 tracking-wide">Loading</span>
          </div>
        </div>
      )}
    </div>
  );
}
