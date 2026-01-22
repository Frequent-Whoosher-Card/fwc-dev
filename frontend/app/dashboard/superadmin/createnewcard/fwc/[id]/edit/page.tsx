'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

import { cardFWCService } from '@/lib/services/card.fwc.service';
import EditCardProductForm from '@/components/createnewcard/EditCardProductForm';
import { CardProduct, CategoryOption, TypeOption } from '@/types/card';

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [product, setProduct] = useState<CardProduct | null>(null);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [types, setTypes] = useState<TypeOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [productRes, categoriesRes, typesRes] = await Promise.all([cardFWCService.getProductById(id), cardFWCService.getCategories(), cardFWCService.getTypes()]);

        setProduct(productRes);
        setCategories(categoriesRes);
        setTypes(typesRes);
      } catch {
        toast.error('Gagal mengambil product');
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (!product) return null;

  return (
    <div className="px-6 space-y-6 max-w-xl">
      <EditCardProductForm product={product} categories={categories} types={types} onSuccess={() => router.back()} />
    </div>
  );
}
