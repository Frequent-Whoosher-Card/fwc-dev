import { jwt } from "@elysiajs/jwt";

const SUPERSET_URL = "https://superset.fwc-kcic.me";

export class SupersetService {
  static async createGuestToken(
    jwtSigner: any,
    dashboardId: string,
    supersetAdminAccessToken: string
  ) {
    // Payload sesuai Superset API (bukan asumsi)
    const payload = {
      user: {
        username: "guest",
        first_name: "Guest",
        last_name: "Viewer",
      },
      resources: [
        {
          type: "dashboard",
          id: dashboardId,
        },
      ],
      rls: [],
    };

    const response = await fetch(
      `${SUPERSET_URL}/api/v1/security/guest_token/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supersetAdminAccessToken}`,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Superset guest token failed: ${err}`);
    }

    const data = await response.json();
    return data.token;
  }
}