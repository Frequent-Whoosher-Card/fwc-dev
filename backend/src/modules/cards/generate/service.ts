import db from "../../../config/db";
import { ValidationError } from "../../../utils/errors";
import { parseSmartSerial } from "../../../utils/serialHelper";
import bwipjs from "bwip-js";
import { createCanvas, loadImage, registerFont } from "canvas";
import fs from "fs";
import path from "path";

// ====== FONT SETUP ======
const FONT_PATH = path.resolve(process.cwd(), "assets/fonts/OCRB.ttf");
const FONT_FAMILY = "OCR-B";

// Load font once globally if possible, or handle safely
if (fs.existsSync(FONT_PATH)) {
  try {
    // Load for bwip-js
    bwipjs.loadFont(FONT_FAMILY, fs.readFileSync(FONT_PATH));
    // Load for canvas
    registerFont(FONT_PATH, { family: FONT_FAMILY });
  } catch (e) {
    console.warn("Could not load custom font:", e);
  }
}

// ====== TARGET DIMENSIONS ======
const TARGET_W = 552;
const TARGET_H = 208;
const M_LEFT = 10;
const M_TOP = 10;
const M_RIGHT = 10;
const M_BOTTOM = 20;

const CONTENT_W = TARGET_W - M_LEFT - M_RIGHT; // 532
const CONTENT_H = TARGET_H - M_TOP - M_BOTTOM; // 178

// ====== HELPER FUNCTIONS ======
function cropTight(src: any, pad = 0) {
  const w = src.width;
  const h = src.height;
  const ctx = src.getContext("2d");

  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;

  let minX = w,
    minY = h,
    maxX = 0,
    maxY = 0;
  let found = false;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const r = d[i],
        g = d[i + 1],
        b = d[i + 2],
        a = d[i + 3];

      // Treat as content if NOT white
      const nonWhite = a > 0 && (r < 250 || g < 250 || b < 250);
      if (nonWhite) {
        found = true;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (!found) return src;

  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(w - 1, maxX + pad);
  maxY = Math.min(h - 1, maxY + pad);

  const cw = maxX - minX + 1;
  const ch = maxY - minY + 1;

  const out = createCanvas(cw, ch);
  const octx = out.getContext("2d");
  octx.drawImage(src, minX, minY, cw, ch, 0, 0, cw, ch);

  return out;
}

export class CardGenerateService {
  static async generate(params: {
    cardProductId: string;
    startSerial: string;
    endSerial: string;
    userId: string;
  }) {
    const { cardProductId, startSerial, endSerial, userId } = params;

    const transaction = await db.$transaction(async (tx) => {
      // 2. Cek Product by ID (With Relations)
      const product = await tx.cardProduct.findUnique({
        where: { id: cardProductId },
        include: {
          category: true,
          type: true,
        },
      });

      if (!product) {
        throw new ValidationError("Produk tidak ditemukan");
      }

      // 3. Smart Parsing
      const yearSuffix = new Date().getFullYear().toString().slice(-2);

      const startNum = parseSmartSerial(
        startSerial,
        product.serialTemplate,
        yearSuffix
      );
      const endNum = parseSmartSerial(
        endSerial,
        product.serialTemplate,
        yearSuffix
      );

      if (endNum < startNum) {
        throw new ValidationError("End Serial harus >= Start Serial");
      }

      // Safe limit check
      const quantity = endNum - startNum + 1;
      if (quantity > 500) {
        throw new ValidationError("Maksimal 500 kartu per batch");
      }

      // X. Validate Sequential Serials
      const lastCard = await tx.card.findFirst({
        where: { cardProductId: product.id },
        orderBy: { serialNumber: "desc" },
      });

      let expectedStartNum = 1;
      const prefix = `${product.serialTemplate}${yearSuffix}`;

      if (lastCard && lastCard.serialNumber.startsWith(prefix)) {
        const lastSuffixStr = lastCard.serialNumber.slice(prefix.length);
        if (/^\d+$/.test(lastSuffixStr)) {
          expectedStartNum = Number(lastSuffixStr) + 1;
        }
      }

      if (startNum !== expectedStartNum) {
        throw new ValidationError(
          `Nomor serial harus berurutan. Serial terakhir di database untuk batch '${prefix}' adalah '${lastCard ? lastCard.serialNumber : "Belum ada"}'. Harap mulai dari suffix '${String(expectedStartNum).padStart(5, "0")}'`
        );
      }

      const width = 5;
      const serialNumbers: string[] = [];

      for (let i = 0; i < quantity; i++) {
        const sfx = String(startNum + i).padStart(width, "0");
        serialNumbers.push(`${product.serialTemplate}${yearSuffix}${sfx}`);
      }

      // 4. Cek Existing
      const existing = await tx.card.findFirst({
        where: { serialNumber: { in: serialNumbers } },
      });

      if (existing) {
        throw new ValidationError(
          `Serial ${existing.serialNumber} sudah ada. Generate gagal.`
        );
      }

      // 5. Generate Barcode Images & Prepare FileObjects
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");

      const storageRoot = path.join(process.cwd(), "storage");
      const barcodeDir = path.join(storageRoot, "barcode", String(year), month);

      if (!fs.existsSync(barcodeDir)) {
        fs.mkdirSync(barcodeDir, { recursive: true });
      }

      const fileObjectsData: any[] = [];
      const generatedFiles: string[] = [];
      const writePromises: Promise<void>[] = [];

      try {
        const batchParams = {
          categoryName: product.category.categoryName.replace(/\s+/g, "_"),
          typeName: product.type.typeName.replace(/\s+/g, "_"),
        };

        for (const sn of serialNumbers) {
          // Generate Filename: {Type}-{Category}-{Serial}.png
          const fileName = `${batchParams.typeName}-${batchParams.categoryName}-${sn}.png`;
          const absolutePath = path.join(barcodeDir, fileName);
          const relativePath = `storage/barcode/${year}/${month}/${fileName}`;

          const textFormatted = sn.split("").join(" ");

          // --- BWIP-JS GENERATION ---
          const pngBuffer = await bwipjs.toBuffer({
            bcid: "code128",
            text: sn.split("").join(" "), // Encoded data with spaces
            scale: 2, // module width in pixels
            scaleX: 2, // width multiplier
            scaleY: 2, // height multiplier
            includetext: false, // NO TEXT (Manual Render)
            paddingwidth: 0,
            paddingheight: 0,
            paddingleft: 0,
            paddingright: 0,
            paddingtop: 0,
            paddingbottom: 0,
            borderwidth: 0,
          });

          const barcodeImg = await loadImage(pngBuffer);

          // Calculate dimensions
          const barcodeWidth = barcodeImg.width;
          const barcodeHeight = barcodeImg.height;

          // Target barcode dimensions
          const targetBarcodeWidth = 530; // lebar barcode di canvas
          const targetBarcodeHeight = Math.round(
            barcodeHeight * (targetBarcodeWidth / barcodeWidth)
          );

          // Center position
          const barcodeX = Math.round((TARGET_W - targetBarcodeWidth) / 2);
          const barcodeY = 20; // margin top

          // Create Final Canvas
          const canvas = createCanvas(TARGET_W, TARGET_H);
          const ctx = canvas.getContext("2d");

          // White background
          ctx.fillStyle = "#fff";
          ctx.fillRect(0, 0, TARGET_W, TARGET_H);

          // Draw Barcode (NO SMOOTHING)
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(
            barcodeImg,
            barcodeX,
            barcodeY,
            targetBarcodeWidth,
            targetBarcodeHeight
          );

          // Draw Text Manually
          const textY = barcodeY + targetBarcodeHeight + 8;

          ctx.fillStyle = "#000000";
          ctx.font = `22px "${FONT_FAMILY}"`;
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          ctx.fillText(textFormatted, TARGET_W / 2, textY);

          const finalBuffer = canvas.toBuffer("image/png");

          // Push write operation
          writePromises.push(fs.promises.writeFile(absolutePath, finalBuffer));
          generatedFiles.push(absolutePath);

          const fileSizeApprox = Buffer.byteLength(finalBuffer);

          fileObjectsData.push({
            originalName: fileName,
            storedName: fileName,
            relativePath: relativePath,
            mimeType: "image/png",
            sizeBytes: fileSizeApprox,
            purpose: "BARCODE_IMAGE" as const,
            createdBy: userId,
          });
        }

        // Wait for all file writes to complete
        await Promise.all(writePromises);

        // 6. Insert FileObjects
        const createdFiles = await tx.fileObject.createManyAndReturn({
          data: fileObjectsData,
          select: { id: true, originalName: true },
        });

        const fileMap = new Map<string, string>();
        for (const f of createdFiles) {
          // Extract serial from filename: Type-Cat-Serial.png
          // We can use the logic that we know the prefix
          // Or just match simply since we generated it.
          // Better: Map via index if order preserved, or specific parsing.
          // Since createManyAndReturn preserves order in Postgres generally, but to be safe:

          // Let's parse strictly: {Type}-{Cat}-{Serial}.png
          // But safer is to relate by looking at the serial inside the name.
          // Strategy: The serial is the last part before extension.
          const parts = f.originalName.replace(".png", "").split("-");
          const serial = parts[parts.length - 1]; // Assume serial is last
          fileMap.set(serial, f.id);
        }

        // 7. Create Cards
        await tx.card.createMany({
          data: serialNumbers.map((sn) => ({
            serialNumber: sn,
            cardProductId: product.id,
            quotaTicket: product.totalQuota,
            status: "ON_REQUEST",
            fileObjectId: fileMap.get(sn) || null,
            createdBy: userId,
          })),
        });

        // 8. Log History (CardStockMovement - GENERATED)
        await tx.cardStockMovement.create({
          data: {
            type: "GENERATED",
            status: "APPROVED",
            categoryId: product.categoryId,
            typeId: product.typeId,
            quantity: quantity,
            note: `Generated Batch ${serialNumbers[0]} - ${serialNumbers[serialNumbers.length - 1]}`,
            sentSerialNumbers: serialNumbers,
            receivedSerialNumbers: serialNumbers, // Auto-received since generated
            createdBy: userId,
            movementAt: new Date(),
          },
        });

        return {
          message: `Berhasil generate ${quantity} kartu`,
          firstSerial: serialNumbers[0],
          lastSerial: serialNumbers[serialNumbers.length - 1],
          generatedFilesCount: generatedFiles.length,
        };
      } catch (error) {
        // Cleanup: Delete generated files if any error occurs
        if (generatedFiles.length > 0) {
          console.error(
            "Error during generation. Cleaning up created files..."
          );
          await Promise.all(
            generatedFiles.map(async (filePath) => {
              try {
                await fs.promises.unlink(filePath);
              } catch (e) {
                // Ignore
              }
            })
          );
        }
        throw error;
      }
    });

    return transaction;
  }

  // Get History (GENERATED Batches)
  static async getHistory(params: {
    page?: number;
    limit?: number;
    startDate?: Date;
    endDate?: Date;
    categoryId?: string;
    typeId?: string;
  }) {
    const {
      page = 1,
      limit = 10,
      startDate,
      endDate,
      categoryId,
      typeId,
    } = params;
    const skip = (page - 1) * limit;

    const where: any = {
      type: "GENERATED",
    };

    if (startDate && endDate) {
      where.movementAt = { gte: startDate, lte: endDate };
    } else if (startDate) {
      where.movementAt = { gte: startDate };
    } else if (endDate) {
      where.movementAt = { lte: endDate };
    }

    if (categoryId) where.categoryId = categoryId;
    if (typeId) where.typeId = typeId;

    const [items, total] = await Promise.all([
      db.cardStockMovement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { movementAt: "desc" },
        include: {
          category: { select: { id: true, categoryName: true } },
          cardType: { select: { id: true, typeName: true } },
        },
      }),
      db.cardStockMovement.count({ where }),
    ]);

    // Fetch user names manually or via relation if exists.
    // CardStockMovement has createdBy UUID. I'll fetch users or use a helper if needed.
    // For simplicity, I'll fetch users in bulk or just let ID be there?
    // User requested "response list". Usually wants names.
    // I will include creator name finding.
    const userIds = [
      ...new Set(
        items.map((i) => i.createdBy).filter((id): id is string => !!id)
      ),
    ];
    const users = await db.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, fullName: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u.fullName]));

    // Collect all serials to fetch cards in batch
    const allSerials = items.flatMap((i) => i.receivedSerialNumbers || []);
    const allCards = await db.card.findMany({
      where: { serialNumber: { in: allSerials } },
      select: {
        id: true,
        serialNumber: true,
        status: true,
        fileObject: { select: { relativePath: true } },
      },
    });
    // Group cards by serial (or just use serial to lookup, but duplicates possible if sequential? No serial is unique)
    const cardMap = new Map(allCards.map((c) => [c.serialNumber, c]));

    const formattedItems = items.map((item) => {
      const serials = item.receivedSerialNumbers || [];
      const itemCards = serials
        .map((sn) => cardMap.get(sn))
        .filter((c) => c !== undefined) as any[];

      return {
        id: item.id,
        movementAt: item.movementAt.toISOString(),
        quantity: item.quantity,
        status: item.status,
        note: item.note,
        createdByName: item.createdBy
          ? userMap.get(item.createdBy) || null
          : null,
        category: {
          id: item.category.id,
          name: item.category.categoryName,
        },
        type: {
          id: item.cardType.id,
          name: item.cardType.typeName,
        },
        serialNumbers: serials,
        cards: itemCards.map((c: any) => ({
          id: c.id,
          serialNumber: c.serialNumber,
          status: c.status,
          barcodeUrl: c.fileObject ? `/${c.fileObject.relativePath}` : null,
        })),
      };
    });

    return {
      items: formattedItems,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get History Detail (With Card List)
  static async getHistoryDetail(id: string) {
    const movement = await db.cardStockMovement.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, categoryName: true } },
        cardType: { select: { id: true, typeName: true } },
      },
    });

    if (!movement) {
      throw new ValidationError("Data history generation tidak ditemukan");
    }

    // Fetch Creator Name
    let createdByName: string | null = null;
    if (movement.createdBy) {
      const user = await db.user.findUnique({
        where: { id: movement.createdBy },
        select: { fullName: true },
      });
      createdByName = user?.fullName || null;
    }

    // Fetch Cards based on receivedSerialNumbers
    // receivedSerialNumbers is String[] in DB schema/Prisma
    const serials = movement.receivedSerialNumbers || [];

    // Find cards with these serials AND matching product type/category to be safe
    // But serials should be unique globaly generally.
    const cards = await db.card.findMany({
      where: {
        serialNumber: { in: serials },
        // Optional: deletedAt: null? Maybe show even if deleted.
      },
      orderBy: { serialNumber: "asc" },
      select: {
        id: true,
        serialNumber: true,
        status: true,
        createdAt: true,
        fileObject: { select: { relativePath: true } },
      },
    });

    return {
      movement: {
        id: movement.id,
        movementAt: movement.movementAt.toISOString(),
        quantity: movement.quantity,
        status: movement.status,
        note: movement.note,
        createdByName,
        category: {
          id: movement.category.id,
          name: movement.category.categoryName,
        },
        type: {
          id: movement.cardType.id,
          name: movement.cardType.typeName,
        },
        serialNumbers: serials,
      },
      cards: cards.map((c) => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
        barcodeUrl: c.fileObject ? `/${c.fileObject.relativePath}` : null,
        fileObject: undefined, // Exclude raw fileObject from final response
      })),
    };
  }
}
