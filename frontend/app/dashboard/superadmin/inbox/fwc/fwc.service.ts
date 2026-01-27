import { API_BASE_URL } from "@/lib/apiConfig";

export interface InboxQuery {
  page?: number;
  limit?: number;
  status?: string;
}

export const fwcInboxService = {
  async getInbox(query: InboxQuery) {
    const token = localStorage.getItem("fwc_token");

    const params = new URLSearchParams();
    if (query.page) params.append("page", String(query.page));
    if (query.limit) params.append("limit", String(query.limit));
    if (query.status) params.append("status", query.status);

    const res = await fetch(
      `${API_BASE_URL}/fwc/inbox?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error("FWC API ERROR:", res.status, text);
      throw new Error("Failed load FWC inbox");
    }

    return res.json();
  },

  async markAsRead(id: string) {
    const token = localStorage.getItem("fwc_token");

    const res = await fetch(
      `${API_BASE_URL}/fwc/inbox/${id}/read`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) throw new Error("Failed mark FWC inbox as read");
    return res.json();
  },
};
