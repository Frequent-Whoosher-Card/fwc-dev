'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '../lib/apiConfig';
import { setupAppCheck, getAppCheckToken, isAppCheckEnabled } from '../lib/firebase';
import { executeTurnstile, isTurnstileEnabled, initializeTurnstile, resetTurnstile } from '../lib/turnstile';
import toast from 'react-hot-toast';
import { Eye, EyeOff, XCircle } from 'lucide-react';

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

  /* =====================
     INIT SECURITY
  ===================== */
  useEffect(() => {
    const init = async () => {
      if (isAppCheckEnabled()) {
        setupAppCheck();
        try {
          await getAppCheckToken();
        } catch {}
      }

      if (isTurnstileEnabled()) {
        await initializeTurnstile('turnstile-container');
      }
    };

    init();
  }, []);

  /* =====================
     LOGIN HANDLER
  ===================== */
  const handleLogin = async () => {
    setUsernameError('');
    setPasswordError('');
    setAuthErrorMessage(null);
    setShowAuthError(false);

    if (!username.trim()) {
      setUsernameError('Please enter your username');
      return;
    }

    if (!password.trim()) {
      setPasswordError('Please enter your password');
      return;
    }

    setIsLoading(true);

    try {
      // App Check
      let appCheckToken = 'disabled';
      if (isAppCheckEnabled()) {
        appCheckToken = (await getAppCheckToken()) ?? '';
        if (!appCheckToken) throw new Error('AppCheck failed');
      }

      // Turnstile
      if (!isTurnstileEnabled()) {
        throw new Error('Turnstile disabled');
      }

      const turnstileToken = await executeTurnstile();
      if (!turnstileToken) throw new Error('Turnstile failed');

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          appCheckToken,
          turnstileToken,
        }),
      });

      const json = await response.json();

      if (!response.ok || !json?.success) {
        const rawMsg = json?.error?.message || 'Login gagal';
        
        // Sanitize technical errors only in production
        const isTechnical = /prisma|database|invocation|connect/i.test(rawMsg);
        const isDev = process.env.NODE_ENV === 'development';
        
        // Show raw message in dev or if it's not a technical error (e.g. wrong password)
        const displayMsg = (isDev || !isTechnical) 
          ? rawMsg 
          : 'Terjadi kesalahan sistem. Silakan coba lagi.';

        setAuthErrorMessage(displayMsg);
        setShowAuthError(true);
        if (isTurnstileEnabled()) resetTurnstile(); // Reset on api error
        setIsLoading(false);
        return;
      }

      /* =====================
         DATA USER (SESUAI API)
      ===================== */
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
          station: {
            id: string;
            stationCode: string;
            stationName: string;
            location: string | null;
          } | null;
        };
        token: string;
      };

      /* =====================
         SIMPAN TOKEN
      ===================== */
      localStorage.setItem('fwc_token', token);

      /* =====================
         USER BASIC
      ===================== */
      localStorage.setItem(
        'fwc_user',
        JSON.stringify({
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          email: user.email,
          role: user.role.roleCode,
          stationId: user.station?.id || null,
        })
      );

      /* =====================
         USER DETAIL (EXTENDABLE)
      ===================== */
      localStorage.setItem(
        'fwc_users',
        JSON.stringify({
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          email: user.email,
          role: {
            code: user.role.roleCode,
            name: user.role.roleName,
          },

          // belum dikirim backend → aman set null
          nip: null,
          phone: null,
          station: user.station || null,
        })
      );

      toast.success('Login berhasil');
      await delay(1000);

      const role = user.role.roleCode.toLowerCase();

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
    } catch (err) {
      const rawMsg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem';

      // Jangan console.error jika cuma turnstile failed (biar ga merah di Next.js)
      if (rawMsg === 'Turnstile failed') {
        console.warn('[Login] Turnstile verification required/pending');
      } else {
        console.error(err);
      }

      const isDev = process.env.NODE_ENV === 'development';

      if (rawMsg === 'Turnstile failed') {
        // Pesan yang lebih natural dan umum di telinga pengguna Indonesia
        const msg = 'Mohon selesaikan verifikasi Captcha terlebih dahulu!';
        setAuthErrorMessage(msg);
      } else {
        setAuthErrorMessage(
          isDev 
            ? rawMsg 
            : 'Terjadi kesalahan sistem'
        );
      }
      setShowAuthError(true);
      if (isTurnstileEnabled()) resetTurnstile(); // Reset on caught error
    } finally {
      setIsLoading(false);
    }
  };

  /* =====================
     UI (TIDAK DIUBAH)
  ===================== */
  return (
    <div className="min-h-screen flex bg-white">
      <div className="hidden md:flex w-1/2 bg-[var(--kcic)] items-center justify-center">
        <Image src="/assets/images/login3-bg.png" alt="Whoosh" width={420} height={160} priority />
      </div>

      <div className="flex w-full md:w-1/2">
        <div className="flex min-h-screen w-full flex-col justify-between px-6 py-10 md:px-12">
          <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-md">
              <div className="text-center mb-10">
                <h1 className="text-3xl font-bold">Welcome Back!</h1>
                <p className="text-gray-500">Sign in to continue</p>
              </div>

              <form
                className="space-y-6"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleLogin();
                }}
              >
                {/* USERNAME */}
                <div className="space-y-1">
                  <input 
                    className="h-12 w-full rounded-md border border-gray-300 bg-gray-50 px-3 text-sm focus:border-[var(--kcic)] focus:outline-none focus:ring-1 focus:ring-[var(--kcic)]" 
                    placeholder="Username" 
                    value={username} 
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (usernameError) setUsernameError('');
                    }} 
                  />
                  {usernameError && <p className="text-xs text-red-500">{usernameError}</p>}
                </div>

                {/* PASSWORD */}
                <div className="space-y-1">
                  <div className="relative">
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      className="h-12 w-full rounded-md border border-gray-300 bg-gray-50 px-3 pr-10 text-sm focus:border-[var(--kcic)] focus:outline-none focus:ring-1 focus:ring-[var(--kcic)]" 
                      placeholder="Password" 
                      value={password} 
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (passwordError) setPasswordError('');
                      }} 
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {passwordError && <p className="text-xs text-red-500">{passwordError}</p>}
                </div>

                {/* BUTTON */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="h-12 w-full rounded-md bg-[var(--kcic)] text-white font-semibold hover:opacity-90 transition-opacity disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-8"
                >
                  {isLoading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Signing In...</span>
                    </>
                  ) : (
                    'Sign In'
                  )}
                </button>

                {/* 🔥 TURNSTILE */}
                {isTurnstileEnabled() && (
                  <div className="flex justify-center pt-2">
                    <div id="turnstile-container" />
                  </div>
                )}
              </form>
            </div>
          </div>

          <p className="text-xs text-gray-400 text-center">© 2026 PT KCIC | All rights reserved</p>
        </div>
      </div>

      {showAuthError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white p-8 rounded-xl shadow-2xl max-w-sm w-full text-center animate-in fade-in zoom-in duration-300">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-6">
              <XCircle className="h-10 w-10 text-[var(--kcic)]" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Login Gagal</h3>
            <p className="text-sm text-gray-500 mt-2 mb-6">{authErrorMessage}</p>
            <button 
              onClick={() => setShowAuthError(false)} 
              className="w-full bg-black text-white hover:bg-gray-800 font-semibold h-11 rounded-lg transition-colors"
            >
              Kembali
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
