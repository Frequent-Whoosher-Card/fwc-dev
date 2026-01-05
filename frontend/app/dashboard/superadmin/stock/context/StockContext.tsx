'use client';

import { createContext, useContext, useMemo, useState, ReactNode } from 'react';

/* =======================
   TYPES
======================= */

export type CardCategory = 'Gold' | 'Silver' | 'KAI';
export type CardType = 'JaBan' | 'JaKa' | 'KaBan' | '';
export type Station = 'Halim' | 'Karawang' | 'Padalarang' | 'Tegalluar';

export type StockOutStatus = 'SENT' | 'RECEIVED' | 'CANCELLED';

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
  station: Station;
  stock: number;
  serialStart: string;
  status: StockOutStatus;
  note?: string;
}

/* ===== Stock All Row ===== */
export interface StockAllRow {
  category: CardCategory;
  type: CardType;
  circulating: number; // total masuk
  active: number; // sent
  inactive: number; // circulating - active
  total: number; // sisa
  unsold: number; // sama dengan total
}

/* =======================
   CONTEXT TYPE
======================= */

interface StockContextType {
  stockIn: StockIn[];
  stockOut: StockOut[];

  addStockIn: (data: StockIn) => void;
  updateStockIn: (id: string, data: Omit<StockIn, 'id'>) => void;
  deleteStockIn: (id: string) => void;

  addStockOut: (data: StockOut) => void;

  getAvailableStock: (category: CardCategory, type?: CardType) => number;
  getStockAll: () => StockAllRow[];
}

const StockContext = createContext<StockContextType | undefined>(undefined);

/* =======================
   PROVIDER
======================= */

export function StockProvider({ children }: { children: ReactNode }) {
  const [stockIn, setStockIn] = useState<StockIn[]>([]);
  const [stockOut, setStockOut] = useState<StockOut[]>([]);

  /* ===== STOCK IN ===== */

  const addStockIn = (data: StockIn) => {
    setStockIn((prev) => [...prev, data]);
  };

  const updateStockIn = (id: string, data: Omit<StockIn, 'id'>) => {
    setStockIn((prev) => prev.map((item) => (item.id === id ? { ...item, ...data } : item)));
  };

  const deleteStockIn = (id: string) => {
    setStockIn((prev) => prev.filter((item) => item.id !== id));
  };

  /* ===== STOCK OUT ===== */

  const addStockOut = (data: StockOut) => {
    setStockOut((prev) => [...prev, data]);
  };

  /* =======================
     AVAILABLE STOCK
  ======================= */

  const getAvailableStock = (category: CardCategory, type?: CardType): number => {
    const totalIn = stockIn.filter((s) => s.category === category && (category === 'KAI' || s.type === type)).reduce((sum, s) => sum + s.stock, 0);

    const totalOut = stockOut.filter((s) => s.category === category && (category === 'KAI' || s.type === type) && s.status !== 'CANCELLED').reduce((sum, s) => sum + s.stock, 0);

    return totalIn - totalOut;
  };

  /* =======================
     STOCK ALL (AGGREGATE)
  ======================= */

  const getStockAll = useMemo(() => {
    return () => {
      const map = new Map<string, StockAllRow>();

      // 1️⃣ Dari Stock In
      stockIn.forEach((item) => {
        const key = `${item.category}-${item.type}`;
        if (!map.has(key)) {
          map.set(key, {
            category: item.category,
            type: item.type,
            circulating: 0,
            active: 0,
            inactive: 0,
            total: 0,
            unsold: 0,
          });
        }
        const row = map.get(key)!;
        row.circulating += item.stock;
        row.total += item.stock;
      });

      // 2️⃣ Kurangi dari Stock Out (SENT)
      stockOut
        .filter((o) => o.status === 'SENT')
        .forEach((item) => {
          const key = `${item.category}-${item.type}`;
          if (!map.has(key)) return;
          const row = map.get(key)!;
          row.active += item.stock;
          row.total -= item.stock;
        });

      // 3️⃣ Hitung sisa
      map.forEach((row) => {
        row.inactive = row.circulating - row.active;
        row.unsold = row.total;
      });

      return Array.from(map.values());
    };
  }, [stockIn, stockOut]);

  return (
    <StockContext.Provider
      value={{
        stockIn,
        stockOut,
        addStockIn,
        updateStockIn,
        deleteStockIn,
        addStockOut,
        getAvailableStock,
        getStockAll,
      }}
    >
      {children}
    </StockContext.Provider>
  );
}

/* =======================
   HOOK
======================= */

export function useStock() {
  const context = useContext(StockContext);
  if (!context) {
    throw new Error('useStock harus digunakan di dalam StockProvider');
  }
  return context;
}
