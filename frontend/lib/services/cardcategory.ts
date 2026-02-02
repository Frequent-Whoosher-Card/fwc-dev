import { apiFetch } from '@/lib/apiConfig';

export async function getCardCategories(programType?: 'FWC' | 'VOUCHER') {
  const params = new URLSearchParams();
  if (programType) params.append('programType', programType);
  return apiFetch(`/card/category?${params.toString()}`);
}

export async function getCardTypes(programType?: 'FWC' | 'VOUCHER') {
  const params = new URLSearchParams();
  if (programType) params.append('programType', programType);
  return apiFetch(`/card/types?${params.toString()}`);
}
