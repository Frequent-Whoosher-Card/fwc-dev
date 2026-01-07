'use client';

import { createContext } from 'react';

export interface UserContextType {
  userName?: string;
}

export const UserContext =
  createContext<UserContextType | null>(null);
