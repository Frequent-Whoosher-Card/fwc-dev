import ExcelJS from "exceljs";
import * as fs from "fs";
import * as path from "path";
import db from "../../config/db";
import { ValidationError, NotFoundError } from "../../utils/errors";

export class ReconciliationService {
  /**
   * Storage directory for reconciliation CSV files
   */
  private static getStorageDir(): string {
    const storageDir = path.join(process.cwd(), "storage", "reconciliation");
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }
    return storageDir;
  }

  /**
   * Find NIK/Passport column and header row in Excel
   */
  private static findNikColumn(data: any[][]): {
    nikColIdx: number;
    headerRowIdx: number;
  } | null {
    for (let rowIdx = 0; rowIdx < Math.min(10, data.length); rowIdx++) {
      const row = data[rowIdx];
      if (!row) continue;

      for (let colIdx = 0; colIdx < row.length; colIdx++) {
        const cellValue = String(row[colIdx] || "").toLowerCase().trim();
        // More flexible matching for NIK/Passport column
        if (
          (cellValue.includes("nik") && cellValue.includes("passport")) ||
          cellValue === "nik/passport no." ||
          cellValue === "nik/passport no" ||
          cellValue === "nik / passport no." ||
          cellValue === "nik" ||
          cellValue.includes("nik/passport")
        ) {
          console.log(`[Reconciliation] Found NIK column at row ${rowIdx}, col ${colIdx}: "${row[colIdx]}"`);
          return { nikColIdx: colIdx, headerRowIdx: rowIdx };
        }
      }
    }
    return null;
  }

  /**
   * Find PlatTrade No column (serial number)
   */
  private static findPlatTradeColumn(
    data: any[][],
    headerRowIdx: number
  ): number | null {
    const headerRow = data[headerRowIdx];
    if (!headerRow) return null;

    for (let colIdx = 0; colIdx < headerRow.length; colIdx++) {
      const cellValue = String(headerRow[colIdx] || "").toLowerCase().trim();
      if (
        cellValue.includes("plattrade") ||
        cellValue.includes("plat trade") ||
        cellValue === "plattrade no"
      ) {
        return colIdx;
      }
    }
    return null;
  }

  /**
   * Find Ticketing Time column
   */
  private static findTicketingTimeColumn(
    data: any[][],
    headerRowIdx: number
  ): number | null {
    const headerRow = data[headerRowIdx];
    if (!headerRow) return null;

    for (let colIdx = 0; colIdx < headerRow.length; colIdx++) {
      const cellValue = String(headerRow[colIdx] || "").toLowerCase().trim();
      if (
        cellValue.includes("ticketing time") ||
        cellValue === "ticketing time"
      ) {
        return colIdx;
      }
    }
    return null;
  }

  /**
   * Parse ticketing date from various formats
   * Supports: 20260108, 2026-01-08, 08/01/2026
   */
  private static parseTicketingDate(value: any): Date | null {
    if (!value) return null;

    const str = String(value).trim();

    // Format: 20260108 (YYYYMMDD)
    if (/^\d{8}$/.test(str)) {
      const year = parseInt(str.substring(0, 4));
      const month = parseInt(str.substring(4, 6)) - 1;
      const day = parseInt(str.substring(6, 8));
      // Use UTC to avoid timezone issues
      return new Date(Date.UTC(year, month, day));
    }

    // Format: 2026-01-08 (YYYY-MM-DD)
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      const [year, month, day] = str.split("-").map(Number);
      // Use UTC to avoid timezone issues
      return new Date(Date.UTC(year, month - 1, day));
    }

    // Format: 08/01/2026 (DD/MM/YYYY)
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
      const [day, month, year] = str.split("/").map(Number);
      // Use UTC to avoid timezone issues
      return new Date(Date.UTC(year, month - 1, day));
    }

    return null;
  }

  /**
   * Clean NIK by removing FW prefix
   */
  private static cleanNik(nik: string): string {
    return nik.replace(/^fw/i, "").trim();
  }

  /**
   * Upload and process Excel file
   */
  static async uploadAndProcess(
    file: File,
    userId: string
  ): Promise<{
    batchId: string;
    fileName: string;
    totalRows: number;
    csvPath: string;
  }> {
    // 1. Save file temporarily
    const tempDir = path.join(process.cwd(), "storage", "temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const tempFilePath = path.join(tempDir, `upload_${Date.now()}.xlsx`);
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(tempFilePath, buffer);
    
    console.log(`[Reconciliation] Saved temp file: ${tempFilePath}, size: ${buffer.length} bytes`);

    // 2. Read Excel file using ExcelJS (more reliable than xlsx)
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(tempFilePath);
    
    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      fs.unlinkSync(tempFilePath);
      throw new ValidationError("File Excel tidak memiliki worksheet");
    }

    // Convert to 2D array
    const rawData: any[][] = [];
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      const rowValues: any[] = [];
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        // Ensure array is large enough
        while (rowValues.length < colNumber) {
          rowValues.push("");
        }
        rowValues[colNumber - 1] = cell.value;
      });
      rawData.push(rowValues);
    });

    // Clean up temp file
    fs.unlinkSync(tempFilePath);

    console.log(`[Reconciliation] Excel loaded with ExcelJS, total rows: ${rawData.length}`);

    if (rawData.length === 0) {
      throw new ValidationError("File Excel kosong");
    }

    // 3. Find columns
    const nikResult = this.findNikColumn(rawData);
    if (!nikResult) {
      console.log("[Reconciliation] Could not find NIK column. First 5 rows:");
      for (let i = 0; i < Math.min(5, rawData.length); i++) {
        console.log(`  Row ${i}:`, rawData[i]?.slice(0, 5));
      }
      throw new ValidationError(
        "Kolom NIK/Passport No. tidak ditemukan dalam file"
      );
    }
    const { nikColIdx, headerRowIdx } = nikResult;

    const platTradeColIdx = this.findPlatTradeColumn(rawData, headerRowIdx);
    const ticketingTimeColIdx = this.findTicketingTimeColumn(
      rawData,
      headerRowIdx
    );

    if (ticketingTimeColIdx === null) {
      throw new ValidationError(
        "Kolom Ticketing Time tidak ditemukan dalam file"
      );
    }

    console.log(`[Reconciliation] Columns found - NIK: ${nikColIdx}, PlatTrade: ${platTradeColIdx}, TicketingTime: ${ticketingTimeColIdx}`);

    // 4. Filter FWC data and extract required columns
    const fwcRecords: {
      serialNumber: string | null;
      nikClean: string;
      ticketingDate: Date;
    }[] = [];

    // Debug: log first few rows
    console.log(`[Reconciliation] Header row: ${headerRowIdx}, Total data rows: ${rawData.length - headerRowIdx - 1}`);
    console.log(`[Reconciliation] Sample rows:`);
    for (let i = headerRowIdx + 1; i < Math.min(headerRowIdx + 6, rawData.length); i++) {
      const row = rawData[i];
      if (row) {
        console.log(`  Row ${i}: NIK="${row[nikColIdx]}", TicketTime="${row[ticketingTimeColIdx]}"`);
      }
    }

    for (let i = headerRowIdx + 1; i < rawData.length; i++) {
      const row = rawData[i];
      if (!row) continue;

      const nikValue = String(row[nikColIdx] || "").trim();
      const serialNumber = platTradeColIdx !== null ? String(row[platTradeColIdx] || "").trim() : "";

      // Filter: only FWC data 
      // - PlatTrade contains "FWC" OR
      // - PlatTrade matches card serial pattern (11 digits starting with 0)
      const isFwcRecord = 
        serialNumber.toUpperCase().includes("FWC") ||
        /^0\d{10}$/.test(serialNumber);

      if (!isFwcRecord) {
        continue;
      }

      const nikClean = this.cleanNik(nikValue);
      const ticketingDate = this.parseTicketingDate(row[ticketingTimeColIdx]);

      if (!ticketingDate) {
        continue; // Skip invalid date
      }

      // Clean serial number: remove "FWC-" prefix if exists
      const cleanSerial = serialNumber.replace(/^FWC-?/i, "").trim();

      fwcRecords.push({
        serialNumber: cleanSerial || null,
        nikClean,
        ticketingDate,
      });
    }

    console.log(`[Reconciliation] Found ${fwcRecords.length} FWC records`);

    if (fwcRecords.length === 0) {
      console.log(`[Reconciliation] No FWC records found. Sample PlatTrade values:`);
      for (let i = headerRowIdx + 1; i < Math.min(headerRowIdx + 11, rawData.length); i++) {
        const row = rawData[i];
        if (row && platTradeColIdx !== null) {
          console.log(`  Row ${i}: PlatTrade="${row[platTradeColIdx]}"`);
        }
      }
      throw new ValidationError(
        "Tidak ada data FWC ditemukan dalam file (PlatTrade dengan prefix FWC atau serial 11 digit)"
      );
    }

    // 5. Create batch record
    const batch = await db.reconciliationBatch.create({
      data: {
        fileName: file.name,
        totalRows: fwcRecords.length,
        status: "PENDING",
        createdBy: userId,
      },
    });

    // 5. Generate CSV file
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const csvFileName = `fwc_${batch.id}_${timestamp}.csv`;
    const csvPath = path.join(this.getStorageDir(), csvFileName);

    // 6. Batch insert using Prisma createMany (in chunks for large datasets)
    const insertData = fwcRecords.map((record) => ({
      batchId: batch.id,
      serialNumber: record.serialNumber,
      nikClean: record.nikClean,
      ticketingDate: record.ticketingDate,
      isMatched: false,
    }));

    const chunkSize = 1000;
    for (let i = 0; i < insertData.length; i += chunkSize) {
      const chunk = insertData.slice(i, i + chunkSize);
      await db.tempFwcReconciliation.createMany({ data: chunk });
      console.log(`[Reconciliation] Inserted ${Math.min(i + chunkSize, insertData.length)}/${insertData.length} records`);
    }

    // Save CSV backup
    const csvLines = ["batch_id,serial_number,nik_clean,ticketing_date"];
    for (const record of fwcRecords) {
      csvLines.push([
        batch.id,
        record.serialNumber || "",
        record.nikClean,
        record.ticketingDate.toISOString().split("T")[0],
      ].join(","));
    }
    fs.writeFileSync(csvPath, csvLines.join("\n"), "utf-8");
    console.log(`[Reconciliation] CSV backup saved to: ${csvPath}`);

    // 7. Update batch with CSV path
    await db.reconciliationBatch.update({
      where: { id: batch.id },
      data: { csvPath: csvPath },
    });

    return {
      batchId: batch.id,
      fileName: file.name,
      totalRows: fwcRecords.length,
      csvPath: csvPath,
    };
  }

  /**
   * Trigger matching process for a batch
   */
  static async triggerMatching(
    batchId: string,
    userId: string
  ): Promise<{
    batchId: string;
    totalRows: number;
    matchedRows: number;
    unmatchedRows: number;
    status: string;
  }> {
    // 1. Get batch
    const batch = await db.reconciliationBatch.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      throw new NotFoundError("Batch tidak ditemukan");
    }

    if (batch.status === "MATCHING") {
      throw new ValidationError("Batch sedang dalam proses matching");
    }

    // 2. Update status to MATCHING
    await db.reconciliationBatch.update({
      where: { id: batchId },
      data: { status: "MATCHING" },
    });

    try {
      // 3. Match by Serial Number + NIK + Date
      // All three criteria must match
      const matchQuery = `
        UPDATE temp_fwc_reconciliation t
        SET 
          is_matched = TRUE,
          matched_card_id = sub.card_id,
          matched_redeem_id = sub.redeem_id
        FROM (
          SELECT 
            c.card_id,
            c.serial_number,
            m.identity_number as nik,
            r.redeem_id,
            r.shift_date::date as redeem_date
          FROM cards c
          JOIN members m ON m.member_id = c.member_id
          JOIN card_redeem r ON r.card_id = c.card_id
        ) sub
        WHERE t.batch_id = '${batchId}'::uuid
          AND t.is_matched = FALSE
          AND t.serial_number IS NOT NULL
          AND t.serial_number != ''
          AND sub.serial_number = t.serial_number
          AND sub.nik = t.nik_clean
          AND sub.redeem_date = t.ticketing_date
      `;

      await db.$executeRawUnsafe(matchQuery);

      // 4. Fallback: Match by NIK + Date only (for records without serial_number)
      const matchByNikDateQuery = `
        UPDATE temp_fwc_reconciliation t
        SET 
          is_matched = TRUE,
          matched_card_id = sub.card_id,
          matched_redeem_id = sub.redeem_id
        FROM (
          SELECT 
            m.identity_number,
            c.card_id,
            r.redeem_id,
            r.shift_date::date as redeem_date
          FROM members m
          JOIN cards c ON c.member_id = m.member_id
          JOIN card_redeem r ON r.card_id = c.card_id
        ) sub
        WHERE t.batch_id = '${batchId}'::uuid
          AND t.is_matched = FALSE
          AND (t.serial_number IS NULL OR t.serial_number = '')
          AND sub.identity_number = t.nik_clean
          AND sub.redeem_date = t.ticketing_date
      `;

      await db.$executeRawUnsafe(matchByNikDateQuery);

      // 5. Count results
      const matchedCount = await db.tempFwcReconciliation.count({
        where: { batchId, isMatched: true },
      });

      const unmatchedCount = await db.tempFwcReconciliation.count({
        where: { batchId, isMatched: false },
      });

      // 6. Update batch with results
      await db.reconciliationBatch.update({
        where: { id: batchId },
        data: {
          status: "COMPLETED",
          matchedRows: matchedCount,
          unmatchedRows: unmatchedCount,
          matchedAt: new Date(),
          matchedBy: userId,
        },
      });

      return {
        batchId,
        totalRows: batch.totalRows,
        matchedRows: matchedCount,
        unmatchedRows: unmatchedCount,
        status: "COMPLETED",
      };
    } catch (error) {
      // Update status to FAILED
      await db.reconciliationBatch.update({
        where: { id: batchId },
        data: { status: "FAILED" },
      });
      throw error;
    }
  }

  /**
   * Get list of batches
   */
  static async getBatches(params: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<{
    batches: any[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.status) {
      where.status = params.status;
    }

    const [batches, total] = await Promise.all([
      db.reconciliationBatch.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.reconciliationBatch.count({ where }),
    ]);

    return {
      batches: batches.map((b) => ({
        id: b.id,
        fileName: b.fileName,
        totalRows: b.totalRows,
        matchedRows: b.matchedRows,
        unmatchedRows: b.unmatchedRows,
        status: b.status,
        createdAt: b.createdAt.toISOString(),
        matchedAt: b.matchedAt?.toISOString() || null,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get batch detail with records
   */
  static async getBatchRecords(
    batchId: string,
    params: {
      page?: number;
      limit?: number;
      isMatched?: boolean;
    }
  ): Promise<{
    batch: any;
    records: any[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const batch = await db.reconciliationBatch.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      throw new NotFoundError("Batch tidak ditemukan");
    }

    const page = params.page || 1;
    const limit = params.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = { batchId };
    if (params.isMatched !== undefined) {
      where.isMatched = params.isMatched;
    }

    const [records, total] = await Promise.all([
      db.tempFwcReconciliation.findMany({
        where,
        orderBy: { createdAt: "asc" },
        skip,
        take: limit,
      }),
      db.tempFwcReconciliation.count({ where }),
    ]);

    // Fetch FWC data for matched records
    const matchedCardIds = records
      .filter((r) => r.matchedCardId)
      .map((r) => r.matchedCardId!);
    
    const matchedRedeemIds = records
      .filter((r) => r.matchedRedeemId)
      .map((r) => r.matchedRedeemId!);

    // Get cards with member info
    const cards = matchedCardIds.length > 0 
      ? await db.card.findMany({
          where: { id: { in: matchedCardIds } },
          include: {
            member: {
              select: {
                id: true,
                name: true,
                identityNumber: true,
              },
            },
          },
        })
      : [];

    // Get redeems with station info
    const redeems = matchedRedeemIds.length > 0
      ? await db.redeem.findMany({
          where: { id: { in: matchedRedeemIds } },
          include: {
            station: {
              select: {
                id: true,
                stationName: true,
              },
            },
          },
        })
      : [];

    // Create lookup maps
    const cardMap = new Map(cards.map((c) => [c.id, c]));
    const redeemMap = new Map(redeems.map((r) => [r.id, r]));

    // For unmatched records, fetch partial match info
    const unmatchedRecords = records.filter((r) => !r.isMatched);
    const serialNumbers = unmatchedRecords
      .filter((r) => r.serialNumber)
      .map((r) => r.serialNumber!);
    const niks = unmatchedRecords.map((r) => r.nikClean);

    // Find cards by serial number (for partial match)
    const cardsBySerial = serialNumbers.length > 0
      ? await db.card.findMany({
          where: { serialNumber: { in: serialNumbers } },
          include: {
            member: {
              select: {
                id: true,
                name: true,
                identityNumber: true,
              },
            },
            redeems: {
              select: {
                id: true,
                shiftDate: true,
                station: {
                  select: {
                    stationName: true,
                  },
                },
              },
              orderBy: { shiftDate: "desc" },
              take: 1,
            },
          },
        })
      : [];

    // Find members by NIK (for partial match)
    const membersByNik = niks.length > 0
      ? await db.member.findMany({
          where: { identityNumber: { in: niks } },
          include: {
            cards: {
              select: {
                id: true,
                serialNumber: true,
                redeems: {
                  select: {
                    id: true,
                    shiftDate: true,
                    station: {
                      select: {
                        stationName: true,
                      },
                    },
                  },
                  orderBy: { shiftDate: "desc" },
                  take: 1,
                },
              },
            },
          },
        })
      : [];

    // Create lookup maps for partial matches
    const cardBySerialMap = new Map(cardsBySerial.map((c) => [c.serialNumber, c]));
    const memberByNikMap = new Map(membersByNik.map((m) => [m.identityNumber, m]));

    // Find FWC-only records (records in FWC database but not in Whoosh Excel)
    // Only query if status is COMPLETED and we want to show all records
    const fwcOnlyRecords: any[] = [];
    if (batch.status === "COMPLETED" && params.isMatched === undefined) {
      // Get date range from uploaded records
      const dateRange = await db.tempFwcReconciliation.aggregate({
        where: { batchId },
        _min: { ticketingDate: true },
        _max: { ticketingDate: true },
      });

      if (dateRange._min.ticketingDate && dateRange._max.ticketingDate) {
        const minDate = dateRange._min.ticketingDate;
        const maxDate = dateRange._max.ticketingDate;

        // Get matched card IDs
        const matchedCardIds = records
          .filter((r) => r.isMatched && r.matchedCardId)
          .map((r) => r.matchedCardId!);

        // Find redeems in date range that weren't matched
        const unmatchedRedeems = await db.redeem.findMany({
          where: {
            shiftDate: {
              gte: minDate,
              lte: maxDate,
            },
            cardId: {
              notIn: matchedCardIds.length > 0 ? matchedCardIds : ['no-match'],
            },
          },
          include: {
            card: {
              include: {
                member: {
                  select: {
                    id: true,
                    name: true,
                    identityNumber: true,
                  },
                },
              },
            },
            station: {
              select: {
                id: true,
                stationName: true,
              },
            },
          },
          orderBy: { shiftDate: "asc" },
          take: 100, // Limit to prevent too many records
        });

        fwcOnlyRecords.push(
          ...unmatchedRedeems.map((r) => ({
            fwc: {
              cardId: r.card.id,
              serialNumber: r.card.serialNumber,
              memberName: r.card.member?.name || null,
              memberNik: r.card.member?.identityNumber || null,
              redeemId: r.id,
              redeemDate: r.shiftDate.toISOString().split("T")[0],
              redeemStation: r.station?.stationName || null,
              redeemType: r.redeem_type || null,
            },
          }))
        );
      }
    }

    return {
      batch: {
        id: batch.id,
        fileName: batch.fileName,
        totalRows: batch.totalRows,
        matchedRows: batch.matchedRows,
        unmatchedRows: batch.unmatchedRows,
        status: batch.status,
        createdAt: batch.createdAt.toISOString(),
        matchedAt: batch.matchedAt?.toISOString() || null,
      },
      records: records.map((r) => {
        const card = r.matchedCardId ? cardMap.get(r.matchedCardId) : null;
        const redeem = r.matchedRedeemId ? redeemMap.get(r.matchedRedeemId) : null;

        // Build match status for unmatched records
        let matchDetails: {
          serialMatch: boolean;
          nikMatch: boolean;
          dateMatch: boolean;
          partialFwc: {
            serialNumber: string | null;
            memberName: string | null;
            memberNik: string | null;
            redeemDate: string | null;
            redeemStation: string | null;
          } | null;
          reason: string;
        } | null = null;

        if (!r.isMatched) {
          const cardBySerial = r.serialNumber ? cardBySerialMap.get(r.serialNumber) : null;
          const memberByNik = memberByNikMap.get(r.nikClean);

          let serialMatch = false;
          let nikMatch = false;
          let dateMatch = false;
          let partialFwc = null;
          let reasons: string[] = [];

          if (cardBySerial) {
            serialMatch = true;
            const cardNik = cardBySerial.member?.identityNumber;
            const cardRedeem = cardBySerial.redeems?.[0];
            const redeemDateStr = cardRedeem?.shiftDate?.toISOString().split("T")[0];

            nikMatch = cardNik === r.nikClean;
            dateMatch = redeemDateStr === r.ticketingDate.toISOString().split("T")[0];

            partialFwc = {
              serialNumber: cardBySerial.serialNumber,
              memberName: cardBySerial.member?.name || null,
              memberNik: cardNik || null,
              redeemDate: redeemDateStr || null,
              redeemStation: cardRedeem?.station?.stationName || null,
            };

            if (!nikMatch) reasons.push("NIK tidak cocok");
            if (!dateMatch) reasons.push("Tanggal tidak cocok");
            if (!cardRedeem) reasons.push("Tidak ada redeem");
          } else if (memberByNik) {
            nikMatch = true;
            const memberCard = memberByNik.cards?.[0];
            const memberRedeem = memberCard?.redeems?.[0];
            const redeemDateStr = memberRedeem?.shiftDate?.toISOString().split("T")[0];

            serialMatch = r.serialNumber ? memberCard?.serialNumber === r.serialNumber : false;
            dateMatch = redeemDateStr === r.ticketingDate.toISOString().split("T")[0];

            partialFwc = {
              serialNumber: memberCard?.serialNumber || null,
              memberName: memberByNik.name,
              memberNik: memberByNik.identityNumber,
              redeemDate: redeemDateStr || null,
              redeemStation: memberRedeem?.station?.stationName || null,
            };

            if (!serialMatch && r.serialNumber) reasons.push("Serial tidak cocok");
            if (!dateMatch) reasons.push("Tanggal tidak cocok");
            if (!memberRedeem) reasons.push("Tidak ada redeem");
          } else {
            reasons.push("NIK tidak ditemukan di database");
            if (r.serialNumber) reasons.push("Serial tidak ditemukan di database");
          }

          matchDetails = {
            serialMatch,
            nikMatch,
            dateMatch,
            partialFwc,
            reason: reasons.join(", ") || "Data tidak ditemukan",
          };
        }

        return {
          id: r.id,
          // Whoosh data (from Excel)
          whoosh: {
            serialNumber: r.serialNumber,
            nik: r.nikClean,
            ticketingDate: r.ticketingDate.toISOString().split("T")[0],
          },
          // FWC data (from database) - for matched records
          fwc: card ? {
            cardId: card.id,
            serialNumber: card.serialNumber,
            memberName: card.member?.name || null,
            memberNik: card.member?.identityNumber || null,
            redeemId: redeem?.id || null,
            redeemDate: redeem?.shiftDate?.toISOString().split("T")[0] || null,
            redeemStation: redeem?.station?.stationName || null,
            redeemType: redeem?.redeem_type || null,
          } : null,
          // Match details - for unmatched records
          matchDetails,
          isMatched: r.isMatched,
          matchedCardId: r.matchedCardId,
          matchedRedeemId: r.matchedRedeemId,
        };
      }),
      fwcOnlyRecords,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Delete a batch and its records
   */
  static async deleteBatch(batchId: string): Promise<void> {
    const batch = await db.reconciliationBatch.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      throw new NotFoundError("Batch tidak ditemukan");
    }

    // Delete CSV file if exists
    if (batch.csvPath && fs.existsSync(batch.csvPath)) {
      fs.unlinkSync(batch.csvPath);
    }

    // Delete batch (cascade will delete records)
    await db.reconciliationBatch.delete({
      where: { id: batchId },
    });
  }
}
