"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "../../../lib/apiConfig";
import { useAuthClient } from "../../../hooks/useAuthClient";
import toast from "react-hot-toast";

export default function Header() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const auth = useAuthClient();

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
    } catch (error) {
      // silent fail
    } finally {
      localStorage.removeItem("auth");
      document.cookie = "fwc_role=; path=/; max-age=0";
      toast.success("Berhasil logout");
      router.replace("/");
    }
  };

  return (
    <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-8">
      {/* TITLE */}
      <h1 className="text-lg font-semibold text-gray-800">
        Frequent Whoosher Card
      </h1>

      {/* RIGHT SECTION */}
      <div className="flex items-center gap-6">
        {/* USER DROPDOWN */}
        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-3"
          >
            <div className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold">
              {(auth?.name || auth?.username)?.charAt(0) || "A"}
            </div>

            <div className="text-left hidden sm:block">
              <div className="text-sm font-medium">
                {auth?.name || auth?.username || "Admin"}
              </div>
              <div className="text-xs text-gray-500 capitalize">
                {auth?.role}
              </div>
            </div>
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-40 bg-white border rounded-md shadow-md text-sm z-50">
              <button className="w-full text-left px-4 py-2 hover:bg-gray-100">
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
      </div>
    </header>
  );
}
