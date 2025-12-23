"use client";

import { useRouter } from "next/navigation";

export default function Header() {
  const router = useRouter();
  const auth =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("auth") || "{}")
      : {};

  const handleLogout = () => {
    localStorage.removeItem("auth");
    router.replace("/");
  };

  return (
    <header className="h-16 bg-white border-b flex items-center justify-between px-6">
      <h1 className="font-semibold capitalize">
        Dashboard {auth.role}
      </h1>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="text-sm font-medium">{auth.name}</div>
          <div className="text-xs text-gray-500">{auth.role}</div>
        </div>

        <button
          onClick={handleLogout}
          className="text-sm px-3 py-1 border rounded"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
