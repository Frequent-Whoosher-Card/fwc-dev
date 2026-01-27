"use client";

import { useState } from "react";
import {
  BaseCardProductForm,
  BaseCardProductTable,
  BaseCategoryModal,
  BaseTypeModal,
} from "@/components/createnewcard";
import ConfirmModal from "@/components/ConfirmModal";
import { useCardBase } from "@/hooks/useCardBase";

export default function FWCPage() {
  const {
    products,
    categories,
    types,
    fetchProducts,
    fetchCategories,
    fetchTypes,
    deleteProduct,
    confirmDelete,
    showDeleteConfirm,
    setShowDeleteConfirm,
    isDeleting,
    service,
    page,
    setPage,
    totalPages,
  } = useCardBase({ programType: "FWC" });

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);

  return (
    <div className="px-6 space-y-8 max-w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <BaseCardProductForm
          programType="FWC"
          categories={categories}
          types={types}
          onSuccess={fetchProducts}
          onOpenCategory={() => setShowCategoryModal(true)}
          onOpenType={() => setShowTypeModal(true)}
          service={service}
        />
        <div />
      </div>

      <BaseCardProductTable
        programType="FWC"
        data={products}
        onDelete={deleteProduct}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      <BaseCategoryModal
        programType="FWC"
        open={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        onSuccess={fetchCategories}
        service={service}
      />

      <BaseTypeModal
        programType="FWC"
        open={showTypeModal}
        onClose={() => setShowTypeModal(false)}
        onSuccess={fetchTypes}
        service={service}
      />

      <ConfirmModal
        open={showDeleteConfirm}
        title="Hapus Product"
        description="Apakah Anda yakin ingin menghapus product FWC ini? Data yang dihapus tidak dapat dikembalikan."
        confirmText="Ya, Hapus"
        loading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
