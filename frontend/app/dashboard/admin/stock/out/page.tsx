"use client";

import { StockProvider } from "@/app/dashboard/superadmin/stock/context/StockContext";
import BaseStockOut from "@/components/stock/BaseStockOut";

export default function AdminStockOutPage() {
  return (
    <StockProvider>
      <BaseStockOut programType="FWC" />
    </StockProvider>
  );
}
