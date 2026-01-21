import db from "../../config/db";

export class ActivityLogService {
  static async createActivityLog(
    userId: string | null | undefined,
    action: string,
    description: string,
  ) {
    if (!userId) {
      console.warn("ActivityLogService: Skipped logging due to missing userId");
      return;
    }

    try {
      const data: any = {
        userId,
        action,
        description,
        createdAt: new Date(),
      };

      const upperAction = action.toUpperCase();

      if (upperAction.includes("CREATE")) {
        data.createdBy = userId;
      } else if (
        upperAction.includes("EDIT") ||
        upperAction.includes("UPDATE") ||
        upperAction.includes("RESTORE")
      ) {
        data.updatedBy = userId;
        data.updatedAt = new Date();
      } else if (upperAction.includes("DELETE")) {
        data.deletedBy = userId;
        data.deletedAt = new Date();
      }

      await db.activityLog.create({
        data,
      });
    } catch (error) {
      console.error("ActivityLogService: Failed to create log", error);
      // We don't want to throw error here to avoid blocking the main transaction
    }
  }
}
