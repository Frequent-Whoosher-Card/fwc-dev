"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const authRaw = localStorage.getItem("auth");

    if (!authRaw) {
      router.replace("/");
      return;
    }

    const auth = JSON.parse(authRaw);

    if (auth.role === "admin" && pathname.startsWith("/dashboard/petugas")) {
      router.replace("/dashboard/admin");
      return;
    }

    if (auth.role === "petugas" && pathname.startsWith("/dashboard/admin")) {
      router.replace("/dashboard/petugas");
      return;
    }

    setReady(true);
  }, [router, pathname]);

  if (!ready) return null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
