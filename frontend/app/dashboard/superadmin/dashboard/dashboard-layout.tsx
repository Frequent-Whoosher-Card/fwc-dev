'use client';

import type React from 'react';
import { createContext } from 'react';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

import toast from 'react-hot-toast';
import ClientOnly from '@/components/ui/client-only';

import { LayoutDashboard, CreditCard, UserPlus, Receipt, Users, Menu, X, User, LogOut, IdCard, ArrowDownToLine, ArrowUpNarrowWide, ChevronDown, FolderKanban } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

import { API_BASE_URL } from '@/lib/apiConfig';

/* =========================
   ROLE TYPE
========================= */
type Role = 'superadmin' | 'admin' | 'petugas';

/* =========================
   USER CONTEXT (SINGLE SOURCE)
========================= */
export const UserContext = createContext<{
  userName: string;
  role: Role;
} | null>(null);

/* =========================
   MENU CONFIG
========================= */

/* SUPERADMIN */
const superadminMenuItems = [
  { title: 'Dashboard', icon: LayoutDashboard, href: '/dashboard/superadmin/dashboard' },
  { title: 'Redeem Kuota', icon: IdCard, href: '/dashboard/superadmin/redeemkuota' },
  {
    title: 'Stock Kartu',
    icon: CreditCard,
    href: '/dashboard/superadmin/stock',
    children: [
      { title: 'Stock In', href: '/dashboard/superadmin/stock/in', icon: ArrowDownToLine },
      { title: 'Stock Out', href: '/dashboard/superadmin/stock/out', icon: ArrowUpNarrowWide },
    ],
  },
  { title: 'Generate Number', icon: FolderKanban, href: '/dashboard/superadmin/generatenumber' },

  { title: 'Membership', icon: UserPlus, href: '/dashboard/superadmin/membership' },
  { title: 'Transaksi', icon: Receipt, href: '/dashboard/superadmin/transaksi' },
  { title: 'User', icon: Users, href: '/dashboard/superadmin/user' },
];

/* ADMIN */
const adminMenuItems = [
  { title: 'Dashboard', icon: LayoutDashboard, href: '/dashboard/admin' },
  {
    title: 'Stock Kartu',
    icon: CreditCard,
    href: '/dashboard/admin/stock',
    children: [
      { title: 'Stock In', href: '/dashboard/admin/stock/in', icon: ArrowDownToLine },
      { title: 'Stock Out', href: '/dashboard/admin/stock/out', icon: ArrowUpNarrowWide },
    ],
  },
  { title: 'Membership', icon: UserPlus, href: '/dashboard/admin/membership' },
  { title: 'Transaksi', icon: Receipt, href: '/dashboard/admin/transaksi' },
];

/* PETUGAS */
const petugasMenuItems = [
  { title: 'Membership', icon: UserPlus, href: '/dashboard/petugas/membership' },
  { title: 'Stock', icon: CreditCard, href: '/dashboard/petugas/stock' },
  { title: 'Redeem Kuota', icon: IdCard, href: '/dashboard/petugas/redeemkuota' },
  { title: 'Transaksi', icon: Receipt, href: '/dashboard/petugas/transaksi' },
];

const menuByRole: Record<Role, any[]> = {
  superadmin: superadminMenuItems,
  admin: adminMenuItems,
  petugas: petugasMenuItems,
};

/* =========================
   DASHBOARD LAYOUT
========================= */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const [role, setRole] = useState<Role | null>(null);
  const [userName, setUserName] = useState('User');
  const [loading, setLoading] = useState(true);

  /* =========================
     AUTH VIA TOKEN + /auth/me
  ========================= */
  useEffect(() => {
    const token = localStorage.getItem('fwc_token');

    if (!token) {
      router.replace('/');
      return;
    }

    const loadMe = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error('Unauthorized');
        }

        const json = await res.json();
        const user = json.data;

        const rawRole = user.role.roleCode.toUpperCase();

        const roleMap: Record<string, Role> = {
          SUPERADMIN: 'superadmin',
          ADMIN: 'admin',
          PETUGAS: 'petugas',
          OFFICER: 'petugas',
        };

        const mappedRole = roleMap[rawRole];
        if (!mappedRole) {
          throw new Error(`Unknown role: ${rawRole}`);
        }

        setUserName(user.fullName || user.username);
        setRole(mappedRole);

        const basePath = `/dashboard/${mappedRole}`;
        if (!pathname.startsWith(basePath)) {
          router.replace(basePath);
        }
      } catch (err) {
        console.error('auth/me error:', err);
        localStorage.removeItem('fwc_token');
        router.replace('/');
      } finally {
        setLoading(false);
      }
    };

    loadMe();
  }, [router, pathname]);

  if (loading || !role) {
    return null;
  }

  const menuItems = menuByRole[role] ?? [];

  /* =========================
     LOGOUT
  ========================= */
  const handleLogout = () => {
    toast.success('Logout berhasil');

    setTimeout(() => {
      localStorage.removeItem('fwc_token');
      router.replace('/');
    }, 300);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* SIDEBAR OVERLAY */}
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* SIDEBAR */}
      <aside className={cn('fixed left-0 top-0 z-50 h-full w-64 bg-[#8D1231] transition-transform lg:translate-x-0', sidebarOpen ? 'translate-x-0' : '-translate-x-full')}>
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center px-6 border-b border-white/10">
            <Image src="/logo-putih.svg" alt="logo" width={160} height={40} />
            <Button variant="ghost" size="icon" className="ml-auto lg:hidden text-white" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <nav className="flex-1 space-y-1 p-4">
            {menuItems.map((item) => {
              const hasChildren = !!item.children;
              const isParentActive = pathname === item.href || item.children?.some((child: any) => pathname.startsWith(child.href));

              const isOpen = openMenu === item.title || item.children?.some((child: any) => pathname.startsWith(child.href));

              return (
                <div key={item.title}>
                  <div className={cn('flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium', isParentActive ? 'bg-white/20 text-white' : 'text-white hover:bg-white/10')}>
                    <Link href={item.href} onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 flex-1">
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
                        <ChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
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
                            className={cn('flex items-center gap-3 rounded-lg px-3 py-2 text-sm', isActive ? 'bg-white/20 text-white' : 'text-white/80 hover:bg-white/10')}
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
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>

          <h1 className="flex-1 text-lg font-semibold">Frequent Whoosher Card</h1>

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
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
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