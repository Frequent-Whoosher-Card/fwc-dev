"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const petugasMenus = [
  { label: "Daftar Member", path: "/dashboard/petugas" },
  { label: "Redeem Kuota", path: "/dashboard/petugas/redeem" },
  { label: "Stock", path: "/dashboard/petugas/stock" },
  { label: "Transaksi", path: "/dashboard/petugas/transaksi" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-[var(--kcic)] text-white flex flex-col">
      {/* LOGO */}
      <div className="h-20 flex items-center px-6 border-b border-white/20">
        <Image
          src="/assets/images/login3-bg.png"
          alt="Whoosh"
          width={110}
          height={32}
          priority
        />
      </div>

      {/* MENU */}
      <nav className="flex-1 py-6">
        <ul className="space-y-1">
          {petugasMenus.map((menu) => {
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
    </aside>
  );
}
