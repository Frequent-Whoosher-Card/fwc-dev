import { API_BASE_URL } from "./apiConfig";

export interface RevenueData {
  cardIssued: number;
  quotaTicketIssued: number;
  redeem: number;
  expiredTicket: number;
  remainingActiveTickets: number;
}

export interface MetricsData {
  cardIssued: number;
  quotaTicketIssued: number;
  redeem: number;
  expiredTicket: number;
  remainingActiveTickets: number;
  revenue: RevenueData;
}

export interface DailySalesRow {
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
  soldPrice: number;
  percentage?: {
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
  };
}

export interface DailySalesData {
  rows: DailySalesRow[];
  totals: DailySalesRow;
}

export interface DailyTotal {
  date: string;
  total: number;
}

export interface ExpiredDailySalesRow {
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
  expired: number;
  expiredPrice: number;
}

export interface ExpiredDailySalesData {
  rows: ExpiredDailySalesRow[];
  totals: ExpiredDailySalesRow;
}

export interface CardsSummaryData {
  activeCardsCount: number;
  activeCardsQuotaIssued: number;
  redeemedTickets: number;
  unredeemedTickets: number;
  redeemedPercentage: number;
  unredeemedPercentage: number;
}

export interface MetricsSummaryData {
  cardIssued: number;
  quotaTicketIssued: number;
  redeem: number;
  remainingActiveTickets: number;
  expiredTicket: number;
  redeemPercentage: number;
  remainingActiveTicketsPercentage: number;
  expiredTicketPercentage: number;
}

export interface StationSalesData {
  stationId: string;
  stationCode: string;
  stationName: string;
  cardIssued: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiError {
  success: boolean;
  error: {
    message: string;
    code: string;
    statusCode: number;
  };
}

/**
 * Fetch metrics data
 */
export async function fetchMetrics(
  startDate: string,
  endDate: string
): Promise<MetricsData> {
  const params = new URLSearchParams();
  params.append("startDate", startDate);
  params.append("endDate", endDate);

  const url = `${API_BASE_URL}/metrics?${params.toString()}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error?.message || "Failed to fetch metrics");
  }

  const result: ApiResponse<MetricsData> = await response.json();
  return result.data;
}

/**
 * Fetch daily sales grouped data
 */
export async function fetchDailySales(
  startDate: string,
  endDate: string,
  stationId?: string
): Promise<DailySalesData> {
  const params = new URLSearchParams();
  params.append("startDate", startDate);
  params.append("endDate", endDate);
  if (stationId) params.append("stationId", stationId);

  const url = `${API_BASE_URL}/sales/daily-grouped?${params.toString()}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error?.message || "Failed to fetch daily sales");
  }

  const result: ApiResponse<DailySalesData> = await response.json();
  return result.data;
}

/**
 * Fetch daily totals data (simple format)
 */
export async function fetchDailyTotals(
  startDate: string,
  endDate: string,
  stationId?: string
): Promise<DailyTotal[]> {
  const params = new URLSearchParams();
  params.append("startDate", startDate);
  params.append("endDate", endDate);
  if (stationId) params.append("stationId", stationId);

  const url = `${API_BASE_URL}/sales/daily-totals?${params.toString()}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error?.message || "Failed to fetch daily totals");
  }

  const result: ApiResponse<DailyTotal[]> = await response.json();
  return result.data;
}

/**
 * Fetch expired daily sales grouped data
 */
export async function fetchExpiredDailySales(
  startDate: string,
  endDate: string,
  stationId?: string
): Promise<ExpiredDailySalesData> {
  const params = new URLSearchParams();
  params.append("startDate", startDate);
  params.append("endDate", endDate);
  if (stationId) params.append("stationId", stationId);

  const url = `${API_BASE_URL}/sales/daily-grouped-expired?${params.toString()}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error?.message || "Failed to fetch expired daily sales");
  }

  const result: ApiResponse<ExpiredDailySalesData> = await response.json();
  return result.data;
}

/**
 * Fetch cards summary (count, quota issued, redeemed and unredeemed tickets)
 */
export async function fetchCardsSummary(
  startDate?: string,
  endDate?: string,
  stationId?: string
): Promise<CardsSummaryData> {
  const params = new URLSearchParams();
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);
  if (stationId) params.append("stationId", stationId);

  const url = `${API_BASE_URL}/sales/cards-summary${params.toString() ? `?${params.toString()}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error?.message || "Failed to fetch cards summary");
  }

  const result: ApiResponse<CardsSummaryData> = await response.json();
  return result.data;
}

/**
 * Fetch metrics summary (card issued and quota ticket issued only)
 */
export async function fetchMetricsSummary(
  startDate?: string,
  endDate?: string
): Promise<MetricsSummaryData> {
  const params = new URLSearchParams();
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);

  const url = `${API_BASE_URL}/metrics/summary${params.toString() ? `?${params.toString()}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error?.message || "Failed to fetch metrics summary");
  }

  const result: ApiResponse<MetricsSummaryData> = await response.json();
  return result.data;
}

/**
 * Fetch sales data per station
 */
export async function fetchSalesPerStation(
  startDate?: string,
  endDate?: string
): Promise<StationSalesData[]> {
  const params = new URLSearchParams();
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);

  const url = `${API_BASE_URL}/sales/per-station?${params.toString()}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error?.message || "Failed to fetch sales per station");
  }

  const result: ApiResponse<StationSalesData[]> = await response.json();
  return result.data;
}

