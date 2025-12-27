import db from "../../config/db";

interface MetricsData {
  cardIssued: number;
  quotaTicketIssued: number;
  redeem: number;
  expiredTicket: number;
  remainingActiveTickets: number;
}

interface MetricsQueryParams {
  startDate?: string;
  endDate?: string;
}

export class MetricsService {
  /**
   * Build where clause for purchase date filter
   */
  private static buildPurchaseDateFilter(
    startDate?: string,
    endDate?: string
  ): any {
    const where: any = {
      deletedAt: null,
    };

    if (startDate || endDate) {
      where.purchaseDate = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        where.purchaseDate.gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.purchaseDate.lte = end;
      }
    } else {
      // If no date filter, only filter deletedAt
      where.deletedAt = null;
    }

    return where;
  }

  /**
   * Get total number of cards issued (not deleted)
   */
  static async getCardIssued(
    startDate?: string,
    endDate?: string
  ): Promise<number> {
    const where = this.buildPurchaseDateFilter(startDate, endDate);
    const count = await db.card.count({
      where,
    });
    return count;
  }

  /**
   * Get total quota ticket issued (sum of totalQuota from all cards)
   */
  static async getQuotaTicketIssued(
    startDate?: string,
    endDate?: string
  ): Promise<number> {
    const where = this.buildPurchaseDateFilter(startDate, endDate);
    const result = await db.card.aggregate({
      where,
      _sum: {
        totalQuota: true,
      },
    });
    return result._sum.totalQuota || 0;
  }

  /**
   * Get total tickets redeemed (sum of totalQuota - quotaTicket from cards)
   * Redeem = totalQuota - quotaTicket (selisih antara total dan sisa)
   */
  static async getRedeem(
    startDate?: string,
    endDate?: string
  ): Promise<number> {
    const where = this.buildPurchaseDateFilter(startDate, endDate);
    
    // Get sum of totalQuota and quotaTicket separately
    const totalQuotaResult = await db.card.aggregate({
      where,
      _sum: {
        totalQuota: true,
      },
    });

    const quotaTicketResult = await db.card.aggregate({
      where,
      _sum: {
        quotaTicket: true,
      },
    });

    const totalQuota = totalQuotaResult._sum.totalQuota || 0;
    const quotaTicket = quotaTicketResult._sum.quotaTicket || 0;

    // Redeem = totalQuota - quotaTicket (yang sudah digunakan)
    return totalQuota - quotaTicket;
  }

  /**
   * Get expired tickets (sum of quotaTicket from expired cards)
   */
  static async getExpiredTicket(
    startDate?: string,
    endDate?: string
  ): Promise<number> {
    const now = new Date();
    const where = this.buildPurchaseDateFilter(startDate, endDate);
    
    // Add expired date condition
    where.expiredDate = {
      lt: now,
    };

    const result = await db.card.aggregate({
      where,
      _sum: {
        quotaTicket: true,
      },
    });
    return result._sum.quotaTicket || 0;
  }

  static async getRemainingActiveTickets(
    startDate?: string,
    endDate?: string
  ): Promise<number> {
    const now = new Date();
    const where = this.buildPurchaseDateFilter(startDate, endDate);
    
    // Add active card conditions
    where.status = "Aktif";
    where.OR = [
      {
        expiredDate: {
          gt: now,
        },
      },
      {
        expiredDate: null,
      },
    ];
    where.quotaTicket = {
      gt: 0,
    };

    const result = await db.card.aggregate({
      where,
      _sum: {
        quotaTicket: true,
      },
    });
    return result._sum.quotaTicket || 0;
  }

  /**
   * Get all metrics in one call
   */
  static async getMetrics(
    params?: MetricsQueryParams
  ): Promise<MetricsData> {
    const { startDate, endDate } = params || {};

    const [
      cardIssued,
      quotaTicketIssued,
      redeem,
      expiredTicket,
      remainingActiveTickets,
    ] = await Promise.all([
      this.getCardIssued(startDate, endDate),
      this.getQuotaTicketIssued(startDate, endDate),
      this.getRedeem(startDate, endDate),
      this.getExpiredTicket(startDate, endDate),
      this.getRemainingActiveTickets(startDate, endDate),
    ]);

    return {
      cardIssued,
      quotaTicketIssued,
      redeem,
      expiredTicket,
      remainingActiveTickets,
    };
  }
}

