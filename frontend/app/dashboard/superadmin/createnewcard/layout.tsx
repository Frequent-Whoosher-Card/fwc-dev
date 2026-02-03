"use client";

import { usePathname } from "next/navigation";
import SwitchTab, { SwitchTabItem } from "@/components/SwitchTab";

export default function CreateNewCardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const tabs: SwitchTabItem[] = [
    {
      label: "FWC",
      path: "/dashboard/superadmin/createnewcard/fwc",
    },
    {
      label: "Voucher",
      path: "/dashboard/superadmin/createnewcard/voucher",
    },
  ];

  const getTitle = () => {
    if (pathname.includes("/fwc")) return "Create New Card - FWC";
    if (pathname.includes("/voucher")) return "Create New Card - Voucher";
    return "Create New Card";
  };

  // Hide Header & Tabs on Edit Page (because Edit form has its own header)
  const isEditPage = pathname.includes("/edit");

  return (
    <div className="space-y-8 py-6">
      {!isEditPage && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6">
          <h2 className="text-lg font-semibold">{getTitle()}</h2>
          <SwitchTab items={tabs} />
        </div>
      )}
      <div>{children}</div>
    </div>
  );
}
