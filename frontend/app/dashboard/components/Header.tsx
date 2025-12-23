"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Header() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const auth =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("auth") || "{}")
      : {};

  const handleLogout = () => {
    localStorage.removeItem("auth");
    router.replace("/");
  };

  return (
    <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-8">
      {/* TITLE */}
      <h1 className="text-lg font-semibold text-gray-800">
        Dashboard Petugas
      </h1>

      {/* USER DROPDOWN */}
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-3"
        >
          {/* Avatar */}
          <div className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold">
            {auth.name?.charAt(0) || "P"}
          </div>

          {/* Name */}
          <div className="text-left">
            <div className="text-sm font-medium">
              {auth.name || "Petugasname"}
            </div>
            <div className="text-xs text-gray-500 capitalize">
              {auth.role}
            </div>
          </div>
        </button>

        {/* DROPDOWN */}
        {open && (
          <div className="absolute right-0 mt-2 w-40 bg-white border rounded-md shadow-md text-sm z-50">
            <button
              className="w-full text-left px-4 py-2 hover:bg-gray-100"
            >
              Akun
            </button>
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
