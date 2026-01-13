"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SupervisorPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to membership page as default
    router.replace("/dashboard/supervisor/membership");
  }, [router]);

  return null;
}
