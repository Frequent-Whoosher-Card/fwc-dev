import { FilePurpose } from "@prisma/client";
import db from "../config/db";
import { v4 as uuidv4 } from "uuid";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export async function uploadStockFile(
  file: File,
  userId: string,
  purpose: FilePurpose,
  subDir: string,
  filenameOverride?: string,
): Promise<string> {
  console.log("[DEBUG uploadStockFile] Starting...", {
    filename: file.name,
    type: file.type,
    size: file.size,
  });
  const mimeType = file.type || "application/octet-stream";
  // Determine extension
  let ext = "bin";
  if (mimeType === "image/jpeg") ext = "jpg";
  else if (mimeType === "image/png") ext = "png";
  else if (mimeType === "application/pdf") ext = "pdf";
  else {
    // Try to guess from name if possible, or default
    const parts = file.name.split(".");
    if (parts.length > 1) ext = parts[parts.length - 1];
  }

  const fileId = uuidv4();
  let storedName = `${fileId}.${ext}`;
  let originalName = file.name;

  if (filenameOverride) {
    // Sanitize: remove non-alphanumeric except - _
    const safeName = filenameOverride.replace(/[^a-zA-Z0-9\-_]/g, "-");
    // Ensure uniqueness with timestamp
    storedName = `${Date.now()}-${safeName}.${ext}`;
    originalName = `${safeName}.${ext}`;
  }

  // Determine directory structure: storage/{subDir}/YYYY/MM
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  const relativeDir = `storage/${subDir}/${year}/${month}`;
  const relativePath = `${relativeDir}/${storedName}`;

  // Ensure directory exists
  await fs.mkdir(relativeDir, { recursive: true });

  // Convert File to Buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Calculate checksum
  const checksumSha256 = crypto
    .createHash("sha256")
    .update(buffer)
    .digest("hex");

  // Write file
  await fs.writeFile(relativePath, buffer);

  // Save to DB
  const fileObject = await db.fileObject.create({
    data: {
      id: fileId,
      originalName,
      storedName,
      relativePath,
      mimeType,
      sizeBytes: file.size,
      checksumSha256,
      purpose,
      createdBy: userId,
    },
  });

  return fileObject.id;
}

export async function deleteStockFile(fileId: string) {
  try {
    const fileObject = await db.fileObject.findUnique({
      where: { id: fileId },
    });

    if (!fileObject) return;

    // Delete physically
    try {
      await fs.unlink(fileObject.relativePath);
    } catch (err) {
      console.warn(
        `[deleteStockFile] Failed to delete physical file ${fileObject.relativePath}:`,
        err,
      );
    }

    // Delete DB record
    await db.fileObject.delete({ where: { id: fileId } });
  } catch (error) {
    console.error(`[deleteStockFile] Error deleting file ${fileId}:`, error);
  }
}
