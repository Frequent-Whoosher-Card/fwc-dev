"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import {
  createCardService,
  ProgramType,
} from "@/lib/services/card.base.service";
import { CardProduct, CategoryOption, TypeOption } from "@/types/card";

interface UseCardBaseProps {
  programType: ProgramType;
}

export const useCardBase = ({ programType }: UseCardBaseProps) => {
  const service = useMemo(() => createCardService(programType), [programType]);

  const [products, setProducts] = useState<CardProduct[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [types, setTypes] = useState<TypeOption[]>([]);
  const [loading, setLoading] = useState(false);

  // DELETE STATES
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productIdToDelete, setProductIdToDelete] = useState<string | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  // PAGINATION STATES
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const [productsData, inventoryRes] = await Promise.all([
        service.getProducts(),
        service.getInventorySummaryForCheck(),
      ]);

      const inventoryMap = new Map();
      if (inventoryRes && Array.isArray(inventoryRes)) {
        inventoryRes.forEach((item: any) => {
          const key = `${item.categoryId}-${item.typeId}`;
          const totalStock =
            Number(item.totalOffice || 0) +
            Number(item.totalBeredar || 0) +
            Number(item.totalAktif || 0) +
            Number(item.totalNonAktif || 0) +
            Number(item.totalBelumTerjual || 0) +
            Number(item.totalInTransit || 0);
          inventoryMap.set(key, totalStock);
        });
      }

      const enrichedProducts = productsData.map((p: CardProduct) => {
        const key = `${p.categoryId}-${p.typeId}`;
        const totalStock = inventoryMap.get(key) || 0;
        return {
          ...p,
          hasGeneratedCards: totalStock > 0,
        };
      });

      setProducts(enrichedProducts);
      setPage(1);
    } catch (err: any) {
      toast.error(err.message || "Gagal mengambil card products");
    } finally {
      setLoading(false);
    }
  }, [service]);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await service.getCategories();
      setCategories(data);
    } catch (err: any) {
      toast.error(err.message || "Gagal mengambil categories");
    }
  }, [service]);

  const fetchTypes = useCallback(async () => {
    try {
      const data = await service.getTypes();
      setTypes(data);
    } catch (err: any) {
      toast.error(err.message || "Gagal mengambil types");
    }
  }, [service]);

  const deleteProduct = (id: string) => {
    setProductIdToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!productIdToDelete) return;

    setIsDeleting(true);
    try {
      await service.deleteProduct(productIdToDelete);
      toast.success("Product berhasil dihapus");
      fetchProducts();
      setShowDeleteConfirm(false);
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus product");
    } finally {
      setIsDeleting(false);
      setProductIdToDelete(null);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchTypes();
  }, [fetchProducts, fetchCategories, fetchTypes]);

  // Derived pagination data
  const totalPages = Math.ceil(products.length / limit);
  const paginatedProducts = useMemo(() => {
    const start = (page - 1) * limit;
    return products.slice(start, start + limit);
  }, [products, page, limit]);

  return {
    products: paginatedProducts, // Return only paginated products
    allProducts: products, // In case we need total count or all data
    categories,
    types,
    loading,
    page,
    setPage,
    totalPages,
    limit,
    fetchProducts,
    fetchCategories,
    fetchTypes,
    deleteProduct,
    confirmDelete,
    showDeleteConfirm,
    setShowDeleteConfirm,
    isDeleting,
    service,
  };
};
