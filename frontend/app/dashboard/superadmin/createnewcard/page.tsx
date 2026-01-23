// 'use client';

// import { useState } from 'react';

// import { CardProductForm, CardProductTable, AddCategoryModal, AddTypeModal } from '@/components/createnewcard';

// import { useCardProducts } from '@/hooks/useCardProducts';
// import { useCategories } from '@/hooks/useCategories';
// import { useTypes } from '@/hooks/useTypes';

// export default function Page() {
//   const { data: products, fetch: fetchProducts } = useCardProducts();
//   const { data: categories, fetch: fetchCategories } = useCategories();
//   const { data: types, fetch: fetchTypes } = useTypes();

//   const [showCategoryModal, setShowCategoryModal] = useState(false);
//   const [showTypeModal, setShowTypeModal] = useState(false);

//   return (
//     <div className="px-6 space-y-8 max-w-6xl">
//       <h2 className="text-lg font-semibold">Create New Card</h2>

//       {/* FORM */}
//       <CardProductForm categories={categories} types={types} onSuccess={fetchProducts} onOpenCategory={() => setShowCategoryModal(true)} onOpenType={() => setShowTypeModal(true)} />

//       {/* TABLE */}
//       <CardProductTable data={products} />

//       {/* MODALS */}
//       <AddCategoryModal open={showCategoryModal} onClose={() => setShowCategoryModal(false)} onSuccess={fetchCategories} />

//       <AddTypeModal open={showTypeModal} onClose={() => setShowTypeModal(false)} onSuccess={fetchTypes} />
//     </div>
//   );
// }
