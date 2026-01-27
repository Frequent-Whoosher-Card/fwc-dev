import { API_BASE_URL } from "@/lib/apiConfig";

export interface InboxQuery {
  page?: number;
  limit?: number;
  status?: string;
}

export const voucherInboxService = {
  async getInbox(query: InboxQuery) {
    const token = localStorage.getItem("voucher_token");

    const params = new URLSearchParams();
    if (query.page) params.append("page", String(query.page));
    if (query.limit) params.append("limit", String(query.limit));
    if (query.status) params.append("status", query.status);

    const res = await fetch(
      `${API_BASE_URL}/voucher/inbox?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error("VOUCHER API ERROR:", res.status, text);
      throw new Error("Failed load Voucher inbox");
    }

    return res.json();
  },

  async markAsRead(id: string) {
    const token = localStorage.getItem("voucher_token");

    const res = await fetch(
      `${API_BASE_URL}/voucher/inbox/${id}/read`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) throw new Error("Failed mark Voucher inbox as read");
    return res.json();
  },
};
