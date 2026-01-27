import api from "@/lib/axios";

export interface NotedQuery {
  page?: number;
  limit?: number;
}

/**
 * FWC NOTED SERVICE
 * (endpoint lama – data pasti ada)
 */
export const fwcNotedService = {
  async list(query: NotedQuery) {
    console.log("🔥 FWC QUERY:", query);

    const res = await api.get("/stock/out", {
      params: {
        page: query.page ?? 1,
        limit: query.limit ?? 10,
      },
      validateStatus: (status) => status < 500,
    });

    console.log("🔥 FWC RESPONSE:", res.status, res.data);

    return res.data;
  },
};
