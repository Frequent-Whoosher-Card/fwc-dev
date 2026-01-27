"use client";

import { useState, useCallback, useEffect } from "react";
import toast from "react-hot-toast";
import discountService, {
  DiscountRule,
  CreateDiscountDto,
} from "@/lib/services/discount.service";

export interface DiscountFormState {
  minQuantity: number | string;
  maxQuantity: number | string | null;
  discount: number | string;
}

export const useDiscount = () => {
  const [rules, setRules] = useState<DiscountRule[]>([]);
  const [loading, setLoading] = useState(false);

  // States for Add Modal/Form
  const [isAdding, setIsAdding] = useState(false);
  const [newRule, setNewRule] = useState<DiscountFormState>({
    minQuantity: 0,
    maxQuantity: 0,
    discount: 0,
  });

  // States for Edit
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<DiscountFormState | null>({
    minQuantity: 0,
    maxQuantity: 0,
    discount: 0,
  });

  // Delete Modal State
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const data = await discountService.getAll();
      setRules(data);
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat data diskon");
    } finally {
      setLoading(false);
    }
  };

  const startDelete = (id: number) => {
    setDeletingId(id);
  };

  const cancelDelete = () => {
    setDeletingId(null);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;

    try {
      setLoading(true);
      await discountService.delete(deletingId);
      toast.success("Aturan diskon berhasil dihapus");
      await fetchRules();
      setDeletingId(null);
    } catch (error) {
      console.error(error);
      toast.error("Gagal menghapus aturan diskon");
    } finally {
      setLoading(false);
    }
  };

  const create = async () => {
    try {
      setLoading(true);
      // Validasi input
      const minQty = Number(newRule.minQuantity) || 1; // Default to 1 if 0/empty

      // Handle maxQuantity: use undefined if 0/empty so axios omits it (or matches backend optional)
      // Backend expects optional number, not null.
      const rawMax = Number(newRule.maxQuantity);
      const maxQty = rawMax > 0 ? rawMax : undefined;

      const discountVal = Number(newRule.discount) || 0;

      await discountService.create({
        minQuantity: minQty,
        maxQuantity: maxQty,
        discount: discountVal,
      });
      toast.success("Aturan diskon berhasil ditambahkan");
      setNewRule({ minQuantity: 0, maxQuantity: 0, discount: 0 });
      setIsAdding(false);
      fetchRules();
    } catch (error) {
      console.error(error);
      toast.error("Gagal menambahkan aturan diskon");
    } finally {
      setLoading(false);
    }
  };

  const update = async (id: number) => {
    if (!editForm) return;
    try {
      setLoading(true);

      const minQty = Number(editForm.minQuantity) || 1; // Default to 1

      const rawMax = Number(editForm.maxQuantity);
      const maxQty = rawMax > 0 ? rawMax : undefined;

      const discountVal = Number(editForm.discount) || 0;

      await discountService.update(id, {
        minQuantity: minQty,
        maxQuantity: maxQty, // undefined is fine, checks against optional
        discount: discountVal,
      });
      toast.success("Aturan diskon berhasil diperbarui");
      setEditingId(null);
      setEditForm(null);
      fetchRules();
    } catch (error) {
      console.error(error);
      toast.error("Gagal memperbarui aturan diskon");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (rule: DiscountRule) => {
    setEditingId(rule.id);
    setEditForm({
      minQuantity: rule.minQuantity,
      maxQuantity: rule.maxQuantity,
      discount: Number(rule.discount), // Ensure it's a number for the form
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  useEffect(() => {
    fetchRules();
  }, []);

  return {
    rules,
    loading,
    isAdding,
    setIsAdding,
    newRule,
    setNewRule,
    editingId,
    editForm,
    setEditForm,
    create,
    update,
    startEdit,
    cancelEdit,
    // Delete Modal Props
    deletingId,
    startDelete,
    confirmDelete,
    cancelDelete,
  };
};
