'use client';

import { StockProvider } from './context/StockContext';

export default function StockLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StockProvider>{children}</StockProvider>;
}
