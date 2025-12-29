'use client';

import toast from 'react-hot-toast';
import type React from 'react';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, CreditCard, UserPlus, Receipt, Users, Menu, X, Bell, User, LogOut, IdCard, ArrowDownToLine, ArrowUpNarrowWide, ChevronDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const menuItems = [
  { title: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { title: 'Redeem Kuota', icon: IdCard, href: '/redeemkuota' },

  {
    title: 'Stock Kartu',
    icon: CreditCard,
    href: '/dashboard/superadmin/stock',
    children: [
      {
        title: 'Stock In',
        href: '/dashboard/superadmin/stock/in',
        icon: ArrowDownToLine,
      },
      {
        title: 'Stock Out',
        href: '/dashboard/superadmin/stock/out',
        icon: ArrowUpNarrowWide,
      },
    ],
  },
  { title: 'Membership', icon: UserPlus, href: '/membership ' },
  { title: 'Transaksi', icon: Receipt, href: '/transaksi' },
  { title: 'User', icon: Users, href: '/user' },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userName, setUserName] = useState('Admin');
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const toggleMenu = (title: string) => {
    setOpenMenu((prev) => (prev === title ? null : title));
  };

  // 🔐 AUTH CHECK
  useEffect(() => {
    const auth = localStorage.getItem('auth');

    if (!auth) {
      router.replace('/');
      return;
    }

    const parsed = JSON.parse(auth);
    setUserName(parsed.name || 'Admin');
  }, [router]);

  // 🚪 LOGOUT
  const handleLogout = () => {
    toast.success('Logout berhasil');

    setTimeout(() => {
      localStorage.removeItem('auth');
      document.cookie = 'fwc_role=; Max-Age=0; path=/;';
      router.replace('/');
    }, 300);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Backdrop mobile */}
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={cn('fixed left-0 top-0 z-50 h-full w-64 bg-[#8D1231] transition-transform lg:translate-x-0', sidebarOpen ? 'translate-x-0' : '-translate-x-full')}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center px-6 border-b">
            <Image src="/logo-putih.svg" alt="logo" width={180} height={40} />
            <Button variant="ghost" size="icon" className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Menu */}
          <nav className="flex-1 space-y-1 p-4">
            {menuItems.map((item) => {
              const hasChildren = !!item.children;

              const isParentActive = pathname === item.href || item.children?.some((child) => pathname.startsWith(child.href));

              const isOpen = openMenu === item.title || item.children?.some((child) => pathname.startsWith(child.href));

              return (
                <div key={`menu-${item.title}`}>
                  {/* ===== PARENT MENU ===== */}
                  <div className={cn('flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium', isParentActive ? 'bg-white/20 text-white' : 'text-white hover:bg-white/10')}>
                    {/* 👉 TITLE (NAVIGATE KE STOCK ALL) */}
                    {item.href ? (
                      <Link href={item.href} onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 flex-1">
                        <item.icon className="h-5 w-5" />
                        {item.title}
                      </Link>
                    ) : (
                      <div className="flex items-center gap-3 flex-1">
                        <item.icon className="h-5 w-5" />
                        {item.title}
                      </div>
                    )}

                    {/* 👉 DROPDOWN TOGGLE (TIDAK NAVIGASI) */}
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

                  {/* ===== SUB MENU ===== */}
                  {hasChildren && isOpen && (
                    <div className="ml-8 mt-1 space-y-1">
                      {item.children!.map((child) => {
                        const isActive = pathname === child.href;

                        return (
                          <Link
                            key={`submenu-${child.href}`}
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

      {/* Content */}
      <div className="lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>

          <h1 className="flex-1 text-lg font-semibold">Frequent Whoosher Card Membership</h1>

          {/* User Dropdown */}
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
        </header>

        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
