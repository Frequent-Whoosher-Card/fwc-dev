"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [checkedAuth, setCheckedAuth] = useState(false);

  useEffect(() => {
    const auth = localStorage.getItem("auth");

    if (!auth) {
      router.replace("/login");
    } else {
      setCheckedAuth(true);
    }
  }, [router]);

  // ⛔ Jangan render dashboard sebelum auth dicek
  if (!checkedAuth) {
    return null; // atau loading spinner
  }

  return <>{children}</>;
}
