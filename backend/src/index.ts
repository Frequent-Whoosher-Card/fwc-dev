import path from "path";
import { config } from "dotenv";
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { cron } from "@elysiajs/cron";
import { docsConfig } from "./docs";
import { auth } from "./modules/auth";
import { users } from "./modules/users";
import { cardCategory } from "./modules/cards/category";
import { cardTypes } from "./modules/cards/type";
import { productTypeRoutes } from "./modules/cards/product-type";
import { cardStatusRoutes } from "./modules/cards/status";
import { cardProducts } from "./modules/cards/product";
import { cards } from "./modules/cards/card";
import { transfers } from "./modules/cards/transfer";
import { cardGenerateRoutes } from "./modules/cards/generate";
import { sales } from "./modules/sales";
import { metrics } from "./modules/metrics";
import { stock } from "./modules/stock";
import { station } from "./modules/station";
import { cardInventory } from "./modules/stock/inventory";
import { members } from "./modules/members";
import { city } from "./modules/city";
import { purchases } from "./modules/purchases";
import { AuthenticationError, AuthorizationError } from "./utils/errors";
import { inbox } from "./modules/inbox";
import { redeem } from "./modules/redeem";
import { cardSwaps } from "./modules/card-swaps";
import { bulkDiscount } from "./modules/discount";
import { employeeTypeController } from "./modules/employee-types";
import { paymentMethodController } from "./modules/payment-methods";
import { permissions } from "./modules/permissions";
import { menuAccess } from "./modules/menu-access";
import { notificationRoutes } from "./modules/notification";

config();
const PORT = process.env.APP_PORT ? Number(process.env.APP_PORT) : 3001;

const app = new Elysia()
  .use(docsConfig)
  .use(cors())
  .get("/", () => ({
    success: true,
    message: "FWC API is running",
    version: "1.0.0",
  }))
  .use(auth)
  .use(users)
  .use(members)
  .use(city)
  .use(purchases)
  .use(employeeTypeController)
  .use(paymentMethodController)
  .use(cardSwaps)
  .use(cardCategory)
  .use(cardTypes)
  .use(productTypeRoutes)
  .use(cardStatusRoutes)
  .use(cardProducts)
  .use(cards)
  .use(transfers)
  .use(cardGenerateRoutes)
  .use(station)
  .use(cardInventory)
  .use(stock)
  .use(sales)
  .use(metrics)
  .use(inbox)
  .use(notificationRoutes)
  .use(redeem)
  .use(bulkDiscount)
  .use(permissions)
  .use(menuAccess)
  // .use(superset)

  // --- CRON JOBS ---
  .use(
    cron({
      name: "temp-cleanup",
      pattern: "*/30 * * * *", // Run every 30 minutes
      async run() {
        try {
          const { tempStorage } = await import("./utils/temp_storage");
          const cleanedCount = await tempStorage.cleanupExpired();
          if (cleanedCount > 0) {
            console.log(
              `[Cleanup-Cron] Removed ${cleanedCount} expired temporary file(s)`,
            );
          }
        } catch (error) {
          console.error(
            "[Cleanup-Cron] Error cleaning up temporary files:",
            error,
          );
        }
      },
    }),
  )
  .use(
    cron({
      name: "low-stock-reminder",
      pattern: "0 * * * *", // Run every hour at minute 0
      async run() {
        try {
          const { LowStockCron } = await import("./cron/lowStockReminder");
          console.log("[LowStock-Cron] Running periodic check...");
          await LowStockCron.runJob();
        } catch (error) {
          console.error("[LowStock-Cron] Error running job:", error);
        }
      },
    }),
  )
  // -----------------

  .onError(({ code, error, set }) => {
    // Global error handler
    if (code === "VALIDATION") {
      set.status = 422;

      // Extract validation details from TypeBox error
      let message = "Validation error";
      let details: any = null;

      if (error && typeof error === "object") {
        // Elysia wraps TypeBox errors
        if ("all" in error && Array.isArray((error as any).all)) {
          details = (error as any).all.map((e: any) => ({
            path: e.path,
            message: e.message,
            value: e.value,
          }));
          message = details
            .map((d: any) => `${d.path}: ${d.message}`)
            .join("; ");
        } else if (error.message) {
          message = error.message;
        }
      }

      console.error("[VALIDATION ERROR]", { message, details, raw: error });

      return {
        success: false,
        error: {
          message,
          code: "VALIDATION_ERROR",
          statusCode: 422,
          details,
        },
      };
    }

    if (code === "NOT_FOUND") {
      set.status = 404;
      return {
        success: false,
        error: {
          message: "Route not found",
          code: "NOT_FOUND",
          statusCode: 404,
        },
      };
    }

    // Handle AuthorizationError
    if (error instanceof AuthorizationError) {
      set.status = error.statusCode;
      return {
        success: false,
        error: {
          message: error.message,
          code: error.code || "AUTHORIZATION_ERROR",
          statusCode: error.statusCode,
        },
      };
    }

    // Handle AuthenticationError
    if (error instanceof AuthenticationError) {
      set.status = error.statusCode;
      return {
        success: false,
        error: {
          message: error.message,
          code: error.code || "AUTH_ERROR",
          statusCode: error.statusCode,
        },
      };
    }

    set.status = 500;
    return {
      success: false,
      error: {
        message:
          error instanceof Error ? error.message : "Internal server error",
        code: "INTERNAL_ERROR",
        statusCode: 500,
      },
    };
  })
  // Static File Serving
  .get("/storage/*", async ({ params }) => {
    // Basic Path Traversal Protection
    const cleanPath = params["*"].replace(/\.\./g, "");
    const filePath = path.join(process.cwd(), "storage", cleanPath);
    return Bun.file(filePath);
  })
  .listen(PORT);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);

// Cleanup job for temporary storage (runs every 30 minutes)
// (Manual setIntervals removed in favor of @elysiajs/cron above)

// Run Low Stock Job immediately on startup
(async () => {
  try {
    const { LowStockCron } = await import("./cron/lowStockReminder");
    console.log("[Cron] Running initial LowStock check...");
    await LowStockCron.runJob();
  } catch (error) {
    console.error("[Cron] Error running initial LowStockCron:", error);
  }
})();

// Graceful shutdown untuk OCR daemon dan KTP detection daemon
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully...");
  try {
    const { ocrService } = await import("./services/ocr_service");
    await ocrService.shutdown();
  } catch (e) {
    // Ignore if OCR service not initialized
  }
  try {
    const { ktpDetectionService } =
      await import("./services/ktp_detection_service");
    await ktpDetectionService.shutdown();
  } catch (e) {
    // Ignore if detection service not initialized
  }
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, shutting down gracefully...");
  try {
    const { ocrService } = await import("./services/ocr_service");
    await ocrService.shutdown();
  } catch (e) {
    // Ignore if OCR service not initialized
  }
  try {
    const { ktpDetectionService } =
      await import("./services/ktp_detection_service");
    await ktpDetectionService.shutdown();
  } catch (e) {
    // Ignore if detection service not initialized
  }
  process.exit(0);
});
