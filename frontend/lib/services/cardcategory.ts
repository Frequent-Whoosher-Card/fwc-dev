import { apiFetch } from '@/lib/apiConfig';

export async function getCardCategories() {
  return apiFetch('/card-categories');
}
