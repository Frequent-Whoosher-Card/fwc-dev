/**
 * Temporary Storage Management for Cropped Images
 * Manages temporary storage of cropped images with TTL (Time To Live)
 * Used for storing cropped KTP images between detection and OCR steps
 */

import { writeFile, readFile, unlink, mkdir, access, constants } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { randomUUID } from "node:crypto";

const TEMP_STORAGE_DIR = join(tmpdir(), "ktp_cropped_images");
const DEFAULT_TTL = 30 * 60 * 1000; // 30 minutes in milliseconds

interface StoredImage {
  sessionId: string;
  croppedImage: string; // base64 encoded
  bbox: [number, number, number, number];
  originalSize: [number, number];
  confidence?: number;
  createdAt: number;
  expiresAt: number;
}

interface StoredImages {
  sessionId: string;
  images: Array<{
    croppedImage: string;
    bbox: [number, number, number, number];
    originalSize: [number, number];
    confidence?: number;
  }>;
  createdAt: number;
  expiresAt: number;
}

class TempStorage {
  private static instance: TempStorage | null = null;

  private constructor() {
    // Ensure temp directory exists
    mkdir(TEMP_STORAGE_DIR, { recursive: true }).catch((err) => {
      console.error(`[TempStorage] Failed to create temp directory: ${err}`);
    });
  }

  static getInstance(): TempStorage {
    if (!TempStorage.instance) {
      TempStorage.instance = new TempStorage();
    }
    return TempStorage.instance;
  }

  /**
   * Store a single cropped image
   */
  async storeImage(
    sessionId: string,
    croppedImage: string,
    bbox: [number, number, number, number],
    originalSize: [number, number],
    confidence?: number,
    ttl: number = DEFAULT_TTL
  ): Promise<void> {
    await mkdir(TEMP_STORAGE_DIR, { recursive: true });

    const now = Date.now();
    const stored: StoredImage = {
      sessionId,
      croppedImage,
      bbox,
      originalSize,
      confidence,
      createdAt: now,
      expiresAt: now + ttl,
    };

    const filePath = join(TEMP_STORAGE_DIR, `${sessionId}.json`);
    await writeFile(filePath, JSON.stringify(stored), "utf-8");
  }

  /**
   * Store multiple cropped images
   */
  async storeImages(
    sessionId: string,
    images: Array<{
      croppedImage: string;
      bbox: [number, number, number, number];
      originalSize: [number, number];
      confidence?: number;
    }>,
    ttl: number = DEFAULT_TTL
  ): Promise<void> {
    await mkdir(TEMP_STORAGE_DIR, { recursive: true });

    const now = Date.now();
    const stored: StoredImages = {
      sessionId,
      images,
      createdAt: now,
      expiresAt: now + ttl,
    };

    const filePath = join(TEMP_STORAGE_DIR, `${sessionId}.json`);
    await writeFile(filePath, JSON.stringify(stored), "utf-8");
  }

  /**
   * Retrieve stored image(s) by sessionId
   */
  async getImage(sessionId: string): Promise<StoredImage | null> {
    const filePath = join(TEMP_STORAGE_DIR, `${sessionId}.json`);

    try {
      await access(filePath, constants.F_OK);
      const data = await readFile(filePath, "utf-8");
      const stored = JSON.parse(data) as StoredImage | StoredImages;

      // Check if expired
      if (stored.expiresAt < Date.now()) {
        // Cleanup expired file
        await this.deleteImage(sessionId);
        return null;
      }

      // Handle both single image and multiple images format
      if ('croppedImage' in stored) {
        return stored as StoredImage;
      } else if ('images' in stored) {
        // Convert multiple images format to single (return first one)
        const multiStored = stored as StoredImages;
        if (multiStored.images.length > 0) {
          const first = multiStored.images[0];
          return {
            sessionId: multiStored.sessionId,
            croppedImage: first.croppedImage,
            bbox: first.bbox,
            originalSize: first.originalSize,
            confidence: first.confidence,
            createdAt: multiStored.createdAt,
            expiresAt: multiStored.expiresAt,
          };
        }
      }

      return null;
    } catch (error) {
      // File doesn't exist or can't be read
      return null;
    }
  }

  /**
   * Retrieve all stored images by sessionId (for multiple detections)
   */
  async getImages(sessionId: string): Promise<StoredImages | null> {
    const filePath = join(TEMP_STORAGE_DIR, `${sessionId}.json`);

    try {
      await access(filePath, constants.F_OK);
      const data = await readFile(filePath, "utf-8");
      const stored = JSON.parse(data) as StoredImage | StoredImages;

      // Check if expired
      if (stored.expiresAt < Date.now()) {
        // Cleanup expired file
        await this.deleteImage(sessionId);
        return null;
      }

      // Handle both formats
      if ('images' in stored) {
        return stored as StoredImages;
      } else if ('croppedImage' in stored) {
        // Convert single image format to multiple
        const singleStored = stored as StoredImage;
        return {
          sessionId: singleStored.sessionId,
          images: [{
            croppedImage: singleStored.croppedImage,
            bbox: singleStored.bbox,
            originalSize: singleStored.originalSize,
            confidence: singleStored.confidence,
          }],
          createdAt: singleStored.createdAt,
          expiresAt: singleStored.expiresAt,
        };
      }

      return null;
    } catch (error) {
      // File doesn't exist or can't be read
      return null;
    }
  }

  /**
   * Delete stored image(s) by sessionId
   */
  async deleteImage(sessionId: string): Promise<void> {
    const filePath = join(TEMP_STORAGE_DIR, `${sessionId}.json`);
    try {
      await unlink(filePath);
    } catch (error) {
      // File doesn't exist, ignore error
    }
  }

  /**
   * Cleanup expired files (should be called periodically)
   */
  async cleanupExpired(): Promise<number> {
    await mkdir(TEMP_STORAGE_DIR, { recursive: true });
    
    const { readdir } = await import("fs/promises");
    const files = await readdir(TEMP_STORAGE_DIR);
    let cleanedCount = 0;

    for (const file of files) {
      if (!file.endsWith('.json')) continue;

      const filePath = join(TEMP_STORAGE_DIR, file);
      try {
        const data = await readFile(filePath, "utf-8");
        const stored = JSON.parse(data) as StoredImage | StoredImages;

        if (stored.expiresAt < Date.now()) {
          await unlink(filePath);
          cleanedCount++;
        }
      } catch (error) {
        // If file is corrupted or can't be read, delete it
        try {
          await unlink(filePath);
          cleanedCount++;
        } catch {
          // Ignore deletion errors
        }
      }
    }

    return cleanedCount;
  }

  /**
   * Generate a new session ID
   */
  generateSessionId(): string {
    return randomUUID();
  }
}

export const tempStorage = TempStorage.getInstance();
