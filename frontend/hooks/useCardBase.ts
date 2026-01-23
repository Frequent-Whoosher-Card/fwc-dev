'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { createCardService, ProgramType } from '@/lib/services/card.base.service';
import { CardProduct, CategoryOption, TypeOption } from '@/types/card';

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
    const [productIdToDelete, setProductIdToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const data = await service.getProducts();
            setProducts(data);
        } catch {
            toast.error('Gagal mengambil card products');
        } finally {
            setLoading(false);
        }
    }, [service]);

    const fetchCategories = useCallback(async () => {
        try {
            const data = await service.getCategories();
            setCategories(data);
        } catch {
            toast.error('Gagal mengambil categories');
        }
    }, [service]);

    const fetchTypes = useCallback(async () => {
        try {
            const data = await service.getTypes();
            setTypes(data);
        } catch {
            toast.error('Gagal mengambil types');
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
            toast.success('Product berhasil dihapus');
            fetchProducts();
            setShowDeleteConfirm(false);
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Gagal menghapus product');
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

    return {
        products,
        categories,
        types,
        loading,
        fetchProducts,
        fetchCategories,
        fetchTypes,
        deleteProduct,
        confirmDelete,
        showDeleteConfirm,
        setShowDeleteConfirm,
        isDeleting,
        service
    };
};
