
import { firebaseAdmin, isFirebaseEnabled } from "../../config/firebase";
import db from "../../config/db";

export class PushNotificationService {
  /**
   * Send Push Notification to Multiple Tokens
   */
  static async sendMulticast(tokens: string[], title: string, body: string, data?: { [key: string]: string }) {
    if (!isFirebaseEnabled || tokens.length === 0) return;

    try {
      // Firebase Multicast Message
      const message = {
        notification: {
          title,
          body,
        },
        data: data || {}, // Add Data Payload
        tokens: tokens,
      };

      const response = await firebaseAdmin.messaging().sendEachForMulticast(message as any);
      
      if (response.failureCount > 0) {
        console.warn(`[FCM] Failed to send ${response.failureCount} messages.`);
      }
      
      console.log(`[FCM] Sent ${response.successCount} messages successfully.`);
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
