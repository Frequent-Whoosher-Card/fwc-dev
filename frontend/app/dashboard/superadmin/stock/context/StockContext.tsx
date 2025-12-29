'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

/* =======================
   TYPE DEFINITIONS
======================= */

export type CardCategory = 'Gold' | 'Silver' | 'KAI';
export type CardType = 'JaBan' | 'JaKa' | 'KaBan' | '';

export interface StockIn {
  id: string;
  tanggal: string;
  category: CardCategory;
  type: CardType;
  stock: number;
}

export interface StockOut {
  id: string;
  tanggal: string;
  category: CardCategory;
  type: CardType;
  stock: number;
  station: 'Halim' | 'Karawang' | 'Padalarang' | 'Tegalluar';
}

/* =======================
   CONTEXT TYPE
======================= */

interface StockContextType {
  stockIn: StockIn[];
  stockOut: StockOut[];
  addStockIn: (data: StockIn) => void;
  addStockOut: (data: StockOut) => void;
}

/* =======================
   CREATE CONTEXT
======================= */

const StockContext = createContext<StockContextType | undefined>(undefined);

/* =======================
   PROVIDER
======================= */

export function StockProvider({ children }: { children: ReactNode }) {
  const [stockIn, setStockIn] = useState<StockIn[]>([]);
  const [stockOut, setStockOut] = useState<StockOut[]>([]);

  const addStockIn = (data: StockIn) => {
    setStockIn((prev) => [...prev, data]);
  };

  const addStockOut = (data: StockOut) => {
    setStockOut((prev) => [...prev, data]);
  };

  return (
    <StockContext.Provider
      value={{
        stockIn,
        stockOut,
        addStockIn,
        addStockOut,
      }}
    >
      {children}
    </StockContext.Provider>
  );
}

/* =======================
   CUSTOM HOOK
======================= */

export function useStock() {
  const context = useContext(StockContext);
  if (!context) {
    throw new Error('useStock harus digunakan di dalam StockProvider');
  }
  return context;
}
