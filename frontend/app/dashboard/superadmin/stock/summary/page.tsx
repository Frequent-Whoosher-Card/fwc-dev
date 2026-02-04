"use client";

import { useState } from "react";
import ProductTypeSelector from "@/components/ProductTypeSelector";
import { ProductType } from "@/lib/services/product-type.service";
import BaseStockSummary from "@/components/stock/BaseStockSummary";
import { ProgramType } from "@/lib/services/card.base.service";

export default function StockSummaryPage() {
  const [selectedProductType, setSelectedProductType] = useState<
    ProductType | undefined
  >(undefined);

  const handleProductTypeChange = (val: string, type?: ProductType) => {
    setSelectedProductType(type);
  };

  const programType = (selectedProductType?.programType ||
    "FWC") as ProgramType;

  return (
    <div className="space-y-6 pt-6 -mt-6">
      <div className="flex items-center gap-4 px-6 pt-6">
        <h2 className="text-lg font-semibold">Stock Summary</h2>
        <ProductTypeSelector
          value={selectedProductType?.id}
          onChange={handleProductTypeChange}
          placeholder="Pilih Produk"
          className="w-[180px] border-[#8D1231] text-[#8D1231] placeholder:text-[#8D1231]/50 focus:ring-[#8D1231]"
        />
      </div>

      {!selectedProductType ? (
        <div className="px-6 text-gray-500 italic">
          Silakan pilih tipe produk terlebih dahulu untuk menampilkan data.
        </div>
      ) : (
        <BaseStockSummary
          key={selectedProductType.id}
          programType={selectedProductType.programType as ProgramType}
        />
      )}
    </div>
  );
}
