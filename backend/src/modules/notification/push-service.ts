
import { firebaseAdmin, isFirebaseEnabled } from "../../config/firebase";
import db from "../../config/db";

export class PushNotificationService {
  /**
   * Send Push Notification to Multiple Tokens
   */
  static async sendMulticast(tokens: string[], title: string, body: string, data?: { [key: string]: string }) {
    if (!isFirebaseEnabled || tokens.length === 0) return;

    // FIX: Deduplicate tokens
    tokens = [...new Set(tokens)];
    
    // HTTP/1.1 BYPASS for Proxy (Axios)
    const axios = require('axios');
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    if (!projectId) {
        console.error("[FCM] Project ID missing in ENV");
        return;
    }

    try {
      // 1. Get OAuth2 Access Token from Firebase Admin SDK
      // This uses GoogleAuth (HTTP/1.1 compliant internal library)
      const accessTokenObj = await (firebaseAdmin.app().options.credential as any).getAccessToken();
      const accessToken = accessTokenObj.access_token;
      
      // 2. Prepare Data Payload
      const finalData = { ... (data || {}) };
      if (title) finalData.title = title;
      if (body) finalData.body = body;

      console.log("[FCM HTTP/1.1] Sending to", tokens.length, "tokens via Axios");

      // 3. Manual Batch Sending (Promise.all)
      // FCM v1 API only supports sending to 1 token per request.
      const requests = tokens.map(token => {
          const payload = {
              message: {
                  token: token,
                  data: finalData
              }
          };

          return axios.post(
              `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
              payload,
              {
                  headers: {
                      'Authorization': `Bearer ${accessToken}`,
                      'Content-Type': 'application/json'
                      // Axios default is HTTP/1.1, so this bypasses the HTTP/2 Proxy issue
                  }
              }
          )
          .then((res: any) => ({ success: true, token, data: res.data }))
          .catch((err: any) => ({ success: false, token, error: err.response?.data?.error || err.message }));
      });

      const results = await Promise.all(requests);

      // 4. Analyze Results & Self-Healing
      let successCount = 0;
      let failureCount = 0;
      const invalidTokens: string[] = [];

      results.forEach((res: any) => {
          if (res.success) {
              successCount++;
          } else {
              failureCount++;
              console.error(`[FCM Detail] Token: ${res.token.substring(0, 15)}... Error: ${JSON.stringify(res.error)}`);
              
              const errorCode = res.error?.status || res.error?.message;
              const errorDetails = res.error?.details?.[0]?.errorCode || "";

              // Check for invalid tokens (404 Not Found or Specific Error Code)
              if (
                  errorCode === 'NOT_FOUND' || 
                  errorCode === 'UNREGISTERED' || 
                  errorDetails === 'UNREGISTERED' ||
                  errorDetails === 'INVALID_ARGUMENT'
              ) {
                  invalidTokens.push(res.token);
              }
          }
      });

      if (invalidTokens.length > 0) {
          await db.fcmToken.deleteMany({
              where: { token: { in: invalidTokens } }
          });
          console.log(`[FCM] Auto-removed ${invalidTokens.length} dead tokens from DB.`);
      }

      console.log(`[FCM] Sent ${successCount} messages successfully. Failed: ${failureCount}`);
      return { successCount, failureCount, responses: results };

    } catch (error) {
      console.error("[FCM] Global Error during manual sending:", error);
    }
  }

  /**
   * Send to Users with Specific Role at a Specific Station
   */
  static async sendToRoleAtStation(roleCode: string, stationId: string, title: string, body: string, data?: { [key: string]: string }) {
    try {
        const users = await db.user.findMany({
            where: {
                role: { roleCode: roleCode },
                stationId: stationId,
                isActive: true
            },
            select: { id: true }
        });

        if (users.length === 0) return;

        const userIds = users.map(u => u.id);

        const tokens = await db.fcmToken.findMany({
            where: {
                userId: { in: userIds }
            },
            select: { token: true }
        });

        if (tokens.length === 0) return;

        const tokenStrings = tokens.map(t => t.token);
        
        await this.sendMulticast(tokenStrings, title, body, data);

    } catch (error) {
        console.error("[FCM] Error sending to role at station:", error);
    }
  }

  /**
   * Send to All Users with Specific Role (Global)
   */
  static async sendToRole(roleCodes: string[], title: string, body: string, data?: { [key: string]: string }) {
    try {
        const users = await db.user.findMany({
            where: {
                role: { roleCode: { in: roleCodes } },
                isActive: true
            },
            select: { id: true }
        });

        if (users.length === 0) return;

        const userIds = users.map(u => u.id);

        const tokens = await db.fcmToken.findMany({
            where: {
                userId: { in: userIds }
            },
            select: { token: true }
        });

        if (tokens.length === 0) return;

        const tokenStrings = tokens.map(t => t.token);
        await this.sendMulticast(tokenStrings, title, body, data);

    } catch (error) {
        console.error("[FCM] Error sending to global role:", error);
    }
  }
}
