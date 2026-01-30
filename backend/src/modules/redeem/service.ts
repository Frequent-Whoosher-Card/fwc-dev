
import db from "../../config/db";
import { CardStatus } from "@prisma/client";
import { NotFoundError, ValidationError } from "../../utils/errors";

export class RedeemService {
  static async checkSerial(serialNumber: string, product?: string) {
    const card = await db.card.findUnique({
      where: { serialNumber },
      include: {
        member: true,
        user: true,
        cardProduct: {
          include: {
            category: true,
            type: true,
          },
        },
      },
    });
    if (!card) throw new NotFoundError("Card not found");
    if (product && card.programType !== product) {
      throw new ValidationError(
        `Kartu ini bukan produk yang sesuai (${product}). Produk kartu: ${card.programType}`,
      );
    }
    let statusActive = "Tidak Aktif";
    if (card.status === CardStatus.SOLD_ACTIVE) statusActive = "ACTIVE";
    else if (card.status === CardStatus.SOLD_INACTIVE) statusActive = "EXPIRED";
    else statusActive = card.status;
    let customerName = "-", nik = "-";
    if (card.member) {
      customerName = card.member.name;
      nik = card.member.identityNumber;
    }
    return {
      nik,
      customerName,
      cardCategory: card.cardProduct.category.categoryName,
      cardType: card.cardProduct.type.typeName,
      serialNumber: card.serialNumber,
      quotaRemaining: card.quotaTicket,
      statusActive,
      purchaseDate: card.purchaseDate ? card.purchaseDate.toISOString() : null,
      expiredDate: card.expiredDate ? card.expiredDate.toISOString() : null,
      route: (() => {
        const desc = card.cardProduct.type.routeDescription;
        if (!desc) return null;
        const parts = desc.split("-").map((s) => s.trim());
        if (parts.length >= 2) return { origin: parts[0], destination: parts[1] };
        return { origin: desc, destination: "-" };
      })(),
      cardProduct: { totalQuota: card.cardProduct.totalQuota },
    };
  }

  static async redeemCard(
    serialNumber: string,
    redeemType: "SINGLE" | "ROUNDTRIP",
    operatorId: string,
    stationId: string,
    product: "FWC" | "VOUCHER",
    notes?: string
  ): Promise<{ transactionNumber: string; remainingQuota: number; quotaUsed: number; redeemType: string }> {
    return await db.$transaction(async (tx) => {
      const card = await tx.card.findUnique({ where: { serialNumber }, include: { cardProduct: true, fileObject: true } });
      if (!card) throw new NotFoundError("Card not found");
      if (card.programType !== product) throw new ValidationError(`Card product type mismatch. Expected: ${product}, Found: ${card.programType}`);
      if (card.status !== CardStatus.SOLD_ACTIVE) throw new ValidationError("Card is not active");
      if (card.expiredDate && new Date() > card.expiredDate) throw new ValidationError("Card is expired");
      const quotaUsed = redeemType === "ROUNDTRIP" ? 2 : 1;
      if (card.quotaTicket < quotaUsed) throw new ValidationError("Not enough quota");
      const date = new Date();
      const yy = date.getFullYear().toString().slice(-2);
      const mm = (date.getMonth() + 1).toString().padStart(2, '0');
      const dd = date.getDate().toString().padStart(2, '0');
      const dateStr = `${yy}${mm}${dd}`;
      const count = await tx.redeem.count({
        where: {
          createdAt: { gte: new Date(date.setHours(0, 0, 0, 0)), lt: new Date(date.setHours(23, 59, 59, 999)) },
          programType: product,
        },
      });
      let productCode = product === 'FWC' ? 'FW' : (product === 'VOUCHER' ? 'VC' : 'XX');
      const transactionNumber = `RDM-${productCode}-${dateStr}-${(count + 1).toString().padStart(4, '0')}`;
      const redeem = await tx.redeem.create({
        data: {
          cardId: card.id,
          operatorId,
          stationId,
          transactionNumber,
          shiftDate: new Date(),
          status: "Success",
          redeem_type: redeemType as any,
          fileObjectId: card.fileObjectId,
          notes: notes || null,
          programType: product,
        } as any,
      });
      const updatedCard = await tx.card.update({
        where: { id: card.id },
        data: { quotaTicket: { decrement: quotaUsed }, updatedAt: new Date() },
      });
      await tx.cardUsageLog.create({
        data: {
          cardId: card.id,
          redeemId: redeem.id,
          quotaUsed: quotaUsed,
          remainingQuota: updatedCard.quotaTicket,
          usageDate: new Date(),
        },
      });
      return {
        transactionNumber,
        remainingQuota: updatedCard.quotaTicket,
        quotaUsed,
        redeemType,
      };
    }, { timeout: 10000 });
  }

  static async getRedeems(params: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    stationId?: string;
    search?: string;
    category?: string;
    cardType?: string;
    redeemType?: string;
    product?: "FWC" | "VOUCHER";
    isDeleted?: boolean;
  }) {

    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    const {
      startDate,
      endDate,
      stationId,
      search,
      category,
      cardType,
      redeemType,
      product,
      isDeleted,
    } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (isDeleted) {
      // Logic for Deleted Items: Filter by deletedAt
      if (startDate || endDate) {
        where.deletedAt = {};
        if (startDate) where.deletedAt.gte = new Date(startDate);
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          where.deletedAt.lte = end;
        }
      } else {
        where.deletedAt = { not: null };
      }
    } else {
      // Logic for Active Items: deletedAt is null, filter by createdAt
      where.deletedAt = null;
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          where.createdAt.lte = end;
        }
      }
    }
    if (product) { if (!where.card) where.card = {}; where.card.programType = product; }
    if (stationId) where.stationId = stationId;
    if (category) {
      if (!where.card) where.card = {};
      if (!where.card.cardProduct) where.card.cardProduct = {};
      where.card.cardProduct.category = { categoryName: { equals: category, mode: "insensitive" } };
    }
    if (cardType) {
      if (!where.card) where.card = {};
      if (!where.card.cardProduct) where.card.cardProduct = {};
      where.card.cardProduct.type = { typeName: { equals: cardType, mode: "insensitive" } };
    }
    if (search) {
      where.OR = [
        { transactionNumber: { contains: search, mode: "insensitive" } },
        { card: { serialNumber: { contains: search, mode: "insensitive" } } },
        { card: { member: { identityNumber: { contains: search, mode: "insensitive" } } } },
        { card: { member: { name: { contains: search, mode: "insensitive" } } } },
      ];
    }
    const [items, total] = await Promise.all([
      db.redeem.findMany({
        where,
        take: limit,
        skip,
        orderBy: { createdAt: "desc" },
        include: {
          station: { select: { id: true, stationName: true } },
          operator: { select: { id: true, fullName: true } },
          card: {
            select: {
              id: true,
              serialNumber: true,
              quotaTicket: true,
              programType: true,
              member: { select: { id: true, name: true, identityNumber: true } },
              cardProduct: { select: { totalQuota: true, category: { select: { categoryName: true } }, type: { select: { typeName: true } } } },
              purchases: {
                orderBy: { purchaseDate: "desc" },
                take: 1,
                select: { member: { select: { id: true, name: true, identityNumber: true } } },
              },
            },
          },
          fileObject: true,
        },
      }),
      db.redeem.count({ where }),
    ]);
    const usageLogs = await db.cardUsageLog.findMany({ where: { redeemId: { in: items.map((it) => it.id) }, deletedAt: null } });
    const usageLogMap = new Map(usageLogs.map(log => [log.redeemId, log]));

    const formattedItems = items.map((item) => {
      const fallbackMember = item.card.member || item.card.purchases?.[0]?.member || null;
      const usageLog = usageLogMap.get(item.id);
      return {
        id: item.id,
        transactionNumber: item.transactionNumber,
        cardId: item.cardId,
        operatorId: item.operatorId,
        stationId: item.stationId,
        shiftDate: item.shiftDate.toISOString(),
        status: item.status,
        redeemType: item.redeem_type,
        quotaUsed: usageLog?.quotaUsed ?? (item.redeem_type === "SINGLE" ? 1 : 2),
        remainingQuota: usageLog?.remainingQuota ?? 0,
        notes: item.notes,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
        station: item.station,
        operator: item.operator,
        card: {
          id: item.card.id,
          serialNumber: item.card.serialNumber,
          quotaTicket: item.card.quotaTicket,
          programType: item.card.programType as "FWC" | "VOUCHER" | null,
          member: fallbackMember,
          cardProduct: item.card.cardProduct,
        },
        fileObject: item.fileObject ? {
          id: item.fileObject.id,
          path: `${process.env.BASE_URL}:${process.env.APP_PORT}/${item.fileObject.relativePath}`,
          mimeType: item.fileObject.mimeType,
          createdAt: item.fileObject.createdAt.toISOString(),
        } : undefined,
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

  // Get Redeem By ID (Detail)
  static async getRedeemById(id: string) {
    const redeem = await db.redeem.findUnique({
      where: { id },
      include: {
        station: {
          select: {
            id: true,
            stationName: true,
          },
        },
        operator: {
          select: {
            id: true,
            fullName: true,
          },
        },
        card: {
          select: {
            id: true,
            serialNumber: true,
            quotaTicket: true,
            programType: true,
            member: {
              select: {
                id: true,
                name: true,
                identityNumber: true,
              },
            },
            cardProduct: {
              select: {
                totalQuota: true,
                category: { select: { categoryName: true } },
                type: { select: { typeName: true } },
              },
            },
            purchases: {
              orderBy: { purchaseDate: "desc" },
              take: 1,
              select: {
                member: {
                  select: {
                    id: true,
                    name: true,
                    identityNumber: true,
                  },
                },
              },
            },
          },
        },
        fileObject: true,
      },
    });

    if (!redeem) {
      throw new NotFoundError("Redeem transaction not found");
    }

    // Fallback quotaUsed: SINGLE=1, ROUNDTRIP=2 (skip usageLogs to avoid DB column mismatch)
    const quotaUsed = redeem.redeem_type === 'SINGLE' ? 1 : 2;

    const fallbackMember =
      redeem.card.member || redeem.card.purchases?.[0]?.member || null;

    return {
      id: redeem.id,
      transactionNumber: redeem.transactionNumber,
      cardId: redeem.cardId,
      operatorId: redeem.operatorId,
      stationId: redeem.stationId,
      shiftDate: redeem.shiftDate.toISOString(),
      status: redeem.status,
      redeemType: redeem.redeem_type,
      quotaUsed,
      notes: redeem.notes,
      createdAt: redeem.createdAt.toISOString(),
      updatedAt: redeem.updatedAt.toISOString(),
      station: redeem.station,
      operator: redeem.operator,
      card: {
        id: redeem.card.id,
        serialNumber: redeem.card.serialNumber,
        quotaTicket: redeem.card.quotaTicket,
        programType: redeem.card.programType as "FWC" | "VOUCHER" | null,
        member: fallbackMember,
        cardProduct: redeem.card.cardProduct,
      },
      fileObject: redeem.fileObject ? {
        id: redeem.fileObject.id,
        path: `${process.env.BASE_URL}:${process.env.APP_PORT}/${redeem.fileObject.relativePath}`,
        mimeType: redeem.fileObject.mimeType,
        createdAt: redeem.fileObject.createdAt.toISOString(),
      } : undefined,
    };
  }

  // Update Redeem (e.g., Notes)
  static async updateRedeem(id: string, data: { notes?: string }) {
    const redeem = await db.redeem.findUnique({
      where: { id },
      include: {
        station: { select: { id: true, stationName: true } },
        operator: { select: { id: true, fullName: true } },
        card: {
          select: {
            id: true,
            serialNumber: true,
            quotaTicket: true,
            programType: true,
            member: { select: { id: true, name: true, identityNumber: true } },
            cardProduct: { select: { totalQuota: true, category: { select: { categoryName: true } }, type: { select: { typeName: true } } } },
            purchases: {
              orderBy: { purchaseDate: "desc" },
              take: 1,
              select: { member: { select: { id: true, name: true, identityNumber: true } } },
            },
          },
        },
      },
    });
    if (!redeem) throw new NotFoundError("Redeem transaction not found");
    await db.redeem.update({ where: { id }, data: { notes: data.notes } });
    const quotaUsed = redeem.redeem_type === 'SINGLE' ? 1 : 2;
    const fallbackMember = redeem.card.member || redeem.card.purchases?.[0]?.member || null;
    return {
      id: redeem.id,
      transactionNumber: redeem.transactionNumber,
      cardId: redeem.cardId,
      operatorId: redeem.operatorId,
      stationId: redeem.stationId,
      shiftDate: redeem.shiftDate.toISOString(),
      status: redeem.status,
      redeemType: redeem.redeem_type,
      quotaUsed,
      notes: data.notes ?? redeem.notes,
      createdAt: redeem.createdAt.toISOString(),
      updatedAt: new Date().toISOString(),
      station: redeem.station,
      operator: redeem.operator,
      card: {
        id: redeem.card.id,
        serialNumber: redeem.card.serialNumber,
        quotaTicket: redeem.card.quotaTicket,
        programType: redeem.card.programType as "FWC" | "VOUCHER" | null,
        member: fallbackMember,
        cardProduct: redeem.card.cardProduct,
      },
    };
  }

  static async deleteRedeem(id: string, userId: string | undefined, notes?: string) {
    return await db.$transaction(async (tx) => {
      const redeem = await tx.redeem.findUnique({
        where: { id },
        include: { card: true },
      });
      if (!redeem) throw new NotFoundError("Redeem transaction not found");
      if (redeem.deletedAt) throw new ValidationError("Redeem already deleted");
      const usageLog = await tx.cardUsageLog.findFirst({ where: { redeemId: id, deletedAt: null } });
      if (!usageLog) throw new NotFoundError("Usage log for redeem not found");
      const quotaToRestore = usageLog.quotaUsed;
      await tx.card.update({ where: { id: redeem.cardId }, data: { quotaTicket: { increment: quotaToRestore }, updatedAt: new Date() } });
      await tx.cardUsageLog.update({ where: { id: usageLog.id }, data: { deletedAt: new Date(), deletedBy: userId || null, quotaUsed: 0 } });

      const deleted = await tx.redeem.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          deletedBy: userId || null,
          updatedAt: new Date(),
          updatedBy: userId || null,
          notes: notes || redeem.notes // Update notes with deletion reason if provided
        }
      });
      return { id: deleted.id, restoredQuota: quotaToRestore };
    });
  }

  static async exportDailyReport(params: { date?: string; userId: string; stationId: string; format: "csv" | "xlsx" | "pdf" | "jpg" }) {
    const { date, stationId, format, userId } = params;
    const target = date ? new Date(date) : new Date();
    const start = new Date(target); start.setHours(0, 0, 0, 0);
    const end = new Date(target); end.setHours(23, 59, 59, 999);
    const operator = await db.user.findUnique({ where: { id: userId }, include: { role: true } });
    const items = await db.redeem.findMany({
      where: { stationId, createdAt: { gte: start, lte: end }, deletedAt: null },
      orderBy: { createdAt: "asc" },
      include: {
        station: { select: { stationName: true } },
        operator: { select: { fullName: true } },
        card: {
          select: {
            serialNumber: true,
            cardProduct: {
              select: {
                totalQuota: true,
                price: true,
                category: { select: { categoryName: true } },
                type: { select: { typeName: true } },
              },
            },
          },
        },
      },
    });
    const usageLogs = await db.cardUsageLog.findMany({ where: { redeemId: { in: items.map((it) => it.id) }, deletedAt: null } });
    const usageLogMap = new Map(usageLogs.map(log => [log.redeemId, log]));
    const rows = items.map((it) => {
      const product = it.card.cardProduct;
      const usageLog = usageLogMap.get(it.id);
      const quotaUsed =
        usageLog?.quotaUsed ?? (it.redeem_type === "SINGLE" ? 1 : 2);
      const remainingQuota = usageLog?.remainingQuota ?? 0;
      const unit = Number(product.price) / product.totalQuota;
      const nominal = unit * quotaUsed;
      return {
        trxnumber: it.transactionNumber,
        serialnum: it.card.serialNumber,
        cardcategory: product.category.categoryName,
        cardtype: product.type.typeName,
        redeem_type: it.redeem_type,
        quota_used: quotaUsed,
        remaining_quota: remainingQuota,
        station: it.station.stationName,
        nominal: Number(nominal.toFixed(2)),
      };
    });

    const filenameBase = `redeem_${start.toISOString().slice(0, 10)}_${stationId}`;

    const nomorReport = `REDEEM-${start.toISOString().slice(0, 10).replace(/-/g, "")}-${stationId.substring(0, 6)}`;
    const petugasName = operator?.fullName || "-";
    const shiftKerja = ""; // not used for now
    const tanggalDinas = start.toISOString().slice(0, 10);

    if (format === "csv") {
      // Header dan meta sesuai role
      let metaRows: string[][] = [];
      if (operator?.role?.roleCode === 'petugas') {
        metaRows = [
          ["Laporan Transaksi Redeem Frequent Whoosher Card"],
          ["Nama Petugas", petugasName],
          ["Tanggal Dinas", tanggalDinas],
          [],
        ];
      } else {
        metaRows = [
          ["Laporan Transaksi Redeem Frequent Whoosher Card"],
          ["Tanggal Hari Ini", tanggalDinas],
          [],
        ];
      }
      const headerRow = ["Nomor Transaksi", "Seri Kartu", "Kategori", "Tipe Kartu", "Tipe Redeem", "Kuota Dipakai", "Sisa Kuota", "Stasiun", "Nominal"];
      const dataRows = rows.map(r => [r.trxnumber, r.serialnum, r.cardcategory, r.cardtype, r.redeem_type, r.quota_used, r.remaining_quota, r.station, r.nominal]);
      const csv = metaRows.map(r => r.join(",")).concat([headerRow.join(",")]).concat(dataRows.map(r => r.join(","))).join("\n");
      return { buffer: new TextEncoder().encode(csv), contentType: "text/csv", filename: `${filenameBase}.csv` };
    }

    // xlsx
    const XLSX = await import("xlsx");
    const aoa: any[] = [
      ["Nomor Report", nomorReport],
      ["Nama Petugas", petugasName],
      ["Shift Kerja", shiftKerja],
      ["Tanggal Dinas", tanggalDinas],
      [],
      ["Nomor Transaksi", "Seri Kartu", "Kategori", "Tipe Kartu", "Tipe Redeem", "Kuota Dipakai", "Sisa Kuota", "Stasiun", "Nominal"],
      ...rows.map(r => [r.trxnumber, r.serialnum, r.cardcategory, r.cardtype, r.redeem_type, r.quota_used, r.remaining_quota, r.station, r.nominal]),
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(aoa);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Redeem");
    const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
    if (format === "xlsx") {
      return { buffer: wbout as unknown as Buffer, contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", filename: `${filenameBase}.xlsx` };
    }

    // Build grouped summary for PDF/JPG layout
    type Key = string;
    const groups = new Map<Key, { serials: string[]; uniqueCards: Set<string>; nominal: number }>();
    const keyOf = (cat: string, typ: string) => `${cat}|${typ}`;
    for (const it of items) {
      const cat = it.card.cardProduct.category.categoryName;
      const typ = it.card.cardProduct.type.typeName;
      const k = keyOf(cat, typ);
      const product = it.card.cardProduct;
      const unit = Number(product.price) / product.totalQuota;
      const g = groups.get(k) || { serials: [], uniqueCards: new Set<string>(), nominal: 0 };
      g.serials.push(it.card.serialNumber);
      g.uniqueCards.add(it.card.serialNumber);
      g.nominal += unit * (((it as any).quotaUsed) ?? 0);
      groups.set(k, g);
    }

    const order = [
      ["Gold", "JaBan"],
      ["Silver", "JaBan"],
      ["Gold", "JaKa"],
      ["Silver", "JaKa"],
      ["Gold", "KaBan"],
      ["Silver", "KaBan"],
    ];

    const rowsSummary = order.map(([cat, typ]) => {
      const k = keyOf(cat, typ);
      const g = groups.get(k);
      const serials = g?.serials || [];
      const startSerial = serials.length ? serials.slice().sort()[0] : "";
      const sorted = serials.slice().sort();
      const endSerial = sorted.length ? sorted[sorted.length - 1] : "";
      const count = g ? g.uniqueCards.size : 0;
      const nominal = g ? Number(g.nominal.toFixed(2)) : 0;
      return { label: `${cat} ${typ}`, startSerial, endSerial, count, nominal };
    });

    const totalTerjual = rowsSummary.reduce((s, r) => s + r.count, 0);
    const totalNominal = rowsSummary.reduce((s, r) => s + r.nominal, 0);

    if (format === "pdf") {
      const PDFDocument = (await import("pdfkit")).default;
      const doc = new PDFDocument({ size: "A4", margin: 36 });
      const chunks: Buffer[] = [];
      doc.on("data", (d: Buffer) => chunks.push(d));
      const done = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

      // Header
      doc.fontSize(14).text("Laporan", { align: "center" });
      doc.moveDown(0.2);
      doc.fontSize(14).text("Penjualan Frequent Whoosher Card", { align: "center" });
      doc.moveDown();

      // Meta table
      doc.fontSize(10);
      doc.text(`Nama Petugas: ${petugasName}`);
      doc.text(`Shift / Waktu Dinas: `);
      doc.text(`Tanggal Dinas: ${tanggalDinas}`);
      doc.moveDown();

      // Summary rows
      const colX = [36, 200, 360, 460];
      doc.text("Kategori/Tipe", colX[0], doc.y);
      doc.text("No Seri Awal", colX[1], doc.y);
      doc.text("No Seri Akhir", colX[2], doc.y);
      doc.text("Jumlah Terjual / Nominal", colX[3], doc.y);
      doc.moveDown();
      for (const r of rowsSummary) {
        doc.text(r.label, colX[0], doc.y);
        doc.text(r.startSerial || "-", colX[1], doc.y);
        doc.text(r.endSerial || "-", colX[2], doc.y);
        doc.text(`${r.count} / Rp${r.nominal.toLocaleString("id-ID")}`, colX[3], doc.y);
        doc.moveDown(0.3);
      }
      doc.moveDown();
      doc.text(`Total Keseluruhan Terjual: ${totalTerjual}`);
      doc.text(`Nominal Keseluruhan: Rp${totalNominal.toLocaleString("id-ID")}`);
      doc.moveDown(2);
      doc.text("PSAC", 200);
      doc.text("SPV", 360);
      doc.moveDown(4);
      doc.text(`(${petugasName})`, 180);
      doc.text("(Nama Jelas)", 340);

      doc.end();
      const pdfBuf = await done;
      return { buffer: pdfBuf, contentType: "application/pdf", filename: `${filenameBase}.pdf` };
    }

    // JPG using canvas
    const { createCanvas } = await import("canvas");
    const width = 1024, height = 1440;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#000";
    ctx.font = "bold 24px Sans";
    ctx.textAlign = "center";
    ctx.fillText("Laporan", width / 2, 40);
    ctx.fillText("Penjualan Frequent Whoosher Card", width / 2, 72);
    ctx.textAlign = "left";
    ctx.font = "16px Sans";
    ctx.fillText(`Nama Petugas: ${petugasName}`, 40, 120);
    ctx.fillText(`Shift / Waktu Dinas: `, 40, 150);
    ctx.fillText(`Tanggal Dinas: ${tanggalDinas}`, 40, 180);

    let y = 220;
    ctx.font = "bold 14px Sans";
    ctx.fillText("Kategori/Tipe", 40, y);
    ctx.fillText("No Seri Awal", 300, y);
    ctx.fillText("No Seri Akhir", 520, y);
    ctx.fillText("Jumlah / Nominal", 760, y);
    y += 24;
    ctx.font = "14px Sans";
    for (const r of rowsSummary) {
      ctx.fillText(r.label, 40, y);
      ctx.fillText(r.startSerial || "-", 300, y);
      ctx.fillText(r.endSerial || "-", 520, y);
      ctx.fillText(`${r.count} / Rp${r.nominal.toLocaleString("id-ID")}`, 760, y);
      y += 22;
    }
    y += 24;
    ctx.font = "bold 16px Sans";
    ctx.fillText(`Total Keseluruhan Terjual: ${totalTerjual}`, 40, y); y += 24;
    ctx.fillText(`Nominal Keseluruhan: Rp${totalNominal.toLocaleString("id-ID")}`, 40, y);
    y += 80;
    ctx.font = "16px Sans";
    ctx.fillText("PSAC", 300, y);
    ctx.fillText("SPV", 700, y);
    y += 100;
    ctx.fillText(`(${petugasName})`, 260, y);
    ctx.fillText("(Nama Jelas)", 660, y);

    const jpgBuf = canvas.toBuffer("image/jpeg", { quality: 0.92 });
    return { buffer: jpgBuf, contentType: "image/jpeg", filename: `${filenameBase}.jpg` };
  }

  static async uploadLastRedeemDoc(id: string, imageBase64: string, mimeType: string | undefined, userId: string) {
    const redeem = await db.redeem.findUnique({ where: { id }, include: { card: { include: { member: true } } } });
    if (!redeem) throw new NotFoundError("Redeem transaction not found");
    if (redeem.card.quotaTicket !== 0) throw new ValidationError("Upload allowed only when card quota is 0 (last redeem)");

    const memberId = redeem.card.member?.id || "unknown-member";
    const type = mimeType && (mimeType === "image/jpeg" || mimeType === "image/png") ? mimeType : "image/jpeg";
    const ext = type === "image/png" ? "png" : "jpg";

    // Fix: Strip data URI prefix if present to avoid corrupted file
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const buf = Buffer.from(base64Data, "base64");

    const checksumSha256 = (await import("crypto")).createHash("sha256").update(buf).digest("hex");

    // Path: storage/lastredeem/{memberId}/{redeemId}.{ext}
    const dir = `storage/lastredeem/${memberId}`;
    const storedName = `${id}.${ext}`;
    const relativePath = `${dir}/${storedName}`;

    const fs = (await import("fs")).promises;
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(relativePath, buf);

    const existing = await db.fileObject.findUnique({ where: { relativePath } });
    if (existing) await db.fileObject.delete({ where: { id: existing.id } });

    const file = await db.fileObject.create({
      data: {
        originalName: storedName,
        storedName,
        relativePath,
        mimeType: type,
        sizeBytes: buf.length,
        checksumSha256,
        createdBy: userId,
        purpose: "LAST_REDEEM",
      },
    });
    const updated = await db.redeem.update({ where: { id }, data: { fileObjectId: file.id, updatedAt: new Date(), updatedBy: userId } });
    return { id: updated.id, fileObjectId: file.id, path: relativePath };
  }
}
