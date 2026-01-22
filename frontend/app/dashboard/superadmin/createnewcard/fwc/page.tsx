'use client';

import { useState } from 'react';

import { CardProductForm, CardProductTable, AddCategoryModal, AddTypeModal, CardPageHeader } from '@/components/createnewcard';

import { useCardProductsFWC } from '@/hooks/useCardProductsFWC';
import { useCategoriesFWC } from '@/hooks/useCategoriesFWC';
import { useTypesFWC } from '@/hooks/useTypesFWC';

export default function Page() {
  const { data: products, fetch: fetchProducts } = useCardProductsFWC();

  const { data: categories, fetch: fetchCategories } = useCategoriesFWC();

  const { data: types, fetch: fetchTypes } = useTypesFWC();

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);

  return (
    <div className="max-w-full space-y-8 px-6">
      {/* HEADER (judul kiri, switch kanan) */}
      <CardPageHeader title="FWC" />

      {/* FORM AREA */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <CardProductForm categories={categories} types={types} onSuccess={fetchProducts} onOpenCategory={() => setShowCategoryModal(true)} onOpenType={() => setShowTypeModal(true)} />

        {/* Kolom kanan sengaja kosong (future use) */}
        <div />
      </div>

      {/* TABLE – FULL WIDTH */}
      <CardProductTable data={products} />

      {/* MODALS */}
      <AddCategoryModal open={showCategoryModal} onClose={() => setShowCategoryModal(false)} onSuccess={fetchCategories} />

      <AddTypeModal open={showTypeModal} onClose={() => setShowTypeModal(false)} onSuccess={fetchTypes} />
    </div>
  );
}
