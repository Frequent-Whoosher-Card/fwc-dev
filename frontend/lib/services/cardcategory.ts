import { apiFetch } from '@/lib/apiConfig';

export async function getCardCategories() {
  return apiFetch('/card/category');
}

export async function getCardTypes() {
  return apiFetch('/card/types');
}
