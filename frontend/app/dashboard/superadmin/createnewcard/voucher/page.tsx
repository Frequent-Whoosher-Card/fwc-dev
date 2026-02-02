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

export default function VoucherPage() {
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
  } = useCardBase({ programType: "VOUCHER" });

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);

  const sopItems = [
    "Pastikan Kategori dan Tipe Produk sudah sesuai sebelum disimpan, karena data tidak dapat dihapus atau diedit setelah generate number.",
    "Pastikan format Template Serial Number telah ditentukan dengan benar (dinamis/statis) sesuai kebutuhan.",
  ];

  return (
    <div className="px-6 space-y-8 max-w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <BaseCardProductForm
          programType="VOUCHER"
          categories={categories}
          types={types}
          onSuccess={fetchProducts}
          onOpenCategory={() => setShowCategoryModal(true)}
          onOpenType={() => setShowTypeModal(true)}
          service={service}
        />
        <div className="h-full">
          <StockSopCard title="SOP Card Produk" items={sopItems} />
        </div>
      </div>

      <BaseCardProductTable
        programType="VOUCHER"
        data={products}
        onDelete={deleteProduct}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        totalData={allProducts.length}
      />

      <BaseCategoryModal
        programType="VOUCHER"
        open={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        onSuccess={fetchCategories}
        service={service}
      />

      <BaseTypeModal
        programType="VOUCHER"
        open={showTypeModal}
        onClose={() => setShowTypeModal(false)}
        onSuccess={fetchTypes}
        service={service}
      />

      <ConfirmModal
        open={showDeleteConfirm}
        title="Hapus Voucher"
        description="Apakah Anda yakin ingin menghapus product Voucher ini? Data yang dihapus tidak dapat dikembalikan."
        confirmText="Ya, Hapus"
        loading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
