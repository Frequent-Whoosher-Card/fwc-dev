import db from "../config/db";
import { Inbox } from "@prisma/client";
import { TelegramService } from "./telegramService";

export class LowStockService {
  private static readonly THRESHOLD_DEFAULT = 50;
  private static readonly THRESHOLD_GOLD_JABAN = 100;
  private static readonly THRESHOLD_FWC_DEFAULT = 50;
  private static readonly THRESHOLD_VOUCHER_DEFAULT = 200;
  private static readonly THRESHOLD_VOUCHER_ECO = 200;
  private static readonly THRESHOLD_VOUCHER_BIS = 50;
  private static readonly THRESHOLD_VOUCHER_FC = 25;

  private static getThreshold(
    categoryName: string,
    typeName: string,
    programType?: string,
  ): number {
    const cat = categoryName.toUpperCase();
    const type = typeName.toUpperCase();

    if (programType === "VOUCHER") {
      if (type.includes("EKONOMI")) {
        return this.THRESHOLD_VOUCHER_ECO;
      } else if (type.includes("BISNIS")) {
        return this.THRESHOLD_VOUCHER_BIS;
      } else if (type.includes("FIRST CLASS")) {
        return this.THRESHOLD_VOUCHER_FC;
      }
      return this.THRESHOLD_VOUCHER_DEFAULT;
    } else if (programType === "FWC") {
      if (
        cat.includes("GOLD") &&
        (type.includes("JABAN") || type.includes("JAKARTA BANDUNG"))
      ) {
        return this.THRESHOLD_GOLD_JABAN;
      }
      return this.THRESHOLD_FWC_DEFAULT;
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
    stationId: string | null,
    currentStock: number,
    tx: any = db,
    sendTelegram: boolean = false, // Control flag for Telegram
  ) {
    // 1. Get Details
    const category = await tx.cardCategory.findUnique({
      where: { id: categoryId },
      select: { categoryName: true, programType: true },
    });
    const type = await tx.cardType.findUnique({
      where: { id: typeId },
      select: { typeName: true },
    });

    let stationName = "Head Office";
    let configSuffix = "HO";

    if (stationId) {
      const station = await tx.station.findUnique({
        where: { id: stationId },
        select: { stationName: true, stationCode: true },
      });
      if (!station) return;
      stationName = station.stationName;
      // Sanitize code: "HEAD OFFICE" -> "HEAD_OFFICE"
      configSuffix = station.stationCode.replace(/\s+/g, "_").toUpperCase();
    } else {
      stationName = "Head Office";
      configSuffix = "HO";
    }

    if (!category || !type) return;

    const threshold = this.getThreshold(
      category.categoryName,
      type.typeName,
      category.programType,
    );

    const programLabel =
      category.programType === "FWC" ? "📇 FWC" : "🎫 VOUCHER";
    const productName = `${programLabel} | ${category.categoryName} - ${type.typeName}`;

    console.log(
      `[LowStock] Check: ${stationName} | Stock: ${currentStock} | Threshold: ${threshold}`,
    );

    if (currentStock < threshold) {
      console.log(`[LowStock] Below threshold! Checking existing alerts...`);
      // --- LOW STOCK CONDITION ---

      // Check for EXISTING alert for this Station + Product
      const existingAlerts = await tx.inbox.findMany({
        where: {
          type: "LOW_STOCK_ALERT",
          isRead: false,
          stationId: stationId, // Can be null
        },
        select: { id: true, payload: true },
      });

      const hasActiveAlert = existingAlerts.some((alert: any) => {
        const p = alert.payload;
        return p && p.categoryId === categoryId && p.typeId === typeId;
      });

      // --- REGISTER REMINDER (LowStockAlert) ---
      // Ensure we have a persistent record for the Cron Job to pick up later
      // Scan/Update this table regardless of Inbox state
      const existingReminder = await tx.lowStockAlert.findFirst({
        where: {
          categoryId,
          typeId,
          stationId: stationId || null, // Handle explicit null
        },
      });

      if (existingReminder) {
        await tx.lowStockAlert.update({
          where: { id: existingReminder.id },
          data: {
            currentStock,
            threshold,
            updatedAt: new Date(),
          },
        });
      } else {
        await tx.lowStockAlert.create({
          data: {
            categoryId,
            typeId,
            stationId: stationId || null,
            threshold,
            currentStock,
            lastAlertAt: new Date(),
          },
        });
      }
      // -----------------------------------------

      if (!hasActiveAlert) {
        console.log(
          `[LowStock] No active inbox alert. Proceeding to create one.`,
        );
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

        // --- TELEGRAM DISPATCH ---
        if (sendTelegram) {
          // Use Generic Station Config with Fallback logic
          // Format based on .env: TELEGRAM_BOT_TOKEN_HALIM
          const token =
            process.env[`TELEGRAM_BOT_TOKEN_${configSuffix}`] ||
            process.env[`TELEGRAM_TOKEN_${configSuffix}`] || // Legacy support
            process.env.TELEGRAM_BOT_TOKEN || // Global fallback
            process.env.TELEGRAM_TOKEN;

          const chatId = process.env[`TELEGRAM_CHAT_ID_${configSuffix}`];

          console.log(
            `[LowStock] Telegram Dispatch -> Suffix: ${configSuffix} | Token Found: ${!!token} | ChatID Found: ${!!chatId}`,
          );

          if (token && chatId) {
            const telegramMsg =
              `⚠️ *PERINGATAN STOK MENIPIS*\n\n` +
              `📍 Stasiun: *${stationName}*\n` +
              `📦 Produk: *${productName}*\n\n` +
              `📊 Status Stok:\n` +
              `• Sisa: *${currentStock}*\n` +
              `• Minimum: *${threshold}*\n\n` +
              `_Mohon segera lakukan pengisian stok._`;

            console.log(`[LowStock] Sending Telegram message to ${chatId}...`);

            try {
              await TelegramService.sendMessage(token, chatId, telegramMsg);
              console.log(`[LowStock] Telegram sent successfully.`);
              // Rate limit delay ONLY after sending
              await new Promise((resolve) => setTimeout(resolve, 300));
            } catch (err) {
              console.error(
                `[LowStock] Telegram alert failed for ${stationName}:`,
                err,
              );
            }
          } else {
            console.warn(
              `[LowStock] Telegram skipped. Missing config for TELEGRAM_BOT_TOKEN_${configSuffix} or CHAT_ID.`,
            );
          }
        } else {
          console.log(`[LowStock] sendTelegram flag is FALSE. Skipping.`);
        }
        // ------------------------
      } else {
        console.log(`[LowStock] Active inbox alert exists. Skipping Telegram.`);
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

        // Clear Persistent Reminder
        await tx.lowStockAlert.deleteMany({
          where: {
            categoryId,
            typeId,
            stationId: stationId || null,
          },
        });
      }
    }
  }

  /**
   * Run Full Inventory Scan
   * Useful for periodic re-verification or initial setup.
   * This iterates all stations & products to detect any missed low stock events.
   */
  static async scanAllInventory() {
    console.log("[LowStockService] Starting Full Inventory Scan...");

    try {
      // 1. Fetch Master Data
      const stations = await db.station.findMany({
        select: { id: true, stationName: true },
      });
      const products = await db.cardProduct.findMany({
        where: { isActive: true },
        select: { id: true, categoryId: true, typeId: true },
      });

      // 2. Aggregate Stock Counts (Station Scope)
      const stationStockCounts = await db.card.groupBy({
        by: ["stationId", "cardProductId"],
        where: {
          status: "IN_STATION",
          stationId: { not: null },
        },
        _count: { id: true },
      });

      const stationMap = new Map<string, number>();
      stationStockCounts.forEach((item) => {
        if (item.stationId) {
          const key = `${item.stationId}:${item.cardProductId}`;
          stationMap.set(key, item._count.id);
        }
      });

      // 3. Aggregate Office Stock Counts (Office Scope)
      const officeStockCounts = await db.card.groupBy({
        by: ["cardProductId"],
        where: { status: "IN_OFFICE" },
        _count: { id: true },
      });
      const officeMap = new Map<string, number>();
      officeStockCounts.forEach((item) => {
        officeMap.set(item.cardProductId, item._count.id);
      });

      let processedCount = 0;

      // 4. Check Stations
      for (const station of stations) {
        for (const product of products) {
          const key = `${station.id}:${product.id}`;
          const currentStock = stationMap.get(key) || 0;

          // Perform Check (will auto-create alert/reminder if needed)
          await this.checkStock(
            product.categoryId,
            product.typeId,
            station.id,
            currentStock,
            db,
            true, // Send Telegram if new Alert
          );

          // Add small delay to prevent Telegram Rate Limiting (429)
          await new Promise((resolve) => setTimeout(resolve, 300));

          processedCount++;
        }
      }

      // 5. Check Office
      for (const product of products) {
        const currentStock = officeMap.get(product.id) || 0;
        await this.checkStock(
          product.categoryId,
          product.typeId,
          null,
          currentStock,
          db,
          true, // Alert Office too?
        );

        // Add small delay
        await new Promise((resolve) => setTimeout(resolve, 300));

        processedCount++;
      }

      console.log(
        `[LowStockService] Full Scan Completed. Checked ${processedCount} items.`,
      );
    } catch (error) {
      console.error("[LowStockService] Full Scan Error:", error);
    }
  }
}
