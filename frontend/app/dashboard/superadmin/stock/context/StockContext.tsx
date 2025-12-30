'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

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

interface StockContextType {
  stockIn: StockIn[];
  stockOut: StockOut[];

  addStockIn: (data: StockIn) => void;
  updateStockIn: (id: string, data: Omit<StockIn, 'id'>) => void;
  deleteStockIn: (id: string) => void;

  addStockOut: (data: StockOut) => void;
}

const StockContext = createContext<StockContextType | undefined>(undefined);

export function StockProvider({ children }: { children: ReactNode }) {
  const [stockIn, setStockIn] = useState<StockIn[]>([]);
  const [stockOut, setStockOut] = useState<StockOut[]>([]);

  // ADD
  const addStockIn = (data: StockIn) => {
    setStockIn((prev) => [...prev, data]);
  };

  // UPDATE
  const updateStockIn = (
    id: string,
    data: Omit<StockIn, 'id'>
  ) => {
    setStockIn((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, ...data } : item
      )
    );
  };

  // DELETE
  const deleteStockIn = (id: string) => {
    setStockIn((prev) =>
      prev.filter((item) => item.id !== id)
    );
  };

  // STOCK OUT (future)
  const addStockOut = (data: StockOut) => {
    setStockOut((prev) => [...prev, data]);
  };

  return (
    <StockContext.Provider
      value={{
        stockIn,
        stockOut,
        addStockIn,
        updateStockIn,
        deleteStockIn,
        addStockOut,
      }}
    >
      {children}
    </StockContext.Provider>
  );
}

export function useStock() {
  const context = useContext(StockContext);
  if (!context) {
    throw new Error(
      'useStock harus digunakan di dalam StockProvider'
    );
  }
  return context;
}
