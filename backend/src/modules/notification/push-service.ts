
import { firebaseAdmin, isFirebaseEnabled } from "../../config/firebase";
import db from "../../config/db";

export class PushNotificationService {
  /**
   * Send Push Notification to Multiple Tokens
   */
  static async sendMulticast(tokens: string[], title: string, body: string) {
    if (!isFirebaseEnabled || tokens.length === 0) return;

    try {
      // Firebase Multicast Message
      const message = {
        notification: {
          title,
          body,
        },
        tokens: tokens,
      };

      const response = await firebaseAdmin.messaging().sendEachForMulticast(message);
      
      if (response.failureCount > 0) {
        console.warn(`[FCM] Failed to send ${response.failureCount} messages.`);
        response.responses.forEach((resp, idx) => {
            if (!resp.success) {
                // Optional: Remove invalid tokens here
                // console.error(resp.error);
            }
        });
      }
      
      console.log(`[FCM] Sent ${response.successCount} messages successfully.`);
      return response;
    } catch (error) {
      console.error("[FCM] Error sending multicast:", error);
    }
  }

  /**
   * Send to Users with Specific Role at a Specific Station
   * (e.g., Send to all Supervisors at Station Halim)
   */
  static async sendToRoleAtStation(roleCode: string, stationId: string, title: string, body: string) {
    try {
        // 1. Find Users matching Role & Station
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

        // 2. Get FCM Tokens for these users
        const tokens = await db.fcmToken.findMany({
            where: {
                userId: { in: userIds }
            },
            select: { token: true }
        });

        if (tokens.length === 0) return;

        const tokenStrings = tokens.map(t => t.token);
        
        // 3. Send
        await this.sendMulticast(tokenStrings, title, body);

    } catch (error) {
        console.error("[FCM] Error sending to role at station:", error);
    }
  }

  /**
   * Send to All Users with Specific Role (Global)
   * (e.g., Send to all Admins/Superadmins)
   */
  static async sendToRole(roleCodes: string[], title: string, body: string) {
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
        await this.sendMulticast(tokenStrings, title, body);

    } catch (error) {
        console.error("[FCM] Error sending to global role:", error);
    }
  }
}
