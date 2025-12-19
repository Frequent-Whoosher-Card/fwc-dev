"use client";

import Image from "next/image";
import { Poppins } from "next/font/google";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

export default function LoginPage() {
  return (
    <div className={`relative min-h-screen flex justify-end items-center bg-[#1f1f1f] ${poppins.variable} font-sans p-8`}>

      {/* BORDER MERAH */}
      <div className="absolute inset-0 border-4 border-[#8D1231] rounded-lg pointer-events-none"></div>

      {/* BACKGROUND */}
      <div className="absolute inset-0 p-4">
        <Image
          src="/assets/images/login-bg.jpg"
          alt="Login Background"
          fill
          priority
          className="object-cover rounded-lg"
        />
        {/* OVERLAY */}
        <div className="absolute inset-0 bg-black/30 rounded-lg" />
      </div>

      {/* LOGIN CARD */}
      <div className="relative z-10 flex justify-end w-full">
        <div
          className="bg-white/80 rounded-2xl shadow-lg"
          style={{
            width: 517,
            height: 609,
            maxWidth: "90vw",
          }}
        >
          <div className="p-8 flex flex-col h-full justify-between">

            {/* HEADER */}
            <div>
              <h1 className="text-2xl font-bold text-center mb-2">
                Welcome Back
              </h1>
              <p className="text-center text-gray-700 mb-6">
                Sign in to continue
              </p>
            </div>

            {/* FORM */}
            <form className="space-y-4">
              <input
                type="text"
                placeholder="Username / Email"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#8D1231]"
              />
              <input
                type="password"
                placeholder="Password"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#8D1231]"
              />

              <button
                type="submit"
                className="w-full bg-[#8D1231] text-white py-2 rounded-lg hover:bg-[#701027] transition"
              >
                Sign In
              </button>
            </form>

            {/* FOOTER */}
            <p className="text-center text-xs text-gray-400">
              © {new Date().getFullYear()} PT. KCIC
            </p>

          </div>
        </div>
      </div>

    </div>
  );
}
