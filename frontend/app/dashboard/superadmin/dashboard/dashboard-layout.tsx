"use client";

import type React from "react";
import { createContext } from "react";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import toast from "react-hot-toast";
import ClientOnly from "@/components/ui/client-only";

import {
  Menu,
  X,
  User,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  CreditCard,
  FilePlus,
  Receipt,
  ShoppingCart,
  Users,
  Gift,
  UserCog,
  Inbox,
  ClipboardList,
  Shield,
  FolderKanban,
  UserCircle,
  PercentCircle,
  Briefcase,
  ArrowDownToLine,
  ArrowUpNarrowWide,
  IdCard,
  type LucideIcon,
  Circle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { API_BASE_URL } from "@/lib/apiConfig";
import { MenuService, MenuItem } from "@/lib/services/menuService";

/* =========================
   ICON MAPPING HELPER
========================= */
const resolveIcon = (iconName: string | null): LucideIcon => {
  if (!iconName) return Circle;

  const map: Record<string, LucideIcon> = {
    // Standard Layout & UI
    LayoutDashboard,
    Menu,
    X,
    User,
    LogOut,
    ChevronDown,
    Circle,
    Shield,

    // Feature Icons
    CreditCard,
    FilePlus,
    Receipt,
    ShoppingCart,
    Users,
    Gift,
    UserCog,
    Inbox,
    ClipboardList,

    // RBAC / New Icons
    FolderKanban, // Stok
    UserCircle, // User Management
    PercentCircle, // Redeem
    Briefcase, // Stok Station
    ArrowDownToLine, // Stok Masuk
    ArrowUpNarrowWide, // Stok Keluar
    IdCard, // New Product Card / Stok All
  };

  return map[iconName] || Circle;
};

/* =========================
   ROLE TYPE
========================= */
type Role = "superadmin" | "admin" | "petugas" | "supervisor";

/* =========================
   USER CONTEXT (SINGLE SOURCE)
========================= */
export const UserContext = createContext<{
  userName: string;
  role: Role;
} | null>(null);

/* =========================
   DASHBOARD LAYOUT
========================= */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const [role, setRole] = useState<Role | null>(null);
  const [userName, setUserName] = useState("User");

  // Auth & Menu Loading State
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Dynamic Menu State
  const [menuItems, setMenuItems] = useState<any[]>([]);

  /* =========================
     AUTH VIA TOKEN + /auth/me + FETCH MENU
  ========================= */
  useEffect(() => {
    const token = localStorage.getItem("fwc_token");

    if (!token) {
      router.replace("/");
      return;
    }

    const loadData = async () => {
      try {
        // 1. Fetch User Data
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error("Unauthorized");
        }

        const json = await res.json();
        const user = json.data;

        // 2. Map Role
        const rawRole = (user.role.roleCode || "").toUpperCase();
        const roleMap: Record<string, Role> = {
          SUPERADMIN: "superadmin",
          ADMIN: "admin",
          PETUGAS: "petugas",
          OFFICER: "petugas",
          SUPERVISOR: "supervisor",
          SPV: "supervisor",
        };

        const mappedRole = roleMap[rawRole];
        if (!mappedRole) {
          setAuthError(`Unknown role: ${rawRole}`);
          return;
        }

        setUserName(user.fullName || user.username);
        setRole(mappedRole);

        // 3. Redirect if not in correct dashboard
        const basePath = `/dashboard/${mappedRole}`;
        if (!pathname.startsWith(basePath)) {
          console.warn(
            `[DashboardLayout] Redirecting from ${pathname} to ${basePath}`,
          );
          router.replace(basePath);
        }

        // 4. Fetch Dynamic Menu
        try {
          const menuData = await MenuService.getUserMenu();
          console.log("[DashboardLayout] Raw Menu Data:", menuData);

          // Transform API menu to UI menu structure
          const transformMenu = (items: MenuItem[]): any[] => {
            return items.map((item) => {
              let href = item.route || "#";
              // Replace dynamic :role placeholder
              if (href.includes(":role")) {
                href = href.replace(":role", mappedRole);
              }

              console.log(
                `[DashboardLayout] Transforming: ${item.label} -> ${href} (Role: ${mappedRole})`,
              );

              return {
                title: item.label,
                href: href,
                icon: resolveIcon(item.icon),
                children: item.children
                  ? transformMenu(item.children)
                  : undefined,
              };
            });
          };

          const transformed = transformMenu(menuData);
          console.log("[DashboardLayout] Final Menu Items:", transformed);
          setMenuItems(transformed);
        } catch (menuErr) {
          console.error("Failed to load menu", menuErr);
          // Fallback or empty menu?
          setMenuItems([]);
          toast.error("Gagal memuat menu");
        }
      } catch (err: any) {
        console.error("auth/me error:", err);
        setAuthError(err?.message || "Gagal autentikasi");
        localStorage.removeItem("fwc_token");
        // router.replace('/');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router, pathname]);

  if (loading) {
    return (
      <div
        style={{ padding: 32, color: "#b91c1c", fontWeight: 600, fontSize: 18 }}
      >
        Loading application...
      </div>
    );
  }
  if (authError) {
    return (
      <div
        style={{ padding: 32, color: "#b91c1c", fontWeight: 600, fontSize: 18 }}
      >
        AUTH ERROR: {authError}
        <br />
        <span style={{ fontWeight: 400, fontSize: 14 }}>
          Silakan login kembali.
        </span>
        <Button onClick={() => router.replace("/")} className="ml-4">
          Login
        </Button>
      </div>
    );
  }
  if (!role) {
    return (
      <div
        style={{ padding: 32, color: "#b91c1c", fontWeight: 600, fontSize: 18 }}
      >
        Tidak ada role terdeteksi.
      </div>
    );
  }

  /* =========================
     LOGOUT
  ========================= */
  const handleLogout = () => {
    toast.success("Logout berhasil");

    setTimeout(() => {
      localStorage.removeItem("fwc_token");
      router.replace("/");
    }, 300);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* SIDEBAR OVERLAY */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-64 bg-[#8D1231] transition-transform lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center px-6 border-b border-white/10">
            <Image src="/logo-putih.svg" alt="logo" width={160} height={40} />
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto lg:hidden text-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
            {menuItems.map((item) => {
              const hasChildren = !!item.children && item.children.length > 0;
              const isParentActive =
                pathname === item.href ||
                item.children?.some((child: any) =>
                  pathname.startsWith(child.href),
                );

              // Auto-open if active
              // Note: We might want initial state to respect this
              const isOpen =
                openMenu === item.title ||
                item.children?.some((child: any) =>
                  pathname.startsWith(child.href),
                );

              return (
                <div key={item.title}>
                  <div
                    className={cn(
                      "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isParentActive
                        ? "bg-white/20 text-white"
                        : "text-white hover:bg-white/10",
                    )}
                  >
                    <Link
                      href={hasChildren ? "#" : item.href}
                      onClick={(e) => {
                        if (hasChildren) {
                          e.preventDefault();
                          setOpenMenu(isOpen ? null : item.title);
                        } else {
                          setSidebarOpen(false);
                        }
                      }}
                      className="flex items-center gap-3 flex-1"
                    >
                      <item.icon className="h-5 w-5" />
                      {item.title}
                    </Link>

                    {hasChildren && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setOpenMenu(isOpen ? null : item.title);
                        }}
                        className="ml-2 rounded p-1 hover:bg-white/20"
                      >
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 transition-transform",
                            isOpen && "rotate-180",
                          )}
                        />
                      </button>
                    )}
                  </div>

                  {hasChildren && isOpen && (
                    <div className="ml-8 mt-1 space-y-1">
                      {item.children.map((child: any) => {
                        const isActive = pathname === child.href;
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => setSidebarOpen(false)}
                            className={cn(
                              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                              isActive
                                ? "bg-white/20 text-white"
                                : "text-white/80 hover:bg-white/10",
                            )}
                          >
                            <child.icon className="h-4 w-4" />
                            {child.title}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* CONTENT */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <h1 className="flex-1 text-sm sm:text-base md:text-lg font-semibold truncate pr-2 whitespace-nowrap">
            Frequent Whoosher Card
          </h1>

          <ClientOnly>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  <span className="text-sm font-medium">{userName}</span>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuLabel>Akun</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() =>
                    router.push("/dashboard/superadmin/change-password")
                  }
                  className="cursor-pointer"
                >
                  <User className="mr-2 h-4 w-4" />
                  Ubah Password
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-600 cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </ClientOnly>
        </header>

        {/* USER CONTEXT PROVIDER */}
        <UserContext.Provider value={{ userName, role }}>
          <main className="p-6">{children}</main>
        </UserContext.Provider>
      </div>
    </div>
  );
}
