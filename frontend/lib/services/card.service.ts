import { apiFetch } from "@/lib/apiConfig";
import axios from "@/lib/axios";
import type { Card, CardStatus } from "@/types/card";
import type { CardType } from "@/types/purchase";

export const getCards = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  categoryId?: string;
  typeId?: string;
  stationId?: string;
  cardProductId?: string;
}) => {
  const query = new URLSearchParams();

  query.append("page", String(params?.page ?? 1));
  query.append("limit", String(params?.limit ?? 50));

  if (params?.search) query.append("search", params.search);
  if (params?.status) query.append("status", params.status);
  if (params?.categoryId) query.append("categoryId", params.categoryId);
  if (params?.typeId) query.append("typeId", params.typeId);
  if (params?.stationId) query.append("stationId", params.stationId);
  if (params?.cardProductId)
    query.append("cardProductId", params.cardProductId);

  return apiFetch(`/cards?${query.toString()}`, {
    method: "GET",
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

/**
 * Update card status and note
 */
export async function updateCard(
  cardId: string,
  payload: { status?: CardStatus; notes?: string },
): Promise<Card> {
  const response = await axios.patch(`/cards/${cardId}`, payload);
  return response.data.data;
}

/**
 * Get available card statuses
 */
export async function getCardStatuses(): Promise<
  { id: string; label: string; code: string }[]
> {
  const response = await axios.get("/card/statuses");
  const statuses: string[] = response.data.data || [];

  return statuses.map((status) => ({
    id: status,
    code: status,
    label: status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
  }));
}

/**
 * Get editable card statuses
 */
export async function getEditableCardStatuses(): Promise<
  { id: string; label: string; code: string }[]
> {
  const response = await axios.get("/card/statuses/editable");
  const statuses: string[] = response.data.data || [];

  return statuses.map((status) => ({
    id: status,
    code: status,
    label: status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
  }));
}

/**
 * Get cards by serial numbers (batch)
 * Optimized for fetching multiple cards in a single request
 */
export async function getCardsBySerialNumbers(params: {
  serialNumbers: string[];
  categoryId?: string;
  typeId?: string;
  status?: string;
  stationId?: string;
  programType?: "FWC" | "VOUCHER";
}): Promise<{
  items: Card[];
  foundCount: number;
  requestedCount: number;
}> {
  const response = await axios.post("/cards/batch-by-serials", {
    serialNumbers: params.serialNumbers,
    categoryId: params.categoryId,
    typeId: params.typeId,
    status: params.status,
    stationId: params.stationId,
    programType: params.programType,
  });

  return response.data.data;
}

/**
 * Get next available cards after a specific serial number
 * Returns cards ordered by serial number ascending, starting from startSerial
 */
export async function getNextAvailableCards(params: {
  startSerial: string;
  quantity: number;
  categoryId?: string;
  typeId?: string;
  status?: string;
  stationId?: string;
  programType?: "FWC" | "VOUCHER";
}): Promise<{
  items: Card[];
  foundCount: number;
  requestedCount: number;
  startSerial: string | null;
  endSerial: string | null;
}> {
  const response = await axios.post("/cards/next-available", {
    startSerial: params.startSerial,
    quantity: params.quantity,
    categoryId: params.categoryId,
    typeId: params.typeId,
    status: params.status,
    stationId: params.stationId,
    programType: params.programType,
  });

  return response.data.data;
}
