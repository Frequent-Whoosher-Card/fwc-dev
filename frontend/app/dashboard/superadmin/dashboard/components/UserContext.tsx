'use client';

import { createContext } from 'react';

export interface UserContextType {
  userName?: string;
  role?: 'superadmin' | 'admin' | 'supervisor' | 'petugas';
}

export const UserContext =
  createContext<UserContextType | null>(null);
