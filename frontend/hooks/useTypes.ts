'use client';

import { useEffect, useState, useCallback } from 'react';
import { cardService } from '@/lib/services/card.service';
import { TypeOption } from '@/types/card';

export const useTypes = () => {
  const [data, setData] = useState<TypeOption[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const result = await cardService.getTypes();
      setData(result);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      try {
        const result = await cardService.getTypes();
        if (mounted) setData(result);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return { data, fetch, loading };
};
