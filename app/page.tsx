"use client";

import Image from "next/image";
import { Poppins, Inter } from "next/font/google";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});

export default function LoginPage() {
  return (
    <div
      className={`relative min-h-screen flex justify-end items-center ${poppins.variable} font-sans`}
    >
      {/* ===== LAYER 1: BORDER MERAH ===== */}
      <div className="absolute inset-0 bg-[#8D1231]" />

      {/* ===== LAYER 2: BACKGROUND IMAGE ===== */}
      <div className="absolute inset-0 m-6 rounded-xl overflow-hidden">
        <Image
          src="/assets/images/login2-bg.jpg"
          alt="Login Background"
          fill
          priority
          className="object-cover"
        />
      </div>

      <div className="absolute" style={{ top: "120px", left: "120px" }}>
  <span className={`block text-3xl md:text-4xl  text-white leading-snug ${inter.variable}`}>
    WHOOSH CARD
  </span>
  <span className={`block text-3xl md:text-4xl  text-white leading-snug ${inter.variable}`}>
    MEMBER ACCESS
  </span>
</div>


      {/* ===== LAYER 4: LOGIN CARD ===== */}
      <div className="relative z-10 flex w-full justify-end items-center p-8">
        <div
          className="bg-white/30 backdrop-blur-md rounded-2xl shadow-xl flex flex-col"
          style={{
            width: 517,
            height: 609,
            maxWidth: "90vw",
            padding: "55px 61px",
          }}
        >
          {/* HEADER */}
          <div className="flex flex-col gap-2 mb-4">
            <h1 className="text-2xl font-bold text-center">Welcome Back!</h1>
            <p className="text-center text-gray-700 text-sm">Sign in to continue</p>
          </div>

          {/* FORM */}
          <form className="flex flex-col gap-3 bg-">
            <input
              type="text"
              placeholder="example@gmail.com"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#8D1231] bg-white"
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#8D1231] bg-white"
            />
            <button
              type="submit"
              className="w-full bg-[#8D1231] text-white py-2 rounded-lg hover:bg-[#701027] transition"
            >
              Sign In
            </button>
          </form>

          {/* FOOTER */}
          <p className="text-center text-xs text-gray-400 mt-auto">
            © {new Date().getFullYear()} PT. KCIC
          </p>
        </div>
      </div>
    </div>
  );
}
