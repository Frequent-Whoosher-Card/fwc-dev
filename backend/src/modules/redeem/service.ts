import db from "../../config/db";
import { CardStatus } from "@prisma/client";
import { NotFoundError, ValidationError } from "../../utils/errors";

export class RedeemService {
  /**
   * Check card details by serial number
   * @param serialNumber Serial number of the card
   */
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

    if (!card) {
      throw new NotFoundError("Card not found");
    }

    // Product type validation (moved here)
    if (product && card.programType !== product) {
      throw new ValidationError(`Kartu ini bukan produk yang sesuai (${product}). Produk kartu: ${card.programType}`);
    }

    // Determine status text
    let statusActive = "Tidak Aktif";
    if (card.status === CardStatus.SOLD_ACTIVE) {
      statusActive = "ACTIVE";
    } else if (card.status === CardStatus.SOLD_INACTIVE) {
      statusActive = "EXPIRED";
    } else {
      statusActive = card.status;
    }

    // Customer Name & NIK
    let customerName = "-";
    let nik = "-";
    if (card.member) {
      customerName = card.member.name;
      nik = card.member.identityNumber;
    } else if (card.user) {
      // Fallback or optional: if internal card assigned to user
      // customerName = card.user.fullName;
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
        if (parts.length >= 2) {
          return {
            origin: parts[0],
            destination: parts[1],
          };
        }
        return {
          origin: desc,
          destination: "-",
        };
      })(),
      cardProduct: {
        totalQuota: card.cardProduct.totalQuota,
      },
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

    return await db.$transaction(
      async (tx) => {
        const card = await tx.card.findUnique({
          where: { serialNumber },
          include: { cardProduct: true, fileObject: true },
        });

        if (!card) {
          throw new NotFoundError("Card not found");
        }

        // Product type validation
        if (card.programType !== product) {
          throw new ValidationError(`Card product type mismatch. Expected: ${product}, Found: ${card.programType}`);
        }

        // Check if card is active
        if (card.status !== CardStatus.SOLD_ACTIVE) {
          throw new ValidationError("Card is not active");
        }

        // Check Expired Date
        if (card.expiredDate && new Date() > card.expiredDate) {
          throw new ValidationError("Card is expired");
        }

        // Determine quota used from redeem type
        const quotaUsed = redeemType === "ROUNDTRIP" ? 2 : 1;

        // Check Quota
        if (card.quotaTicket < quotaUsed) {
          throw new ValidationError("Not enough quota");
        }

        const prevQuota = card.quotaTicket;

        // Calculate transaction number with new format
        const date = new Date();
        const yy = date.getFullYear().toString().slice(-2);
        const mm = (date.getMonth() + 1).toString().padStart(2, '0');
        const dd = date.getDate().toString().padStart(2, '0');
        const dateStr = `${yy}${mm}${dd}`;
        const count = await tx.redeem.count({
          where: {
            createdAt: {
              gte: new Date(date.setHours(0, 0, 0, 0)),
              lt: new Date(date.setHours(23, 59, 59, 999)),
            },
            programType: product,
          },
        });
        let productCode = product === 'FWC' ? 'FW' : (product === 'VOUCHER' ? 'VC' : 'XX');
        const transactionNumber = `RDM-${productCode}-${dateStr}-${(count + 1).toString().padStart(4, '0')}`;

        // Create Redeem Record
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

        // Update Card Quota
        const updatedCard = await tx.card.update({
          where: { id: card.id },
          data: {
            quotaTicket: { decrement: quotaUsed },
            updatedAt: new Date(),
          },
        });

        // Create Usage Log - Link to Redeem transaction
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
      },
      {
        timeout: 10000,
      }
    );
  }

  // Get All Redeems (List)
  static async getRedeems(params: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    stationId?: string;
    search?: string;
    category?: string;
    cardType?: string;
    product?: 'FWC' | 'VOUCHER';
  }) {
    const {
      page = 1,
      limit = 10,
      startDate,
      endDate,
      stationId,
      search,
      category,
      cardType,
      product,
    } = params;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null, // Only show non-deleted redeems
    };

    // Product Filter
    if (product) {
      if (!where.card) where.card = {};
      where.card.programType = product;
    }

    // Date Range Filter
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        // Set end date to end of day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    // Station Filter
    if (stationId) {
      where.stationId = stationId;
    }

    // RedeemType Filter
    // RedeemType filter removed

    // Category Filter
    if (category) {
      if (!where.card) {
        where.card = {};
      }
      if (!where.card.cardProduct) {
        where.card.cardProduct = {};
      }
      where.card.cardProduct.category = {
        categoryName: {
          equals: category,
          mode: "insensitive",
        },
      };
    }

    // CardType Filter
    if (cardType) {
      if (!where.card) {
        where.card = {};
      }
      if (!where.card.cardProduct) {
        where.card.cardProduct = {};
      }
      where.card.cardProduct.type = {
        typeName: {
          equals: cardType,
          mode: "insensitive",
        },
      };
    }

    // Search Filter
    if (search) {
      where.OR = [
        { transactionNumber: { contains: search, mode: "insensitive" } },
        {
          card: {
            serialNumber: { contains: search, mode: "insensitive" },
          },
        },
        {
          card: {
            member: {
              identityNumber: { contains: search, mode: "insensitive" },
            },
          },
        },
        {
          card: {
            member: {
              name: { contains: search, mode: "insensitive" },
            },
          },
        },
      ];
    }

    const [items, total] = await Promise.all([
      db.redeem.findMany({
        where,
        take: limit,
        skip,
        orderBy: { createdAt: "desc" },
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
        },
      }),
      db.redeem.count({ where }),
    ]);

    const formattedItems = items.map((item) => {
      const fallbackMember = item.card.member || item.card.purchases?.[0]?.member || null;
      return {
        id: item.id,
        transactionNumber: item.transactionNumber, // <-- tambahkan field ini
        cardId: item.cardId,
        operatorId: item.operatorId,
        stationId: item.stationId,
        shiftDate: item.shiftDate.toISOString(),
        status: item.status,
        redeemType: item.redeem_type,
        quotaUsed: item.redeem_type === "SINGLE" ? 1 : 2,
        notes: item.notes,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
        station: item.station,
        operator: item.operator,
        card: {
          id: item.card.id,
          serialNumber: item.card.serialNumber,
          quotaTicket: item.card.quotaTicket,
          programType: item.card.programType,
          member: fallbackMember,
          cardProduct: item.card.cardProduct,
        },
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
        member: fallbackMember,
        cardProduct: redeem.card.cardProduct,
      },
    };
  }

  // Update Redeem (e.g., Notes)
  static async updateRedeem(id: string, data: { notes?: string }) {
    // Get full redeem data (with all fields needed by API)
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
            member: { select: { id: true, name: true, identityNumber: true } },
            cardProduct: {
              select: {
                category: { select: { categoryName: true } },
                type: { select: { typeName: true } },
              },
            },
            purchases: {
              orderBy: { purchaseDate: "desc" },
              take: 1,
              select: {
                member: { select: { id: true, name: true, identityNumber: true } },
              },
            },
          },
        },
      },
    });

    if (!redeem) {
      throw new NotFoundError("Redeem transaction not found");
    }

    // Update notes
    await db.redeem.update({ where: { id }, data: { notes: data.notes } });

    // Fallback quotaUsed: SINGLE=1, ROUNDTRIP=2
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
        member: fallbackMember,
        cardProduct: redeem.card.cardProduct,
      },
    };
  }

  // Delete Redeem (soft delete) and restore quota
  static async deleteRedeem(id: string, userId?: string) {
    return await db.$transaction(async (tx) => {
      const redeem = await tx.redeem.findUnique({ where: { id }, include: { card: true } });
      if (!redeem) throw new NotFoundError("Redeem transaction not found");
      if (redeem.deletedAt) throw new ValidationError("Redeem already deleted");

      // Optional: enforce product type validation if product param is provided (future-proof)
      // Example: if (product && redeem.card.programType !== product) { throw new ValidationError(...) }

      // Cari log usage terkait redeem ini
      const usageLog = await tx.cardUsageLog.findFirst({ where: { redeemId: id, deletedAt: null } });
      if (!usageLog) throw new NotFoundError("Usage log for redeem not found");
      const quotaToRestore = usageLog.quotaUsed;

      // Restore quota ke kartu
      await tx.card.update({
        where: { id: redeem.cardId },
        data: {
          quotaTicket: { increment: quotaToRestore },
          updatedAt: new Date(),
        },
      });

      // Update usage log: soft delete dan quotaUsed=0
      await tx.cardUsageLog.update({
        where: { id: usageLog.id },
        data: {
          deletedAt: new Date(),
          deletedBy: userId || null,
          quotaUsed: 0,
        },
      });

      // Mark redeem as deleted
      const deleted = await tx.redeem.update({
        where: { id },
        data: { deletedAt: new Date(), deletedBy: userId || null, updatedAt: new Date(), updatedBy: userId || null },
      });

      return { id: deleted.id, restoredQuota: quotaToRestore };
    });
  }

  // Export daily report for a given date and operator's station
  static async exportDailyReport(params: { date?: string; userId: string; stationId: string; format: "csv" | "xlsx" | "pdf" | "jpg" }) {
    const { date, stationId, format, userId } = params;
    const target = date ? new Date(date) : new Date();
    const start = new Date(target);
    start.setHours(0, 0, 0, 0);
    const end = new Date(target);
    end.setHours(23, 59, 59, 999);

    const operator = await db.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    const items = await db.redeem.findMany({
      where: {
        stationId,
        createdAt: { gte: start, lte: end },
        deletedAt: null,
      },
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

    // Build rows: trxnumber, serialnum, cardcategory, cardtype, redeem type, kuota dipakai, sisa kuota, stasiun penukaran, nominal
    // Ambil usage log untuk setiap redeem
    const usageLogs = await db.cardUsageLog.findMany({
      where: {
        redeemId: { in: items.map((it) => it.id) },
        deletedAt: null,
      },
    });
    const usageLogMap = new Map(usageLogs.map(log => [log.redeemId, log]));
    const rows = items.map((it) => {
      const product = it.card.cardProduct;
      const usageLog = usageLogMap.get(it.id);
      const quotaUsed = usageLog?.quotaUsed ?? (it.redeem_type === 'SINGLE' ? 1 : 2);
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

    const filenameBase = `redeem_${start.toISOString().slice(0,10)}_${stationId}`;

    const nomorReport = `REDEEM-${start.toISOString().slice(0,10).replace(/-/g, "")}-${stationId.substring(0,6)}`;
    const petugasName = operator?.fullName || "-";
    const shiftKerja = ""; // not used for now
    const tanggalDinas = start.toISOString().slice(0,10);

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
      const headerRow = ["Nomor Transaksi","Seri Kartu","Kategori","Tipe Kartu","Tipe Redeem","Kuota Dipakai","Sisa Kuota","Stasiun","Nominal"];
      const dataRows = rows.map(r => [r.trxnumber,r.serialnum,r.cardcategory,r.cardtype,r.redeem_type,r.quota_used,r.remaining_quota,r.station,r.nominal]);
      const csv = metaRows.map(r=>r.join(",")).concat([headerRow.join(",")]).concat(dataRows.map(r=>r.join(","))).join("\n");
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
      ["Nomor Transaksi","Seri Kartu","Kategori","Tipe Kartu","Tipe Redeem","Kuota Dipakai","Sisa Kuota","Stasiun","Nominal"],
      ...rows.map(r => [r.trxnumber,r.serialnum,r.cardcategory,r.cardtype,r.redeem_type,r.quota_used,r.remaining_quota,r.station,r.nominal]),
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
    ctx.fillText("Laporan", width/2, 40);
    ctx.fillText("Penjualan Frequent Whoosher Card", width/2, 72);
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
    ctx.fillText(`Total Keseluruhan Terjual: ${totalTerjual}`, 40, y); y+=24;
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
    const redeem = await db.redeem.findUnique({
      where: { id },
      include: {
        card: true,
      },
    });
    if (!redeem) throw new NotFoundError("Redeem transaction not found");
    // Only allow upload if card quotaTicket is 0 (last redeem)
    if (redeem.card.quotaTicket !== 0) {
      throw new ValidationError("Upload allowed only when card quota is 0 (last redeem)");
    }

    const type = mimeType && (mimeType === "image/jpeg" || mimeType === "image/png") ? mimeType : "image/jpeg";
    const ext = type === "image/png" ? "png" : "jpg";
    const buf = Buffer.from(imageBase64, "base64");
    const checksumSha256 = (await import("crypto")).createHash("sha256").update(buf).digest("hex");

    const dir = `assets/uploads/redeem`;
    const storedName = `${id}.${ext}`;
    const relativePath = `${dir}/${storedName}`;
    const fs = (await import("fs")).promises;
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(relativePath, buf);

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

    const updated = await db.redeem.update({
      where: { id },
      data: { fileObjectId: file.id, updatedAt: new Date(), updatedBy: userId },
    });
    return { id: updated.id, fileObjectId: file.id, path: relativePath };
  }
}
