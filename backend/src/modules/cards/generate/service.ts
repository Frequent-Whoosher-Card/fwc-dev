import db from "../../../config/db";
import { ValidationError } from "../../../utils/errors";
import { parseSmartSerial } from "../../../utils/serialHelper";
import JsBarcode from "jsbarcode";
import { DOMImplementation, XMLSerializer } from "xmldom";
import fs from "fs";
import path from "path";

export class CardGenerateService {
  static async generate(params: {
    cardProductId: string;
    startSerial: string;
    endSerial: string;
    userId: string;
  }) {
    const { cardProductId, startSerial, endSerial, userId } = params;

    // 1. Validasi Input (Basic)
    // Removed regex check strictness to allow alphanumeric full serials (handled by parseSmartSerial)

    const transaction = await db.$transaction(async (tx) => {
      // 2. Cek Product by ID
      const product = await tx.cardProduct.findUnique({
        where: { id: cardProductId },
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
      // Find the last card for this product to ensure we continue the sequence
      const lastCard = await tx.card.findFirst({
        where: { cardProductId: product.id },
        orderBy: { serialNumber: "desc" },
      });

      let expectedStartNum = 1;

      // Logic:
      // If we have a last card, check if it belongs to the SAME prefix (Template + Year).
      // If yes, expected = lastSuffix + 1.
      // If no (different year, e.g. last was 23, now 24), expected = 1.
      const prefix = `${product.serialTemplate}${yearSuffix}`;

      if (lastCard && lastCard.serialNumber.startsWith(prefix)) {
        // Extract suffix from last card
        const lastSuffixStr = lastCard.serialNumber.slice(prefix.length);
        if (/^\d+$/.test(lastSuffixStr)) {
          expectedStartNum = Number(lastSuffixStr) + 1;
        }
      }

      // Validation
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

      const xmlSerializer = new XMLSerializer();
      const document = new DOMImplementation().createDocument(
        "http://www.w3.org/1999/xhtml",
        "html",
        null
      );

      const fileObjectsData: any[] = [];
      const generatedFiles: string[] = [];

      // Prepare data & Generate SVGs in memory (CPU bound)
      // Writing to disk will be handled in parallel to avoid blocking
      const writePromises: Promise<void>[] = [];

      for (const sn of serialNumbers) {
        const svgNode = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "svg"
        );

        JsBarcode(svgNode, sn, {
          xmlDocument: document,
          format: "CODE128",
          width: 2,
          height: 100,
          displayValue: true,
        });

        const svgString = xmlSerializer.serializeToString(svgNode);
        const fileName = `${sn}.svg`;
        const absolutePath = path.join(barcodeDir, fileName);
        const relativePath = `storage/barcode/${year}/${month}/${fileName}`;

        // Push write operation to promise array
        writePromises.push(fs.promises.writeFile(absolutePath, svgString));
        generatedFiles.push(absolutePath);

        const fileSizeApprox = Buffer.byteLength(svgString); // Approx size before write

        fileObjectsData.push({
          originalName: fileName,
          storedName: fileName,
          relativePath: relativePath,
          mimeType: "image/svg+xml",
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
        const serial = f.originalName.replace(".svg", "");
        fileMap.set(serial, f.id);
      }

      // 7. Create Cards
      await tx.card.createMany({
        data: serialNumbers.map((sn) => ({
          serialNumber: sn,
          cardProductId: product.id,
          quotaTicket: product.totalQuota,
          status: "ON_REQUEST", // Pastikan enum ini valid di DB
          fileObjectId: fileMap.get(sn) || null,
          createdBy: userId,
        })),
      });

      return {
        message: `Berhasil generate ${quantity} kartu`,
        firstSerial: serialNumbers[0],
        lastSerial: serialNumbers[serialNumbers.length - 1],
        generatedFilesCount: generatedFiles.length,
      };
    });

    return transaction;
  }
}
