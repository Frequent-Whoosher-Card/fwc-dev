import { apiFetch } from "@/lib/apiConfig";

export interface TestNotificationPayload {
  userId?: string;
  token?: string;
}

export interface TestNotificationResponse {
  success: boolean;
  sentCount: number;
  failureCount: number;
  tokensTargeted: number;
  errors?: string[];
}

export const sendTestNotification = async (payload: TestNotificationPayload) => {
  return await apiFetch("/notification/test", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const resetUserTokens = async (userId: string) => {
  return await apiFetch("/notification/reset-token", {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
};
