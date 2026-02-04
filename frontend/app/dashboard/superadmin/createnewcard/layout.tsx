"use client";

import { usePathname } from "next/navigation";

export default function CreateNewCardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const getTitle = () => {
    if (pathname.includes("/edit")) return "Edit Product Card";
    return "Create New Card";
  };

  return (
    <div className="py-6">
      <div>{children}</div>
    </div>
  );
}
