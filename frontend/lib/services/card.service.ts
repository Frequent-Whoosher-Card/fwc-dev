import { apiFetch } from "@/lib/apiConfig";
import axios from "@/lib/axios";
import type { Card, CardType, CardStatus } from "@/types/purchase";

export const getCards = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  categoryId?: string;
  typeId?: string;
  stationId?: string;
}) => {
  const query = new URLSearchParams();

  query.append('page', String(params?.page ?? 1));
  query.append('limit', String(params?.limit ?? 50));

  if (params?.search) query.append('search', params.search);
  if (params?.status) query.append('status', params.status);
  if (params?.categoryId) query.append('categoryId', params.categoryId);
  if (params?.typeId) query.append('typeId', params.typeId);
  if (params?.stationId) query.append('stationId', params.stationId);

  return apiFetch(`/cards?${query.toString()}`, {
    method: 'GET',
  });
};

/**
 * Get card types from API
 * @param categoryId - Optional: filter by category
 */
export async function getCardTypes(categoryId?: string): Promise<CardType[]> {
  const url = categoryId
    ? `/card/types?categoryId=${categoryId}`
    : "/card/types";
  const response = await axios.get(url);
  return response.data.data || [];
}

/**
 * Get cards by category, type and status
 */
export async function getCardsByType(
  categoryId: string,
  cardTypeId: string,
  status: CardStatus = "IN_STATION",
): Promise<Card[]> {
  const response = await axios.get("/cards", {
    params: {
      categoryId,
      typeId: cardTypeId,
      status,
    },
  });
  
  return response.data.data?.items || [];
}

/**
 * Get card by ID
 */
export async function getCardById(cardId: string): Promise<Card> {
  const response = await axios.get(`/cards/${cardId}`);
  return response.data.data;
}
