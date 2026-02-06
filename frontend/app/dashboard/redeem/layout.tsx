"use client";

import { DashboardAuthProvider, useDashboardAuth } from "@/context/DashboardAuthContext";
import { InboxProvider } from "@/context/InboxContext";
import { useEffect, useState } from "react";
import { getFcmToken } from "@/lib/firebase";
import { updateFcmToken } from "@/lib/apiConfig";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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
  Home,
  Settings,
  Database,
  Package,
  Truck,
  FileText,
  Layout,
  List,
  Plus,
  Search,
  History,
  LogIn,
  Wallet,
  BarChart3,
  Activity,
  BadgePercent,
  TicketCheck,
  Warehouse,
  Globe,
  Circle,
  ArrowLeftRight,
  type LucideIcon,
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

/* =========================
   ICON MAPPING HELPER
========================= */
const resolveIcon = (iconName: string | null): LucideIcon => {
  if (!iconName) return Circle;

  const map: Record<string, LucideIcon> = {
    // Standard Layout & UI
    layoutdashboard: LayoutDashboard,
    menu: Menu,
    x: X,
    user: User,
    logout: LogOut,
    chevrondown: ChevronDown,
    circle: Circle,
    shield: Shield,
    home: Home,
    settings: Settings,
    layout: Layout,
    list: List,
    plus: Plus,
    search: Search,

    // Feature Icons
    creditcard: CreditCard,
    fileplus: FilePlus,
    receipt: Receipt,
    shoppingcart: ShoppingCart,
    users: Users,
    gift: Gift,
    usercog: UserCog,
    inbox: Inbox,
    clipboardlist: ClipboardList,
    database: Database,
    package: Package,
    truck: Truck,
    filetext: FileText,
    history: History,
    login: LogIn,
    wallet: Wallet,
    barchart3: BarChart3,
    activity: Activity,
    badgepercent: BadgePercent,
    ticketcheck: TicketCheck,
    warehouse: Warehouse,
    globe: Globe,

    // RBAC / New Icons
    folderkanban: FolderKanban, // Stok
    usercircle: UserCircle, // User Management
    percentcircle: PercentCircle, // Redeem
    briefcase: Briefcase, // Stok Station
    arrowdowntoline: ArrowDownToLine, // Stok Masuk
    arrowupnarrowwide: ArrowUpNarrowWide, // Stok Keluar
    arrowleftright: ArrowLeftRight,
    transfer: ArrowLeftRight,
    idcard: IdCard,
    newproduct: IdCard,
    createnewproduct: IdCard,
    buatprodukbaru: IdCard,
  };

  const normalized = iconName.toLowerCase().replace(/[^a-z0-9]/g, "");
  return map[normalized] || Circle;
};

/**
 * Simple unified dashboard layout matching existing style
 */
function UnifiedRedeemLayoutInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, permissions, menu, loading } = useDashboardAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  useEffect(() => {
    getFcmToken().then((token) => {
      if (token) {
        console.log("🔥 FCM TOKEN (Unified):", token);
        updateFcmToken(token).catch((err) =>
          console.error("Failed to sync FCM token", err)
        );
      }
    });
  }, []);

  // Show loading while auth initializes
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    const token = typeof window !== "undefined" ? localStorage.getItem("fwc_token") : null;
    
    if (!token) {
      console.log("⚠️ No token, redirecting to login...");
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
      return null;
    }
    
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Failed to load user data</h2>
          <p className="text-gray-600 mb-4">Please try refreshing the page</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    setTimeout(() => {
      localStorage.removeItem("fwc_token");
      localStorage.removeItem("fwc_user");
      router.push("/");
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

      {/* SIDEBAR - Exact same style as existing */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-64 bg-[#8D1231] transition-transform lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo Header */}
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

          {/* Menu Items */}
          <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
            {menu.map((item) => {
              const hasChildren = !!item.children && item.children.length > 0;
              const Icon = resolveIcon(item.icon);
              const isParentActive =
                pathname === item.route ||
                item.children?.some((child) =>
                  pathname.startsWith(child.route || ""),
                );

              const isOpen =
                openMenu === item.label ||
                item.children?.some((child) =>
                  pathname.startsWith(child.route || ""),
                );

              return (
                <div key={item.label}>
                  <div
                    className={cn(
                      "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isParentActive
                        ? "bg-white/20 text-white"
                        : "text-white hover:bg-white/10",
                    )}
                  >
                    <Link
                      href={hasChildren ? "#" : (item.route || "#")}
                      onClick={(e) => {
                        if (hasChildren) {
                          e.preventDefault();
                          setOpenMenu(isOpen ? null : item.label);
                        } else {
                          setSidebarOpen(false);
                        }
                      }}
                      className="flex items-center gap-3 flex-1"
                    >
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </Link>

                    {hasChildren && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setOpenMenu(isOpen ? null : item.label);
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
                      {item.children?.map((child) => {
                        const ChildIcon = resolveIcon(child.icon);
                        const isActive = pathname === child.route;
                        return (
                          <Link
                            key={child.route}
                            href={child.route || "#"}
                            onClick={() => setSidebarOpen(false)}
                            className={cn(
                              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                              isActive
                                ? "bg-white/20 text-white"
                                : "text-white/80 hover:bg-white/10",
                            )}
                          >
                            <ChildIcon className="h-4 w-4" />
                            {child.label}
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

      {/* CONTENT - Exact same structure as existing */}
      <div className="lg:pl-64">
        {/* Header/Navbar */}
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

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 h-9"
                >
                  <User className="h-5 w-5" />
                  <span className="hidden sm:inline text-sm font-medium">
                    {user.fullName || user.username}
                  </span>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() =>
                    router.push(`/dashboard/${user.role.roleCode}/change-password`)
                  }
                  className="cursor-pointer"
                >
                  <User className="mr-2 h-4 w-4" />
                  Change Password
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
          </div>
        </header>

        {/* Main Content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}

/**
 * Layout wrapper for unified redeem page
 * Provides auth context only for this route, not affecting role-specific routes
 */
export default function UnifiedRedeemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardAuthProvider>
      <InboxProvider>
        <UnifiedRedeemLayoutInner>{children}</UnifiedRedeemLayoutInner>
      </InboxProvider>
    </DashboardAuthProvider>
  );
}
