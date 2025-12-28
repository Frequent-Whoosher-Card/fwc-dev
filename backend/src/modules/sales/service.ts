import db from "../../config/db";
import {
  formatDate,
  formatDateRange,
  createEmptyRow,
  calculateRowTotal,
  addSalesToRow,
  calculateTotalsFromRows,
  getDateKeys,
  formatDateString,
  createEmptyExpiredRow,
  addExpiredToRow,
  calculateExpiredTotalsFromRows,
} from "./helpers";

interface DailySalesQueryParams {
  startDate: string;
  endDate: string;
  stationId?: string;
}

interface SalesData {
  date: Date;
  categoryCode: string;
  typeCode: string;
  count: number;
}

interface DailySalesRow {
  tanggal: string;
  gold: {
    jaBan: number;
    jaKa: number;
    kaBan: number;
  };
  silver: {
    jaBan: number;
    jaKa: number;
    kaBan: number;
  };
  kai: number;
  total: number;
}

interface DailySalesAggregated {
  rows: DailySalesRow[];
  totals: DailySalesRow;
}

interface DailyTotal {
  date: string;
  total: number;
}

// Expired Sales Data Interfaces
interface ExpiredSalesData {
  date: Date;
  categoryCode: string;
  typeCode: string;
  count: number;
  totalPrice: number; // Total price dari semua kartu expired dalam group ini
}

interface ExpiredDailySalesRow {
  tanggal: string;
  gold: {
    jaBan: number;
    jaKa: number;
    kaBan: number;
  };
  silver: {
    jaBan: number;
    jaKa: number;
    kaBan: number;
  };
  kai: number;
  total: number;
  expired: number; // Total count kartu expired
  expiredPrice: number; // Total harga dari kartu expired
}

interface ExpiredDailySalesAggregated {
  rows: ExpiredDailySalesRow[];
  totals: ExpiredDailySalesRow;
}

interface CardsSummaryQueryParams {
  startDate?: string;
  endDate?: string;
  stationId?: string;
}

interface CardsSummaryData {
  activeCardsCount: number;
  activeCardsQuotaIssued: number;
  redeemedTickets: number;
  unredeemedTickets: number;
  redeemedPercentage: number;
  unredeemedPercentage: number;
}

export class SalesService {
  static async getDailySales(params: DailySalesQueryParams) {
    const { startDate, endDate, stationId } = params;

    // Parse dates - use local timezone to avoid timezone conversion issues
    const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
    const start = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0);
    
    const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
    const end = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999);

    const whereClause: any = {
      purchaseDate: {
        gte: start,
        lte: end,
      },
      deletedAt: null,
    };



    // Query cards with category and type information via cardProduct relation
    const cards = await db.card.findMany({
      where: whereClause,
      include: {
        cardProduct: {
          include: {
            category: {
              select: {
                categoryCode: true,
                categoryName: true,
              },
            },
            type: {
              select: {
                typeCode: true,
                typeName: true,
              },
            },
          },
        },
      },
      orderBy: {
        purchaseDate: "asc",
      },
    });

    // Group by date, category, and type
    const salesMap = new Map<string, SalesData>();

    cards.forEach((card) => {
      // Skip if purchaseDate is null or cardProduct is null
      if (!card.purchaseDate || !card.cardProduct) return;

      // Use local timezone to get correct date
      const date = new Date(card.purchaseDate);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`; // YYYY-MM-DD in local timezone
      const categoryCode = card.cardProduct.category.categoryCode;
      const typeCode = card.cardProduct.type.typeCode;

      const key = `${dateKey}_${categoryCode}_${typeCode}`;

      if (salesMap.has(key)) {
        const existing = salesMap.get(key)!;
        existing.count += 1;
      } else {
        salesMap.set(key, {
          date,
          categoryCode,
          typeCode,
          count: 1,
        });
      }
    });

    // Convert map to array
    const salesData: SalesData[] = Array.from(salesMap.values());

    return salesData;
  }

  /**
   * Get expired daily sales data
   * Query cards that are expired (expiredDate < now) and purchased within date range
   * Returns grouped data by date, category, and type with count and totalPrice
   */
  static async getExpiredDailySales(params: DailySalesQueryParams) {
    const { startDate, endDate, stationId } = params;
    const now = new Date();

    // Parse dates - use local timezone to avoid timezone conversion issues
    const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
    const start = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0);
    
    const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
    const end = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999);

    const whereClause: any = {
      purchaseDate: {
        gte: start,
        lte: end,
      },
      expiredDate: {
        lt: now, // Only cards that are already expired
      },
      deletedAt: null,
    };

    // If stationId is provided, filter by transactions with that stationId
    if (stationId) {
      whereClause.transactions = {
        some: {
          stationId: stationId,
          deletedAt: null,
        },
      };
    }

    // Query expired cards with category, type, and price information via cardProduct relation
    const cards = await db.card.findMany({
      where: whereClause,
      include: {
        cardProduct: {
          include: {
            category: {
              select: {
                categoryCode: true,
                categoryName: true,
              },
            },
            type: {
              select: {
                typeCode: true,
                typeName: true,
              },
            },
            // Include price for calculating total expired price
          },
        },
      },
      orderBy: {
        purchaseDate: "asc",
      },
    });

    // Group by date, category, and type
    const expiredSalesMap = new Map<string, ExpiredSalesData>();

    cards.forEach((card) => {
      // Skip if purchaseDate is null or cardProduct is null
      if (!card.purchaseDate || !card.cardProduct) return;

      // Use local timezone to get correct date
      const date = new Date(card.purchaseDate);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`; // YYYY-MM-DD in local timezone
      const categoryCode = card.cardProduct.category.categoryCode;
      const typeCode = card.cardProduct.type.typeCode;

      const key = `${dateKey}_${categoryCode}_${typeCode}`;

      // Get price from cardProduct
      const price = card.cardProduct.price;
      const priceNumber = typeof price === 'number' ? price : Number(price);

      if (expiredSalesMap.has(key)) {
        const existing = expiredSalesMap.get(key)!;
        existing.count += 1;
        existing.totalPrice += priceNumber;
      } else {
        expiredSalesMap.set(key, {
          date,
          categoryCode,
          typeCode,
          count: 1,
          totalPrice: priceNumber,
        });
      }
    });

    // Convert map to array
    const expiredSalesData: ExpiredSalesData[] = Array.from(expiredSalesMap.values());

    return expiredSalesData;
  }

  /**
   * Aggregate expired daily sales data into frontend table format
   * Groups data into 4 rows: range (1 to dayBeforeYesterday), yesterday, today, total
   * Similar to getDailySalesAggregated but for expired cards
   */
  static async getExpiredDailySalesAggregated(
    params: DailySalesQueryParams
  ): Promise<ExpiredDailySalesAggregated> {
    const expiredSalesData = await this.getExpiredDailySales(params);

    // Group by date
    const dateGroups = new Map<string, ExpiredSalesData[]>();
    expiredSalesData.forEach((item) => {
      const dateKey = formatDateString(item.date); // Use local timezone
      if (!dateGroups.has(dateKey)) {
        dateGroups.set(dateKey, []);
      }
      dateGroups.get(dateKey)!.push(item);
    });

    // Get date keys
    const { today, yesterday, dayBeforeYesterday, todayKey, yesterdayKey } =
      getDateKeys();

    // Initialize grouped rows
    const rangeRow = createEmptyExpiredRow();
    const yesterdayRow = createEmptyExpiredRow();
    const todayRow = createEmptyExpiredRow();

    // Process each date group
    dateGroups.forEach((dateItems, dateKey) => {
      const date = new Date(dateKey + "T00:00:00");

      // Determine which row this date belongs to
      let targetRow: ExpiredDailySalesRow | null = null;
      let rowTanggal = "";

      if (dateKey === todayKey) {
        targetRow = todayRow;
        rowTanggal = formatDate(date);
      } else if (dateKey === yesterdayKey) {
        targetRow = yesterdayRow;
        rowTanggal = formatDate(date);
      } else if (date < yesterday) {
        targetRow = rangeRow;
        // Don't set tanggal here, will be set later as range
      }

      if (!targetRow) return;

      // Aggregate data for this date
      dateItems.forEach((item) => {
        addExpiredToRow(
          targetRow!,
          item.categoryCode,
          item.typeCode,
          item.count,
          item.totalPrice
        );
      });

      // Calculate row total
      targetRow.total = calculateRowTotal(targetRow);

      // Set tanggal if not range row
      if (targetRow !== rangeRow && rowTanggal) {
        targetRow.tanggal = rowTanggal;
      }
    });

    // Format row tanggals
    const startDay = 1;
    const endDay = dayBeforeYesterday.getDate();

    // Format range tanggal (1 to dayBeforeYesterday)
    if (endDay >= startDay) {
      rangeRow.tanggal = formatDateRange(
        startDay,
        endDay,
        today.getMonth(),
        today.getFullYear()
      );
    }

    // Format yesterday tanggal if not set
    if (!yesterdayRow.tanggal && yesterday.getDate() >= 1) {
      yesterdayRow.tanggal = formatDate(yesterday);
    }

    // Format today tanggal if not set
    if (!todayRow.tanggal) {
      todayRow.tanggal = formatDate(today);
    }

    // Calculate totals only from the 3 displayed rows (range, yesterday, today)
    const totalsData = calculateExpiredTotalsFromRows([
      rangeRow,
      yesterdayRow,
      todayRow,
    ]);
    const totals: ExpiredDailySalesRow = {
      tanggal: "TOTAL",
      ...totalsData,
    };

    // Build result array - show rows based on valid dates
    const rows: ExpiredDailySalesRow[] = [];

    // Add range row (only if valid date range exists)
    if (rangeRow.tanggal && endDay >= startDay) {
      rows.push(rangeRow);
    }

    // Add yesterday row (only if valid date)
    if (yesterdayRow.tanggal && yesterday.getDate() >= 1) {
      rows.push(yesterdayRow);
    }

    // Add today row (always show)
    rows.push(todayRow);

    return {
      rows,
      totals: totals as ExpiredDailySalesRow,
    };
  }

  /**
   * Aggregate daily sales data into frontend table format
   * Groups data into 4 rows: range (1 to dayBeforeYesterday), yesterday, today, total
   */
  static async getDailySalesAggregated(
    params: DailySalesQueryParams
  ): Promise<DailySalesAggregated> {
    const salesData = await this.getDailySales(params);

    // Group by date
    const dateGroups = new Map<string, SalesData[]>();
    salesData.forEach((item) => {
      const dateKey = formatDateString(item.date); // Use local timezone
      if (!dateGroups.has(dateKey)) {
        dateGroups.set(dateKey, []);
      }
      dateGroups.get(dateKey)!.push(item);
    });

    // Get date keys
    const { today, yesterday, dayBeforeYesterday, todayKey, yesterdayKey } =
      getDateKeys();

    // Initialize grouped rows
    const rangeRow = createEmptyRow();
    const yesterdayRow = createEmptyRow();
    const todayRow = createEmptyRow();

    // Process each date group
    dateGroups.forEach((dateItems, dateKey) => {
      const date = new Date(dateKey + "T00:00:00");

      // Determine which row this date belongs to
      let targetRow: DailySalesRow | null = null;
      let rowTanggal = "";

      if (dateKey === todayKey) {
        targetRow = todayRow;
        rowTanggal = formatDate(date);
      } else if (dateKey === yesterdayKey) {
        targetRow = yesterdayRow;
        rowTanggal = formatDate(date);
      } else if (date < yesterday) {
        targetRow = rangeRow;
        // Don't set tanggal here, will be set later as range
      }

      if (!targetRow) return;

      // Aggregate data for this date
      dateItems.forEach((item) => {
        addSalesToRow(
          targetRow!,
          item.categoryCode,
          item.typeCode,
          item.count
        );
      });

      // Calculate row total
      targetRow.total = calculateRowTotal(targetRow);

      // Set tanggal if not range row
      if (targetRow !== rangeRow && rowTanggal) {
        targetRow.tanggal = rowTanggal;
      }
    });

    // Format row tanggals
    const startDay = 1;
    const endDay = dayBeforeYesterday.getDate();

    // Format range tanggal (1 to dayBeforeYesterday)
    if (endDay >= startDay) {
      rangeRow.tanggal = formatDateRange(
        startDay,
        endDay,
        today.getMonth(),
        today.getFullYear()
      );
    }

    // Format yesterday tanggal if not set
    if (!yesterdayRow.tanggal && yesterday.getDate() >= 1) {
      yesterdayRow.tanggal = formatDate(yesterday);
    }

    // Format today tanggal if not set
    if (!todayRow.tanggal) {
      todayRow.tanggal = formatDate(today);
    }

    // Calculate totals only from the 3 displayed rows (range, yesterday, today)
    const totalsData = calculateTotalsFromRows([rangeRow, yesterdayRow, todayRow]);
    const totals: DailySalesRow = {
      tanggal: "TOTAL",
      ...totalsData,
    };

    // Build result array - show rows based on valid dates
    const rows: DailySalesRow[] = [];

    // Add range row (only if valid date range exists)
    if (rangeRow.tanggal && endDay >= startDay) {
      rows.push(rangeRow);
    }

    // Add yesterday row (only if valid date)
    if (yesterdayRow.tanggal && yesterday.getDate() >= 1) {
      rows.push(yesterdayRow);
    }

    // Add today row (always show)
    rows.push(todayRow);

    return {
      rows,
      totals: totals as DailySalesRow,
    };
  }

  /**
   * Get daily totals - simple format with date and total count per day
   * Returns array of { date: string, total: number }
   */
  static async getDailyTotals(
    params: DailySalesQueryParams
  ): Promise<DailyTotal[]> {
    const { startDate, endDate, stationId } = params;

    // Parse dates - use local timezone to avoid timezone conversion issues
    // Format: YYYY-MM-DD -> create date in local timezone
    const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
    const start = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0);
    
    const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
    const end = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999);

    const whereClause: any = {
      purchaseDate: {
        gte: start,
        lte: end,
      },
      deletedAt: null,
    };

    // If stationId is provided, filter by transactions with that stationId
    if (stationId) {
      whereClause.transactions = {
        some: {
          stationId: stationId,
          deletedAt: null,
        },
      };
    }

    // Query cards grouped by purchase date
    const cards = await db.card.findMany({
      where: whereClause,
      select: {
        purchaseDate: true,
      },
      orderBy: {
        purchaseDate: "asc",
      },
    });

    // Group by date and count
    const dailyTotalsMap = new Map<string, number>();

    cards.forEach((card) => {
      // Skip if purchaseDate is null
      if (!card.purchaseDate) return;

      // Use local timezone to get correct date
      const date = new Date(card.purchaseDate);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`; // YYYY-MM-DD in local timezone

      // Increment count for this date
      const currentCount = dailyTotalsMap.get(dateKey) || 0;
      dailyTotalsMap.set(dateKey, currentCount + 1);
    });

    // Convert map to array, filter by date range, and sort by date
    const dailyTotals: DailyTotal[] = Array.from(dailyTotalsMap.entries())
      .map(([date, total]) => ({
        date,
        total,
      }))
      .filter((item) => {
        // Ensure date is within requested range
        return item.date >= startDate && item.date <= endDate;
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    return dailyTotals;
  }

  /**
   * Get cards summary (count, quota issued, redeemed and unredeemed tickets)
   * Active cards = status SOLD_ACTIVE, not expired, and quotaTicket > 0
   */
  static async getCardsSummary(
    params: CardsSummaryQueryParams
  ): Promise<CardsSummaryData> {
    const { startDate, endDate, stationId } = params;
    const now = new Date();

    // Build where clause
    const whereClause: any = {
      status: "SOLD_ACTIVE",
      deletedAt: null,
      quotaTicket: {
        gt: 0,
      },
      OR: [
        {
          expiredDate: {
            gt: now,
          },
        },
        {
          expiredDate: null,
        },
      ],
    };

    // Add purchase date filter if provided
    if (startDate || endDate) {
      whereClause.purchaseDate = {};
      if (startDate) {
        const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
        const start = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0);
        whereClause.purchaseDate.gte = start;
      }
      if (endDate) {
        const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
        const end = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999);
        whereClause.purchaseDate.lte = end;
      }
    }

    // Add station filter if provided
    if (stationId) {
      whereClause.transactions = {
        some: {
          stationId: stationId,
          deletedAt: null,
        },
      };
    }

    // Query active cards with cardProduct relation to get totalQuota
    const cards = await db.card.findMany({
      where: whereClause,
      include: {
        cardProduct: {
          select: {
            totalQuota: true,
          },
        },
      },
    });

    // Calculate active cards count
    const activeCardsCount = cards.length;

    // Calculate total quota ticket issued (sum of totalQuota from cardProduct)
    let activeCardsQuotaIssued = 0;
    let totalRedeemed = 0;
    let totalUnredeemed = 0;

    cards.forEach((card) => {
      const totalQuota = card.cardProduct?.totalQuota || 0;
      const quotaTicket = card.quotaTicket || 0;
      
      activeCardsQuotaIssued += totalQuota;
      totalRedeemed += totalQuota - quotaTicket; // Redeemed = total - remaining
      totalUnredeemed += quotaTicket; // Unredeemed = remaining
    });

    // Calculate percentages (rounded to 2 decimal places)
    const redeemedPercentage = activeCardsQuotaIssued > 0
      ? Number(((totalRedeemed / activeCardsQuotaIssued) * 100).toFixed(2))
      : 0;
    const unredeemedPercentage = activeCardsQuotaIssued > 0
      ? Number(((totalUnredeemed / activeCardsQuotaIssued) * 100).toFixed(2))
      : 0;

    return {
      activeCardsCount,
      activeCardsQuotaIssued,
      redeemedTickets: totalRedeemed,
      unredeemedTickets: totalUnredeemed,
      redeemedPercentage,
      unredeemedPercentage,
    };
  }
}
