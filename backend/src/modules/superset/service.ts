const SUPERSET_URL = process.env.SUPERSET_URL!;
const ADMIN_TOKEN = process.env.SUPERSET_ADMIN_ACCESS_TOKEN!;

export class SupersetService {
  static async createGuestToken(dashboardId: string) {
    const payload = {
      user: {
        username: "guest",
        first_name: "Guest",
        last_name: "Viewer",
      },
      resources: [{ type: "dashboard", id: dashboardId }],
      rls: [],
    };

    const res = await fetch(
      `${SUPERSET_URL}/api/v1/security/guest_token/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ADMIN_TOKEN}`,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error("[superset] guest token failed:", text);
      return Promise.reject(
        new Error(`Superset guest token failed: ${text}`)
      );
    }


    const data = await res.json();
    return data.token;
  }
}