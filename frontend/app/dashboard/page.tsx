"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const authRaw = localStorage.getItem("auth");

    if (!authRaw) {
      router.replace("/");
      return;
    }

    const auth = JSON.parse(authRaw);

    if (auth.role === "admin") {
      router.replace("/dashboard/admin");
    } else if (auth.role === "petugas") {
      router.replace("/dashboard/petugas");
    } else {
      router.replace("/");
    }
  }, [router]);

  return null;
}
