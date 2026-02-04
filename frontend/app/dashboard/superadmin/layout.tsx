"use client";

import { useEffect } from "react";
import DashboardLayout from "@/app/dashboard/superadmin/dashboard/dashboard-layout";
import { getFcmToken } from "@/lib/firebase";
import { updateFcmToken } from "@/lib/apiConfig";

import { InboxProvider } from "@/context/InboxContext";

export default function SuperadminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    getFcmToken().then((token) => {
      if (token) {
        console.log("🔥 FCM TOKEN:", token);
        updateFcmToken(token).catch((err) =>
          console.error("Failed to sync FCM token", err),
        );
      }
    });
  }, []);

  return (
    <InboxProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </InboxProvider>
  );
}
