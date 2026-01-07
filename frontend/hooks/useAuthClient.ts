"use client";

import { useEffect, useState } from "react";

type AuthState = {
  role?: string;
  name?: string;
  email?: string | null;
  username?: string;
};

export function useAuthClient() {
  const [auth, setAuth] = useState<AuthState | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem("auth");
      if (!raw) {
        setAuth(null);
        return;
      }
      const parsed = JSON.parse(raw) as AuthState;
      setAuth(parsed);
    } catch {
      setAuth(null);
    }
  }, []);

  return auth;
}







