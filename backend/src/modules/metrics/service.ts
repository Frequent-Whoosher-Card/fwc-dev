import db from "../../config/db";

interface RevenueData {
  cardIssued: number;
  quotaTicketIssued: number;
  redeem: number;
  expiredTicket: number;
  remainingActiveTickets: number;
}

interface MetricsData {
  cardIssued: number;
  quotaTicketIssued: number;
  redeem: number;
  expiredTicket: number;
  remainingActiveTickets: number;
  revenue: RevenueData;
}

interface MetricsQueryParams {
  startDate?: string;
  endDate?: string;
}

interface MetricsSummaryData {
  cardIssued: number;
  quotaTicketIssued: number;
  redeem: number;
  remainingActiveTickets: number;
  expiredTicket: number;
  redeemPercentage: number;
  remainingActiveTicketsPercentage: number;
  expiredTicketPercentage: number;
}

export class MetricsService {
  /**
   * Build where clause for purchase date filter
   * Uses CardPurchase relation instead of Card.purchaseDate
   * Uses local timezone to avoid timezone conversion issues
   */
  private static buildPurchaseDateFilter(
    startDate?: string,
    endDate?: string
  ): any {
    const purchaseFilter: any = {
      deletedAt: null,
    };

    if (startDate || endDate) {
      purchaseFilter.purchaseDate = {};
      if (startDate) {
        // Parse date string in local timezone
        const [year, month, day] = startDate.split('-').map(Number);
        const start = new Date(year, month - 1, day, 0, 0, 0, 0);
        purchaseFilter.purchaseDate.gte = start;
      }
      if (endDate) {
        // Parse date string in local timezone for end of day
        const [year, month, day] = endDate.split('-').map(Number);
        const end = new Date(year, month - 1, day, 23, 59, 59, 999);
        purchaseFilter.purchaseDate.lte = end;
      }
    }

    // Filter cards that have purchases matching the date range
    return {
      deletedAt: null,
      purchases: {
        some: purchaseFilter,
      },
    };
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
   * Get total revenue from cards issued (sum of cardProduct.price from all cards)
   */
  static async getCardIssuedRevenue(
    startDate?: string,
    endDate?: string
  ): Promise<number> {
    const where = this.buildPurchaseDateFilter(startDate, endDate);
    
    // Get all cards with cardProduct relation to access price
    const cards = await db.card.findMany({
      where,
      include: {
        cardProduct: {
          select: {
            price: true,
          },
        },
      },
    });

    // Sum price from cardProduct
    // Convert Decimal to number for calculation
    const totalRevenue = cards.reduce((sum, card) => {
      const price = card.cardProduct?.price;
      if (price) {
        // Prisma Decimal type needs to be converted to number
        const priceNumber = typeof price === 'number' ? price : Number(price);
        return sum + priceNumber;
      }
      return sum;
    }, 0);

    return totalRevenue;
  }

  /**
   * Get total quota ticket issued (sum of totalQuota from all cards)
   * Now gets totalQuota from cardProduct relation
   */
  static async getQuotaTicketIssued(
    startDate?: string,
    endDate?: string
  ): Promise<number> {
    const where = this.buildPurchaseDateFilter(startDate, endDate);
    
    // Get all cards with cardProduct relation
    const cards = await db.card.findMany({
      where,
      include: {
        cardProduct: {
          select: {
            totalQuota: true,
          },
        },
      },
    });

    // Sum totalQuota from cardProduct
    const total = cards.reduce((sum, card) => {
      return sum + (card.cardProduct?.totalQuota || 0);
    }, 0);

    return total;
  }

  /**
   * Get total revenue from quota ticket issued
   * Revenue = sum of cardProduct.price from all cards that have quota ticket issued
   * (Same as cardIssuedRevenue since each card has totalQuota)
   */
  static async getQuotaTicketIssuedRevenue(
    startDate?: string,
    endDate?: string
  ): Promise<number> {
    const where = this.buildPurchaseDateFilter(startDate, endDate);
    
    // Get all cards with cardProduct relation to access price
    const cards = await db.card.findMany({
      where,
      include: {
        cardProduct: {
          select: {
            price: true,
            totalQuota: true,
          },
        },
      },
    });

    // Sum price from cardProduct for all cards that have quota ticket issued
    // Revenue = total harga dari semua card yang memiliki totalQuota
    const totalRevenue = cards.reduce((sum, card) => {
      const price = card.cardProduct?.price;
      if (price && card.cardProduct?.totalQuota && card.cardProduct.totalQuota > 0) {
        // Prisma Decimal type needs to be converted to number
        const priceNumber = typeof price === 'number' ? price : Number(price);
        return sum + priceNumber;
      }
      return sum;
    }, 0);

    return totalRevenue;
  }

  /**
   * Get total tickets redeemed (sum of totalQuota - quotaTicket from cards)
   * Redeem = totalQuota - quotaTicket (selisih antara total dan sisa)
   * Now gets totalQuota from cardProduct relation
   */
  static async getRedeem(
    startDate?: string,
    endDate?: string
  ): Promise<number> {
    const where = this.buildPurchaseDateFilter(startDate, endDate);
    
    // Get all cards with cardProduct relation
    const cards = await db.card.findMany({
      where,
      include: {
        cardProduct: {
          select: {
            totalQuota: true,
          },
        },
      },
    });

    // Calculate totalQuota from cardProduct and quotaTicket from card
    let totalQuota = 0;
    let quotaTicket = 0;

    cards.forEach((card) => {
      totalQuota += card.cardProduct?.totalQuota || 0;
      quotaTicket += card.quotaTicket || 0;
    });

    // Redeem = totalQuota - quotaTicket (yang sudah digunakan)
    return totalQuota - quotaTicket;
  }

  /**
   * Get total revenue from tickets redeemed
   * Revenue = sum of (price * (redeem / totalQuota)) for each card
   * Where redeem = totalQuota - quotaTicket (tickets that have been used)
   */
  static async getRedeemRevenue(
    startDate?: string,
    endDate?: string
  ): Promise<number> {
    const where = this.buildPurchaseDateFilter(startDate, endDate);
    
    // Get all cards with cardProduct relation
    const cards = await db.card.findMany({
      where,
      include: {
        cardProduct: {
          select: {
            price: true,
            totalQuota: true,
          },
        },
      },
    });

    // Calculate revenue per card: (redeem / totalQuota) * price
    // Where redeem = totalQuota - quotaTicket
    const totalRevenue = cards.reduce((sum, card) => {
      const price = card.cardProduct?.price;
      const totalQuota = card.cardProduct?.totalQuota || 0;
      const quotaTicket = card.quotaTicket || 0;
      
      if (price && totalQuota > 0) {
        // Calculate redeem for this card
        const redeem = totalQuota - quotaTicket;
        
        if (redeem > 0) {
          // Calculate proportional revenue: (redeem / totalQuota) * price
          const priceNumber = typeof price === 'number' ? price : Number(price);
          const proportionalRevenue = (redeem / totalQuota) * priceNumber;
          return sum + proportionalRevenue;
        }
      }
      return sum;
    }, 0);

    return totalRevenue;
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

  /**
   * Get total revenue from expired tickets
   * Revenue = sum of (price * (quotaTicket / totalQuota)) for each expired card
   * Where expired card = card with expiredDate < now
   */
  static async getExpiredTicketRevenue(
    startDate?: string,
    endDate?: string
  ): Promise<number> {
    const now = new Date();
    const where = this.buildPurchaseDateFilter(startDate, endDate);
    
    // Add expired date condition
    where.expiredDate = {
      lt: now,
    };

    // Get all expired cards with cardProduct relation
    const cards = await db.card.findMany({
      where,
      include: {
        cardProduct: {
          select: {
            price: true,
            totalQuota: true,
          },
        },
      },
    });

    // Calculate revenue per card: (quotaTicket / totalQuota) * price
    // Where quotaTicket is the remaining tickets that expired
    const totalRevenue = cards.reduce((sum, card) => {
      const price = card.cardProduct?.price;
      const totalQuota = card.cardProduct?.totalQuota || 0;
      const quotaTicket = card.quotaTicket || 0;
      
      if (price && totalQuota > 0 && quotaTicket > 0) {
        // Calculate proportional revenue: (quotaTicket / totalQuota) * price
        const priceNumber = typeof price === 'number' ? price : Number(price);
        const proportionalRevenue = (quotaTicket / totalQuota) * priceNumber;
        return sum + proportionalRevenue;
      }
      return sum;
    }, 0);

    return totalRevenue;
  }

  static async getRemainingActiveTickets(
    startDate?: string,
    endDate?: string
  ): Promise<number> {
    const now = new Date();
    const where = this.buildPurchaseDateFilter(startDate, endDate);
    
    // Add active card conditions
    where.status = "SOLD_ACTIVE";
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
   * Get total revenue from remaining active tickets
   * Revenue = sum of (price * (quotaTicket / totalQuota)) for each active card
   * Where active card = card with status "SOLD_ACTIVE", not expired, and quotaTicket > 0
   */
  static async getRemainingActiveTicketsRevenue(
    startDate?: string,
    endDate?: string
  ): Promise<number> {
    const now = new Date();
    const where = this.buildPurchaseDateFilter(startDate, endDate);
    
    // Add active card conditions
    where.status = "SOLD_ACTIVE";
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

    // Get all active cards with cardProduct relation
    const cards = await db.card.findMany({
      where,
      include: {
        cardProduct: {
          select: {
            price: true,
            totalQuota: true,
          },
        },
      },
    });

    // Calculate revenue per card: (quotaTicket / totalQuota) * price
    // Where quotaTicket is the remaining active tickets
    const totalRevenue = cards.reduce((sum, card) => {
      const price = card.cardProduct?.price;
      const totalQuota = card.cardProduct?.totalQuota || 0;
      const quotaTicket = card.quotaTicket || 0;
      
      if (price && totalQuota > 0 && quotaTicket > 0) {
        // Calculate proportional revenue: (quotaTicket / totalQuota) * price
        const priceNumber = typeof price === 'number' ? price : Number(price);
        const proportionalRevenue = (quotaTicket / totalQuota) * priceNumber;
        return sum + proportionalRevenue;
      }
      return sum;
    }, 0);

    return totalRevenue;
  }

  /**
   * Get metrics summary (card issued, quota ticket issued, redeem, remaining active tickets, and expired tickets)
   * Optional date filters can be applied
   * Includes percentage calculations for redeem, remaining active tickets, and expired tickets
   */
  static async getMetricsSummary(
    startDate?: string,
    endDate?: string
  ): Promise<MetricsSummaryData> {
    const [
      cardIssued,
      quotaTicketIssued,
      redeem,
      remainingActiveTickets,
      expiredTicket,
    ] = await Promise.all([
      this.getCardIssued(startDate, endDate),
      this.getQuotaTicketIssued(startDate, endDate),
      this.getRedeem(startDate, endDate),
      this.getRemainingActiveTickets(startDate, endDate),
      this.getExpiredTicket(startDate, endDate),
    ]);

    // Calculate percentages (rounded to 2 decimal places)
    const redeemPercentage =
      quotaTicketIssued > 0
        ? Number(((redeem / quotaTicketIssued) * 100).toFixed(2))
        : 0;
    const remainingActiveTicketsPercentage =
      quotaTicketIssued > 0
        ? Number(
            ((remainingActiveTickets / quotaTicketIssued) * 100).toFixed(2)
          )
        : 0;
    const expiredTicketPercentage =
      quotaTicketIssued > 0
        ? Number(((expiredTicket / quotaTicketIssued) * 100).toFixed(2))
        : 0;

    return {
      cardIssued,
      quotaTicketIssued,
      redeem,
      remainingActiveTickets,
      expiredTicket,
      redeemPercentage,
      remainingActiveTicketsPercentage,
      expiredTicketPercentage,
    };
  }

  /**
   * Get all metrics in one call
   */
  static async getMetrics(
    params: MetricsQueryParams
  ): Promise<MetricsData> {
    const { startDate, endDate } = params;

    const [
      cardIssued,
      quotaTicketIssued,
      redeem,
      expiredTicket,
      remainingActiveTickets,
      cardIssuedRevenue,
      quotaTicketIssuedRevenue,
      redeemRevenue,
      expiredTicketRevenue,
      remainingActiveTicketsRevenue,
    ] = await Promise.all([
      this.getCardIssued(startDate, endDate),
      this.getQuotaTicketIssued(startDate, endDate),
      this.getRedeem(startDate, endDate),
      this.getExpiredTicket(startDate, endDate),
      this.getRemainingActiveTickets(startDate, endDate),
      this.getCardIssuedRevenue(startDate, endDate),
      this.getQuotaTicketIssuedRevenue(startDate, endDate),
      this.getRedeemRevenue(startDate, endDate),
      this.getExpiredTicketRevenue(startDate, endDate),
      this.getRemainingActiveTicketsRevenue(startDate, endDate),
    ]);

    return {
      cardIssued,
      quotaTicketIssued,
      redeem,
      expiredTicket,
      remainingActiveTickets,
      revenue: {
        cardIssued: cardIssuedRevenue,
        quotaTicketIssued: quotaTicketIssuedRevenue,
        redeem: redeemRevenue,
        expiredTicket: expiredTicketRevenue,
        remainingActiveTickets: remainingActiveTicketsRevenue,
      },
    };
  }
}

