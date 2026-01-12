import path from 'path';
import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { docsConfig } from './docs';
import { auth } from './modules/auth';
import { users } from './modules/users';
import { cardCategory } from './modules/cards/category';
import { cardTypes } from './modules/cards/type';
import { cardProducts } from './modules/cards/product';
import { cards } from './modules/cards/card';
import { cardGenerateRoutes } from './modules/cards/generate';
import { sales } from './modules/sales';
import { metrics } from './modules/metrics';
import { stock } from './modules/stock';
import { station } from './modules/station';
import { cardInventory } from './modules/stock/inventory';
import { members } from './modules/members';
import { purchases } from './modules/purchases';
import { AuthenticationError, AuthorizationError } from './utils/errors';
import { inbox } from './modules/inbox';
import { redeem } from './modules/redeem';
// import { superset } from "./modules/superset";

const app = new Elysia()
  .use(docsConfig)
  .use(cors())
  .get('/', () => ({
    success: true,
    message: 'FWC API is running',
    version: '1.0.0',
  }))
  .use(auth)
  .use(users)
  .use(members)
  .use(purchases)
  .use(cardCategory)
  .use(cardTypes)
  .use(cardProducts)
  .use(cards)
  .use(cardGenerateRoutes)
  .use(station)
  .use(cardInventory)
  .use(stock)
  .use(sales)
  .use(metrics)
  .use(inbox)
  .use(redeem)
  // .use(superset)

  .onError(({ code, error, set }) => {
    // Global error handler
    if (code === 'VALIDATION') {
      set.status = 400;
      return {
        success: false,
        error: {
          message: error.message,
          code: 'VALIDATION_ERROR',
          statusCode: 400,
        },
      };
    }

    if (code === 'NOT_FOUND') {
      set.status = 404;
      return {
        success: false,
        error: {
          message: 'Route not found',
          code: 'NOT_FOUND',
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
          code: error.code || 'AUTHORIZATION_ERROR',
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
          code: error.code || 'AUTH_ERROR',
          statusCode: error.statusCode,
        },
      };
    }

    set.status = 500;
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Internal server error',
        code: 'INTERNAL_ERROR',
        statusCode: 500,
      },
    };
  })
  // Static File Serving
  .get('/storage/*', async ({ params }) => {
    // Basic Path Traversal Protection
    const cleanPath = params['*'].replace(/\.\./g, '');
    const filePath = path.join(process.cwd(), 'storage', cleanPath);
    return Bun.file(filePath);
  })
  .listen(3001);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);

// Cleanup job for temporary storage (runs every 30 minutes)
setInterval(
  async () => {
    try {
      const { tempStorage } = await import('./utils/temp_storage');
      const cleanedCount = await tempStorage.cleanupExpired();
      if (cleanedCount > 0) {
        console.log(`[Cleanup] Removed ${cleanedCount} expired temporary file(s)`);
      }
    } catch (error) {
      console.error('[Cleanup] Error cleaning up temporary files:', error);
    }
  },
  30 * 60 * 1000
); // 30 minutes

// Run cleanup immediately on startup
(async () => {
  try {
    const { tempStorage } = await import('./utils/temp_storage');
    const cleanedCount = await tempStorage.cleanupExpired();
    if (cleanedCount > 0) {
      console.log(`[Cleanup] Removed ${cleanedCount} expired temporary file(s) on startup`);
    }
  } catch (error) {
    console.error('[Cleanup] Error cleaning up temporary files on startup:', error);
  }
})();

// Graceful shutdown untuk OCR daemon dan KTP detection daemon
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  try {
    const { ocrService } = await import('./services/ocr_service');
    await ocrService.shutdown();
  } catch (e) {
    // Ignore if OCR service not initialized
  }
  try {
    const { ktpDetectionService } = await import('./services/ktp_detection_service');
    await ktpDetectionService.shutdown();
  } catch (e) {
    // Ignore if detection service not initialized
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  try {
    const { ocrService } = await import('./services/ocr_service');
    await ocrService.shutdown();
  } catch (e) {
    // Ignore if OCR service not initialized
  }
  try {
    const { ktpDetectionService } = await import('./services/ktp_detection_service');
    await ktpDetectionService.shutdown();
  } catch (e) {
    // Ignore if detection service not initialized
  }
  process.exit(0);
});
