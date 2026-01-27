"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function GenerateNumberPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/superadmin/generatenumber/fwc");
  }, [router]);

  return null;
}
