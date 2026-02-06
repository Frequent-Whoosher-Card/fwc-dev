import db from "../config/db";
import { LowStockService } from "../services/lowStockService";
import { TelegramService } from "../services/telegramService";

export class LowStockCron {
  /**
   * Run the low stock reminder and cleanup job.
   * This re-verifies all active alerts and sends reminders if needed.
   */
  static async runJob() {
    console.log("[LowStockCron] Starting check...");

    try {
      // 0. Perform Full Inventory Scan first (to create new alerts if any)
      console.log("[LowStockCron] Scanning inventory for new low stock...");
      await LowStockService.scanAllInventory();

      // 1. Fetch all active alerts (including newly created ones)
      console.log("[LowStockCron] Fetching active alerts from DB...");
      const activeAlerts = await db.lowStockAlert.findMany({
        include: {
          category: true,
          type: true,
          station: true,
        },
      });

      if (activeAlerts.length === 0) {
        console.log("[LowStockCron] No active alerts to process.");
        return;
      }

      const REMINDER_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours interval for reminders
      const now = new Date();

      for (const alert of activeAlerts) {
        // 2. Re-verify actual stock count
        const currentStock = await db.card.count({
          where: {
            cardProduct: {
              categoryId: alert.categoryId,
              typeId: alert.typeId,
            },
            status: alert.stationId ? "IN_STATION" : "IN_OFFICE",
            stationId: alert.stationId,
          },
        });

        const threshold = alert.threshold;
        const stationName = alert.station?.stationName || "Head Office";
        const configSuffix = alert.station?.stationCode?.toUpperCase() || "HO";
        const programLabel =
          alert.category.programType === "FWC" ? "📇 FWC" : "🎫 VOUCHER";
        const productName = `${programLabel} | ${alert.category.categoryName} - ${alert.type.typeName}`;

        if (currentStock < threshold) {
          // --- STILL LOW STOCK ---

          // Check if it's time for a reminder
          const timeSinceLastAlert =
            now.getTime() - alert.lastAlertAt.getTime();

          if (timeSinceLastAlert >= REMINDER_INTERVAL_MS) {
            // CHECK WORKING HOURS (08:00 - 18:00) IN WIB (Asia/Jakarta)
            const dateInWIB = new Date(
              now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }),
            );
            const currentHourWIB = dateInWIB.getHours();

            const START_HOUR = 7;
            const END_HOUR = 21; // Until 21:00

            if (currentHourWIB < START_HOUR || currentHourWIB >= END_HOUR) {
              console.log(
                `[LowStockCron] Skip reminder for ${stationName} (Outside working hours ${START_HOUR}-${END_HOUR} WIB. Current: ${currentHourWIB})`,
              );
              continue; // Skip to next alert
            }

            console.log(
              `[LowStockCron] Sending reminder for ${stationName} - ${productName}`,
            );

            // Update current stock in alert record
            await db.lowStockAlert.update({
              where: { id: alert.id },
              data: {
                currentStock,
                lastAlertAt: now,
                updatedAt: now,
              },
            });

            // Send Telegram Reminder
            // Sanitize again just to be safe
            const safeSuffix = configSuffix.replace(/\s+/g, "_").toUpperCase();

            const token =
              process.env[`TELEGRAM_BOT_TOKEN_${safeSuffix}`] ||
              process.env[`TELEGRAM_TOKEN_${safeSuffix}`] ||
              process.env.TELEGRAM_BOT_TOKEN ||
              process.env.TELEGRAM_TOKEN;

            const chatId = process.env[`TELEGRAM_CHAT_ID_${safeSuffix}`];

            if (token && chatId) {
              const telegramMsg =
                `🔔 *REMINDER: STOK MASIH RENDAH*\n\n` +
                `📍 Stasiun: *${stationName}*\n` +
                `📦 Produk: *${productName}*\n\n` +
                `📊 Status Stok Aktual:\n` +
                `• Sisa: *${currentStock}*\n` +
                `• Minimum: *${threshold}*\n\n` +
                `_Mohon segera dilakukan pengisian stok._`;

              TelegramService.sendMessage(token, chatId, telegramMsg).catch(
                (err) =>
                  console.error(
                    `[LowStockCron] Telegram reminder failed:`,
                    err,
                  ),
              );

              // Rate Limit Delay
              await new Promise((resolve) => setTimeout(resolve, 300));
            }
          }
        } else {
          // --- STOCK RECOVERED ---
          console.log(
            `[LowStockCron] Stock recovered for ${stationName} - ${productName}. Auto-clearing record.`,
          );

          await db.lowStockAlert.delete({
            where: { id: alert.id },
          });

          // Resolve Inbox
          await db.inbox.updateMany({
            where: {
              type: "LOW_STOCK_ALERT",
              stationId: alert.stationId,
              isRead: false,
              payload: {
                path: ["categoryId"],
                equals: alert.categoryId,
              },
            },
            data: { isRead: true },
          });
        }
      }
    } catch (error) {
      console.error("[LowStockCron] Error running job:", error);
    }
  }
}
