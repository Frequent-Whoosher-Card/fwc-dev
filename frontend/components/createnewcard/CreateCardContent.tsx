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
import StockSopCard from "@/components/stock/StockSopCard";
import { ProgramType } from "@/lib/services/card.base.service";

interface CreateCardContentProps {
  programType: ProgramType;
  initialSerialPrefix?: string;
  isKAI?: boolean;
}

export default function CreateCardContent({
  programType,
  initialSerialPrefix,
  isKAI,
}: CreateCardContentProps) {
  const {
    products,
    allProducts, // Destructure allProducts to get total count
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
  } = useCardBase({ programType });

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);

  const sopItems = [
    "Pastikan Kategori dan Tipe Produk sudah sesuai sebelum disimpan, karena data tidak dapat dihapus atau diedit setelah generate number.",
    "Pastikan format Template Serial Number telah ditentukan dengan benar (dinamis/statis) sesuai kebutuhan.",
  ];

  // Filter categories
  const displayedCategories = isKAI
    ? categories.filter((c) => c.categoryName.toUpperCase().includes("KAI"))
    : categories.filter((c) => !c.categoryName.toUpperCase().includes("KAI"));

  return (
    <div className="px-6 space-y-8 max-w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <BaseCardProductForm
          programType={programType}
          categories={displayedCategories}
          types={types}
          onSuccess={fetchProducts}
          onOpenCategory={() => setShowCategoryModal(true)}
          onOpenType={() => setShowTypeModal(true)}
          service={service}
          initialSerialPrefix={initialSerialPrefix}
        />
        <div className="h-full">
          <StockSopCard title="SOP Card Produk" items={sopItems} />
        </div>
      </div>

      <BaseCardProductTable
        programType={programType}
        data={products}
        onDelete={deleteProduct}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        totalData={allProducts.length}
      />

      <BaseCategoryModal
        programType={programType}
        open={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        onSuccess={fetchCategories}
        service={service}
      />

      <BaseTypeModal
        programType={programType}
        open={showTypeModal}
        onClose={() => setShowTypeModal(false)}
        onSuccess={fetchTypes}
        service={service}
      />

      <ConfirmModal
        open={showDeleteConfirm}
        title={`Hapus ${programType}`}
        description={`Apakah Anda yakin ingin menghapus product ${programType} ini? Data yang dihapus tidak dapat dikembalikan.`}
        confirmText="Ya, Hapus"
        loading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
