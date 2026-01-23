'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

import { cardVoucherService } from '@/lib/services/card.voucher.service';
import { useCategoriesVoucher } from '@/hooks/useCategoriesVoucher';
import { useTypesVoucher } from '@/hooks/useTypesVoucher';

import EditCardProductVoucherForm from '@/components/createnewcard/EditCardProductVoucherForm';
import { CardProduct } from '@/types/card';

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: categories, loading: loadingCategories } = useCategoriesVoucher();
  const { data: types, loading: loadingTypes } = useTypesVoucher();

  const [product, setProduct] = useState<CardProduct | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(true);

  /* ======================
     FETCH PRODUCT BY ID
  ====================== */
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const result = await cardVoucherService.getProductById(id);
        setProduct(result);
      } catch {
        toast.error('Gagal mengambil data voucher');
      } finally {
        setLoadingProduct(false);
      }
    };

    if (id) fetchProduct();
  }, [id]);

  /* ======================
     LOADING STATE
  ====================== */
  if (loadingProduct || loadingCategories || loadingTypes) {
    return <div className="px-6 py-8">Loading...</div>;
  }

  if (!product) {
    return <div className="px-6 py-8 text-red-500">Voucher tidak ditemukan</div>;
  }

  /* ======================
     RENDER
  ====================== */
  return (
    <div className="px-6 space-y-6 max-w-xl">
      <EditCardProductVoucherForm product={product} categories={categories} types={types} onSuccess={() => router.back()} />
    </div>
  );
}
