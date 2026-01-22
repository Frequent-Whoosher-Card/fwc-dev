'use client';

import { useState } from 'react';
import { CardProductVoucherForm, CardProductVoucherTable, AddCategoryVoucherModal, AddTypeVoucherModal, CardPageHeader } from '@/components/createnewcard';

import { useCardProductsVoucher } from '@/hooks/useCardProductsVoucher';
import { useCategoriesVoucher } from '@/hooks/useCategoriesVoucher';
import { useTypesVoucher } from '@/hooks/useTypesVoucher';

export default function Page() {
  const { data: products, fetch: fetchProducts } = useCardProductsVoucher();
  const { data: categories, fetch: fetchCategories } = useCategoriesVoucher();
  const { data: types, fetch: fetchTypes } = useTypesVoucher();

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);

  return (
    <div className="px-6 space-y-8 max-w-full">
      <CardPageHeader title="Voucher" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <CardProductVoucherForm categories={categories} types={types} onSuccess={fetchProducts} onOpenCategory={() => setShowCategoryModal(true)} onOpenType={() => setShowTypeModal(true)} />
        <div />
      </div>

      <CardProductVoucherTable data={products} onDelete={(id) => console.log('delete voucher', id)} />

      <AddCategoryVoucherModal open={showCategoryModal} onClose={() => setShowCategoryModal(false)} onSuccess={fetchCategories} />

      <AddTypeVoucherModal open={showTypeModal} onClose={() => setShowTypeModal(false)} onSuccess={fetchTypes} />
    </div>
  );
}
