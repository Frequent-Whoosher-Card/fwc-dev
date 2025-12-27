import db from "../../config/db";
import {
  formatDate,
  formatDateRange,
  createEmptyRow,
  calculateRowTotal,
  addSalesToRow,
  calculateTotalsFromRows,
  getDateKeys,
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

export class SalesService {
  static async getDailySales(params: DailySalesQueryParams) {
    const { startDate, endDate, stationId } = params;

    // Parse dates
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0); 
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

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

      const date = new Date(card.purchaseDate);
      date.setHours(0, 0, 0, 0); 

      const dateKey = date.toISOString().split("T")[0]; // YYYY-MM-DD
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
      const dateKey = item.date.toISOString().split("T")[0];
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
}
