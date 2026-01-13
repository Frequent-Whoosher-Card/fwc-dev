import { apiFetch } from "../apiConfig";

/* =========================
   TYPES
========================= */
export interface StationItem {
  id: string;
  stationCode: string;
  stationName: string;
  location?: string;
  createdAt?: string;
  updatedAt?: string;
}

/* =========================
   STATION SERVICE
========================= */

/**
 * GET ALL STATIONS (pagination)
 */
export const getStations = async (params?: {
  page?: number;
  limit?: number;
}) => {
  const query = new URLSearchParams();

  query.append("page", String(params?.page ?? 1));
  query.append("limit", String(params?.limit ?? 50));

  const res = await apiFetch(`/station?${query.toString()}`, {
    method: "GET",
  });

  const data = res?.data ?? {};

  return {
    ...res,
    data: {
      items: Array.isArray(data.items)
        ? data.items.map(
            (item: any): StationItem => ({
              id: String(item.id),
              stationCode: item.stationCode ?? "",
              stationName: item.stationName ?? "",
              location: item.location ?? "",
              createdAt: item.createdAt,
              updatedAt: item.updatedAt,
            })
          )
        : [],
      pagination: data.pagination,
    },
  };
};

/**
 * GET STATION BY ID
 */
export const getStationById = async (id: string) => {
  const res = await apiFetch(`/station/${id}`, { method: "GET" });
  const s = res?.data ?? {};

  return {
    ...res,
    data: {
      id: String(s.id),
      stationCode: s.stationCode ?? "",
      stationName: s.stationName ?? "",
      location: s.location ?? "",
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    } as StationItem,
  };
};
