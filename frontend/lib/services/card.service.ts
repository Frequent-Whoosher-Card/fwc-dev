import { apiFetch } from "@/lib/apiConfig";

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

  query.append("page", String(params?.page ?? 1));
  query.append("limit", String(params?.limit ?? 50));

  if (params?.search) query.append("search", params.search);
  if (params?.status) query.append("status", params.status);
  if (params?.categoryId) query.append("categoryId", params.categoryId);
  if (params?.typeId) query.append("typeId", params.typeId);
  if (params?.stationId) query.append("stationId", params.stationId);

  return apiFetch(`/cards?${query.toString()}`, {
    method: "GET",
  });
};
