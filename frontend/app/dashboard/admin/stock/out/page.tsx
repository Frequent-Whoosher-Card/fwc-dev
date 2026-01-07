'use client';

import { StockProvider } from '@/app/dashboard/superadmin/stock/context/StockContext';
import SuperadminStockOutPage from '@/app/dashboard/superadmin/stock/out/page';

export default function AdminStockOutPage() {
  return (
    <StockProvider>
      <SuperadminStockOutPage />
    </StockProvider>
  );
}
