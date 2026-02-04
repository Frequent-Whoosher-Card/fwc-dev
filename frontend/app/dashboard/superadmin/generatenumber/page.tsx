"use client";

import { useState } from "react";
import ProductTypeSelector from "@/components/ProductTypeSelector";
import { ProductType } from "@/lib/services/product-type.service";
import FWCGenerateNumber from "@/components/generatenumber/fwc/FWCGenerateNumber";
import VoucherGenerateNumber from "@/components/generatenumber/voucher/VoucherGenerateNumber";
import { usePathname } from "next/navigation";

export default function GenerateNumberPage() {
  const [selectedProductType, setSelectedProductType] = useState<
    ProductType | undefined
  >(undefined);
  const pathname = usePathname();

  const handleProductTypeChange = (val: string, type?: ProductType) => {
    setSelectedProductType(type);
  };

  const isRoleAdmin = pathname.includes("/dashboard/admin");

  return (
    <div className="space-y-6 py-6">
      <div className="flex items-center gap-4 px-6">
        <h2 className="text-lg font-semibold">Generate Number</h2>
        <ProductTypeSelector
          value={selectedProductType?.id}
          onChange={handleProductTypeChange}
          placeholder="Pilih Produk"
          className="w-[180px] border-[#8D1231] text-[#8D1231] placeholder:text-[#8D1231]/50 focus:ring-[#8D1231]"
        />
      </div>

      <div className="px-6">
        {selectedProductType ? (
          <>
            {selectedProductType.programType === "VOUCHER" ? (
              <VoucherGenerateNumber />
            ) : (
              <FWCGenerateNumber />
            )}
          </>
        ) : (
          <div className="text-gray-500 italic">
            Silakan pilih tipe produk terlebih dahulu untuk melanjutkan.
          </div>
        )}
      </div>
    </div>
  );
}
