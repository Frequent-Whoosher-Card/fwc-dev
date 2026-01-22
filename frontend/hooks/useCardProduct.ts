'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CardProduct } from '@/types/card';
import { createCardService } from '@/lib/services/card.base.service';
import { ProgramType } from '@/lib/services/card.base.service';

export const useCardProduct = (id?: string, programType: ProgramType = 'FWC') => {
  const [data, setData] = useState<CardProduct | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const service = createCardService(programType);

  useEffect(() => {
    if (!id) return;

    let mounted = true;

    const fetchProduct = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await service.getProductById(id);

        if (mounted) {
          setData(result);
        }
      } catch (err) {
        if (mounted) {
          setError('Gagal mengambil product');
          toast.error('Gagal mengambil product');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchProduct();

    return () => {
      mounted = false;
    };
  }, [id, programType]);

  return {
    data,
    loading,
    error,
  };
};
