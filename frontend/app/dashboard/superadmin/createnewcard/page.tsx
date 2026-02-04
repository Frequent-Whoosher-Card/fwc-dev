"use client";

import { useState } from "react";
import CreateCardContent from "@/components/createnewcard/CreateCardContent";
import ProductTypeSelector from "@/components/ProductTypeSelector";
import { ProductType } from "@/lib/services/product-type.service";

export default function CreateNewCardPage() {
  const [selectedProductType, setSelectedProductType] = useState<
    ProductType | undefined
  >(undefined);

  const handleProductTypeChange = (val: string, type?: ProductType) => {
    setSelectedProductType(type);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 px-6">
        <h2 className="text-lg font-semibold">Create New Card</h2>
        <ProductTypeSelector
          value={selectedProductType?.id}
          onChange={handleProductTypeChange}
          placeholder="Pilih Produk"
          className="w-[180px] border-[#8D1231] text-[#8D1231] placeholder:text-[#8D1231]/50 focus:ring-[#8D1231]"
        />
      </div>

      {selectedProductType ? (
        <CreateCardContent
          key={selectedProductType.id} // Re-mount when type changes
          programType={selectedProductType.programType || "FWC"}
          initialSerialPrefix={selectedProductType.programId}
          isKAI={selectedProductType.description?.toUpperCase().includes("KAI")}
        />
      ) : (
        <div className="px-6 text-gray-500 italic">
          Silakan pilih tipe produk terlebih dahulu untuk melanjutkan.
        </div>
      )}
    </div>
  );
}
