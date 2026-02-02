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

export default function FWCPage() {
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
  } = useCardBase({ programType: "FWC" });

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);

  const sopItems = [
    "Tidak boleh menghapus produk jika sudah stok in (solusi jika sudah stok in tombol deletenya jadi terkunci).",
    "Saat tambah produk baik type dan category sudah dipastikan nama tersebut sudah sesuai yang diinginkan, karena tidak bisa dihapus atau diedit.",
    "Kesepakatan serial template dinamis atau tidak?",
  ];

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
        <div className="h-full">
          <StockSopCard title="SOP Card Produk" items={sopItems} />
        </div>
      </div>

      <BaseCardProductTable
        programType="FWC"
        data={products}
        onDelete={deleteProduct}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        totalData={allProducts.length}
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
