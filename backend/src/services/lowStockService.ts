import db from "../config/db";
import { Inbox } from "@prisma/client";

export class LowStockService {
  private static readonly THRESHOLD_GOLD_JABAN = 100;
  private static readonly THRESHOLD_DEFAULT = 50;

  private static getThreshold(categoryName: string, typeName: string): number {
    const cat = categoryName.toUpperCase();
    const type = typeName.toUpperCase();

    if (
      cat.includes("GOLD") &&
      (type.includes("JABAN") || type.includes("JAKARTA BANDUNG"))
    ) {
      return this.THRESHOLD_GOLD_JABAN;
    }
    return this.THRESHOLD_DEFAULT;
  }

  /**
   * Check Card Product Inventory (Station Only)
   * Should be called after station inventory update.
   */
  static async checkStock(
    categoryId: string,
    typeId: string,
    stationId: string,
    currentStock: number,
    tx: any = db,
  ) {
    if (!stationId) return; // Enforce stationId

    // 1. Get Details
    const category = await tx.cardCategory.findUnique({
      where: { id: categoryId },
      select: { categoryName: true, programType: true },
    });
    const type = await tx.cardType.findUnique({
      where: { id: typeId },
      select: { typeName: true },
    });
    const station = await tx.station.findUnique({
      where: { id: stationId },
      select: { stationName: true },
    });

    if (!category || !type || !station) return;

    const threshold = this.getThreshold(category.categoryName, type.typeName);
    const productName = `${category.categoryName} - ${type.typeName}`;
    const stationName = station.stationName;

    if (currentStock < threshold) {
      // --- LOW STOCK CONDITION ---

      // Check for EXISTING alert for this Station + Product
      const existingAlerts = await tx.inbox.findMany({
        where: {
          type: "LOW_STOCK_ALERT",
          isRead: false,
          stationId: stationId,
        },
        select: { id: true, payload: true },
      });

      const hasActiveAlert = existingAlerts.some((alert: any) => {
        const p = alert.payload;
        return p && p.categoryId === categoryId && p.typeId === typeId;
      });

      if (!hasActiveAlert) {
        // Create Alert for Admins
        // Broadcast Alert
        await tx.inbox.create({
          data: {
            title: `Low Stock Alert: ${stationName}`,
            message: `Stok ${productName} di ${stationName} menipis (Sisa: ${currentStock}). Batas Minimum: ${threshold}.`,
            targetRoles: ["admin", "superadmin"],
            sentTo: null,
            sentBy: null, // System
            stationId: stationId,
            type: "LOW_STOCK_ALERT",
            programType: category.programType,
            payload: {
              categoryId,
              typeId,
              stationId,
              currentStock,
              threshold,
              status: "ALERT",
            },
            isRead: false,
            readByUserIds: [],
            createdAt: new Date(),
          },
        });
      }
    } else {
      // --- SUFFICIENT STOCK CONDITION ---
      // Resolve existing alerts for this Station + Product
      const existingAlerts = await tx.inbox.findMany({
        where: {
          type: "LOW_STOCK_ALERT",
          isRead: false,
          stationId: stationId,
        },
        select: { id: true, payload: true },
      });

      const alertIdsToDelete: string[] = [];

      for (const alert of existingAlerts) {
        const p = alert.payload as any;
        if (p && p.categoryId === categoryId && p.typeId === typeId) {
          alertIdsToDelete.push(alert.id);
        }
      }

      if (alertIdsToDelete.length > 0) {
        await tx.inbox.deleteMany({
          where: { id: { in: alertIdsToDelete } },
        });
      }
    }
  }
}
