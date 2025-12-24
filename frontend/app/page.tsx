'use client';

import Image from 'next/image';
import { useState } from 'react';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  // contoh error (nanti dari BE)
  const emailError = '';
  const passwordError = '';

  return (
    <div className="min-h-screen flex bg-white">
      {/* LEFT PANEL (DESKTOP ONLY) */}
      <div className="hidden md:flex w-1/2 bg-[var(--kcic)] items-center justify-center">
        <Image src="/assets/images/login3-bg.png" alt="Whoosh" width={420} height={160} priority />
      </div>

      {/* RIGHT PANEL */}
      <div className="flex w-full md:w-1/2">
        <div className="flex min-h-screen w-full flex-col justify-between px-6 py-10 md:px-12">
          {/* CONTENT */}
          <div className="flex flex-1 items-center justify-center">
            {/* geser konten sedikit ke atas */}
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
              <form className="space-y-6">
                {/* EMAIL */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Email</label>
                  <input
                    type="email"
                    placeholder="username@gmail.com"
                    className={`h-11 w-full rounded-md border px-3 text-sm
                    focus:outline-none focus:ring-2
                    ${emailError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-[var(--kcic)]'}`}
                  />

                  {emailError && <p className="mt-2 text-xs text-red-500">{emailError}</p>}
                </div>

                {/* PASSWORD */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Password</label>

                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
                      className={`h-11 w-full rounded-md border px-3 pr-11 text-sm
                      focus:outline-none focus:ring-2
                      ${passwordError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-[var(--kcic)]'}`}
                    />

                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600">
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.7 10.7a3 3 0 104.24 4.24M2 12s4.48 7 10 7c1.55 0 3.03-.37 4.38-1.03M6.61 6.61A18.2 18.2 0 002 12" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M1.5 12S6 5 12 5s10.5 7 10.5 7-4.5 7-10.5 7S1.5 12 1.5 12z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>

                  {passwordError && <p className="mt-2 text-xs text-red-500">{passwordError}</p>}
                </div>

                {/* BUTTON */}
                <button
                  type="button"
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
    </div>
  );
}
