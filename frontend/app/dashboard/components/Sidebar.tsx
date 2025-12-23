"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const adminMenus = [
  { label: "Dashboard", path: "/dashboard/admin" },
  { label: "Member", path: "/dashboard/admin/member" },
  { label: "Stock", path: "/dashboard/admin/stock" },
  { label: "Transaksi", path: "/dashboard/admin/transaksi" },
  { label: "Petugas", path: "/dashboard/admin/petugas" },
];

const petugasMenus = [
  { label: "Daftar Member", path: "/dashboard/petugas" },
  { label: "Redeem Kuota", path: "/dashboard/petugas/redeem" },
  { label: "Stock", path: "/dashboard/petugas/stock" },
  { label: "Transaksi", path: "/dashboard/petugas/transaksi" },
];

export default function Sidebar() {
  const pathname = usePathname();

  const auth =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("auth") || "{}")
      : {};

  const menus = auth.role === "admin" ? adminMenus : petugasMenus;

  return (
    <aside className="w-64 bg-[var(--kcic)] text-white flex flex-col">
      {/* LOGO */}
      <div className="h-20 flex items-center px-6 border-b border-white/20">
        <Image
          src="/assets/images/login3-bg.png"
          alt="Whoosh"
          width={190}
          height={36}
          priority
        />
      </div>

      {/* MENU */}
      <nav className="flex-1 py-6">
        <ul className="space-y-1">
          {menus.map((menu) => {
            const active = pathname === menu.path;

            return (
              <li key={menu.label} className="relative">
                {active && (
                  <span className="absolute left-0 top-0 h-full w-1 bg-white rounded-r" />
                )}

                <Link
                  href={menu.path}
                  className={`block px-6 py-3 text-sm transition
                    ${
                      active
                        ? "bg-white/20 font-medium"
                        : "hover:bg-white/10 opacity-90"
                    }
                  `}
                >
                  {menu.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* USER INFO */}
      <div className="px-6 py-4 border-t border-white/20 text-sm">
        <div className="font-medium leading-tight">
          {auth.name || "User"}
        </div>
        <div className="text-xs opacity-80 capitalize">
          {auth.role}
        </div>
      </div>
    </aside>
  );
}
