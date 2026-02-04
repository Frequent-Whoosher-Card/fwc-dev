import { apiFetch } from "../apiConfig";

export interface CityItem {
  id: string;
  name: string;
}

export interface CityListResponse {
  success: boolean;
  data: CityItem[];
}

/**
 * Get all cities (kota/kabupaten) for dropdowns.
 */
export async function getCities(): Promise<CityListResponse> {
  const res = await apiFetch("/city", { method: "GET" });
  return res as CityListResponse;
}
