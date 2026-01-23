'use client';

import { useEffect, useState, useCallback } from 'react';
import { CategoryOption } from '@/types/card';
import { cardFWCService } from '@/lib/services/card.fwc.service';

export const useCategoriesFWC = () => {
  const [data, setData] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(false);

  /**
   * fetch data (dipakai ulang setelah create / delete)
   */
  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const result = await cardFWCService.getCategories();
      setData(result);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * initial fetch
   */
  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, fetch, loading };
};
