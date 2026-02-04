"use client";

import { useProductTypes } from "@/hooks/useProductTypes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ProductType } from "@/lib/services/product-type.service";

interface ProductTypeSelectorProps {
  value?: string;
  onChange: (value: string, productType?: ProductType) => void;
  className?: string;
  placeholder?: string;
}

export default function ProductTypeSelector({
  value,
  onChange,
  className,
  placeholder = "Pilih Tipe Produk",
}: ProductTypeSelectorProps) {
  const { productTypes, loading } = useProductTypes();

  const handleValueChange = (val: string) => {
    const selected = productTypes.find((p) => p.id === val);
    onChange(val, selected);
  };

  return (
    <Select value={value} onValueChange={handleValueChange} disabled={loading}>
      <SelectTrigger className={cn("w-full md:w-[280px]", className)}>
        <SelectValue placeholder={loading ? "Loading..." : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {productTypes.map((type) => (
          <SelectItem key={type.id} value={type.id}>
            {type.description || type.programId} ({type.programId})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
