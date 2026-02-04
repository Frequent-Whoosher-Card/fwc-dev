import db from "../../config/db";

export const NotificationService = {
  /**
   * Save or update an FCM token for a user.
   * If the token already exists, it updates the user associated with it.
   */
  updateToken: async (userId: string, token: string, deviceInfo?: string) => {
    // Use upsert to handle race conditions atomically
    return await db.fcmToken.upsert({
      where: { token },
      update: {
        userId,
        deviceInfo: deviceInfo?.substring(0, 255), // Truncate just in case
      },
      create: {
        token,
        userId,
        deviceInfo: deviceInfo?.substring(0, 255),
      },
    });
  },

  /**
   * Remove a token (e.g. on logout)
   */
  removeToken: async (token: string) => {
    try {
      return await db.fcmToken.delete({
        where: { token },
      });
    } catch (error) {
      // Ignore if token doesn't exist
      return null;
    }
  },
};
