'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '../lib/apiConfig';
import { setupAppCheck, getAppCheckToken, isAppCheckEnabled } from '../lib/firebase';
import { executeTurnstile, isTurnstileEnabled, initializeTurnstile, resetTurnstile } from '../lib/turnstile';
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
        setAuthErrorMessage(json?.error?.message || 'Login gagal');
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
      console.error(err);
      setAuthErrorMessage('Terjadi kesalahan sistem');
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
                <input className="h-11 w-full rounded-md border px-3 text-sm" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />

                {/* PASSWORD */}
                <input type={showPassword ? 'text' : 'password'} className="h-11 w-full rounded-md border px-3 text-sm" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />

                {/* BUTTON */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="h-12 w-full rounded-md bg-[var(--kcic)] text-white font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

                {/* 🔥 TURNSTILE DI BAWAH BUTTON */}
                {isTurnstileEnabled() && (
                  <div className="flex justify-center pt-2">
                    <div id="turnstile-container" />
                  </div>
                )}
              </form>
            </div>
          </div>

          <p className="text-xs text-gray-400 text-center">© 2026 PT KCIC</p>
        </div>
      </div>

      {showAuthError && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl text-center">
            <h3 className="font-semibold">Login Gagal</h3>
            <p className="text-sm mt-2">{authErrorMessage}</p>
            <button onClick={() => setShowAuthError(false)} className="mt-4 bg-black text-white px-4 py-2 rounded">
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
