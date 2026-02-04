import { useState, useEffect, useCallback } from "react";
import {
  ProductType,
  ProductTypeService,
} from "@/lib/services/product-type.service";
import toast from "react-hot-toast";

export const useProductTypes = () => {
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProductTypes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ProductTypeService.getAll();
      setProductTypes(data);
    } catch (error: any) {
      console.error("Failed to fetch product types:", error);
      toast.error(error?.message || "Gagal mengambil tipe produk");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProductTypes();
  }, [fetchProductTypes]);

  return {
    productTypes,
    loading,
    refresh: fetchProductTypes,
  };
};
