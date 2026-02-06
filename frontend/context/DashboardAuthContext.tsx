"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { getUserMenu, type MenuItem } from "@/lib/services/permission.service";

interface User {
  id: string;
  fullName: string;
  username: string;
  email: string;
  role: {
    roleName: string;
    roleCode: string;
  };
}

interface DashboardAuthContextType {
  user: User | null;
  permissions: string[];
  menu: MenuItem[];
  loading: boolean;
  logout: () => void;
}

const DashboardAuthContext = createContext<DashboardAuthContextType | undefined>(undefined);

/**
 * Global auth provider for unified dashboard pages
 * Fetches user info, menu, and permissions from backend
 */
export function DashboardAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem("fwc_token");
        if (!token) {
          console.log("⚠️ No token found");
          setLoading(false);
          return;
        }

        console.log("🔑 Token found, fetching user data...");

        // Fetch user data from /auth/me (correct endpoint)
        const userRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3041"}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!userRes.ok) {
          console.error("❌ Failed to fetch user:", userRes.status, userRes.statusText);
          throw new Error("Failed to fetch user");
        }
        
        const userData = await userRes.json();
        console.log("✅ User data fetched:", userData.data?.name);
        setUser(userData.data);

        // Fetch menu and permissions
        console.log("🔑 Fetching menu and permissions...");
        const menuData = await getUserMenu();
        console.log("✅ Menu and permissions fetched:", menuData.data.permissions.length, "permissions");
        setMenu(menuData.data.menu);
        setPermissions(menuData.data.permissions);
      } catch (error) {
        console.error("❌ Auth init error:", error);
        // Don't clear user state - just log error and let page decide what to do
        // User can still see the page if token is valid
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const logout = () => {
    localStorage.removeItem("fwc_token");
    setUser(null);
    setPermissions([]);
    setMenu([]);
    window.location.href = "/";
  };

  return (
    <DashboardAuthContext.Provider value={{ user, permissions, menu, loading, logout }}>
      {children}
    </DashboardAuthContext.Provider>
  );
}

/**
 * Hook to access auth context in unified pages
 */
export function useDashboardAuth() {
  const context = useContext(DashboardAuthContext);
  if (!context) {
    throw new Error("useDashboardAuth must be used within DashboardAuthProvider");
  }
  return context;
}
