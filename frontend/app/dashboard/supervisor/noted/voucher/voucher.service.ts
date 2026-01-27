import api from "@/lib/axios";

export interface NotedQuery {
  page?: number;
  limit?: number;
}

/**
 * VOUCHER NOTED SERVICE
 */
export const voucherNotedService = {
  async list(query: NotedQuery) {
    console.log("🟢 VOUCHER QUERY:", query);

    const res = await api.get("/voucher/stock/out", {
      params: {
        page: query.page ?? 1,
        limit: query.limit ?? 10,
      },
      validateStatus: (status) => status < 500,
    });

    console.log("🟢 VOUCHER RESPONSE:", res.status, res.data);

    return res.data;
  },
};
