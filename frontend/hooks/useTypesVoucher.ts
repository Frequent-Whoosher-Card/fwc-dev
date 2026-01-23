'use client';

import { useEffect, useState, useCallback } from 'react';
import { TypeOption } from '@/types/card';
import { cardVoucherService } from '@/lib/services/card.voucher.service';

export const useTypesVoucher = () => {
  const [data, setData] = useState<TypeOption[]>([]);
  const [loading, setLoading] = useState(false);

  /**
   * fetch data (dipakai ulang setelah create / delete)
   */
  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const result = await cardVoucherService.getTypes();
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
