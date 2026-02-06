
import { firebaseAdmin, isFirebaseEnabled } from "../../config/firebase";
import db from "../../config/db";

export class PushNotificationService {
  /**
   * Send Push Notification to Multiple Tokens
   */
  static async sendMulticast(tokens: string[], title: string, body: string, data?: { [key: string]: string }) {
    if (!isFirebaseEnabled || tokens.length === 0) return;

    // FIX: Deduplicate tokens to prevent "Duplicate Token" errors and wasted quota
    tokens = [...new Set(tokens)];

    try {
      // Firebase Multicast Message
      // Enforce Data-Only Protocol (Prevent Double Notification)
      // We move title/body into 'data' so Service Worker handles display manually.
      // FIX: Only overwrite if title/body arguments are provided (not empty strings)
      const finalData = { ... (data || {}) };
      
      if (title) finalData.title = title;
      if (body) finalData.body = body;

      const message: any = {
        data: finalData,
        tokens: tokens,
      };

      // REMOVED: message.notification block
      // By omitting it, we stop the browser's automatic display.

      console.log("[FCM DEBUG] Sends:", JSON.stringify(message.data, null, 2));
      console.log("[FCM] Sending Multicast Message Payload:", JSON.stringify(message, null, 2));

      const response = await firebaseAdmin.messaging().sendEachForMulticast(message as any);
      
      // LOGGING & SELF-HEALING
      if (response.failureCount > 0) {
        console.warn(`[FCM] Failed to send ${response.failureCount} messages. Analyzing errors...`);
        const invalidTokens: string[] = [];
        
        response.responses.forEach((res, idx) => {
            if (!res.success && res.error) {
                // LOGGING REQUESTED BY DEVOPS: Full Error Dump
                console.error(`[FCM Detail] Token: ${tokens[idx].substring(0, 15)}... \nError: ${JSON.stringify(res.error, null, 2)}`);

                // Check for specific error codes for invalid tokens
                const errorCode = res.error.code;
                if (errorCode === 'messaging/registration-token-not-registered' || 
                    errorCode === 'messaging/invalid-argument' ||
                    errorCode === 'app/invalid-credential') { // Token belongs to diff project
                    invalidTokens.push(tokens[idx]);
                }
            }
        });

        if (invalidTokens.length > 0) {
            await db.fcmToken.deleteMany({
                where: { token: { in: invalidTokens } }
            });
            console.log(`[FCM] Auto-removed ${invalidTokens.length} dead tokens from DB.`);
        }
      }
      
      console.log(`[FCM] Sent ${response.successCount} messages successfully.`);
      console.log("[FCM Full Response Dump]:", JSON.stringify(response, null, 2)); // REQUESTED BY USER
      return response;
    } catch (error) {
      console.error("[FCM] Error sending multicast:", error);
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
