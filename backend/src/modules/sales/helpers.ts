/**
 * Helper functions for sales module
 */

// Month names in Indonesian format
const MONTH_NAMES = [
  "jan", "feb", "mar", "apr", "may", "jun",
  "jul", "aug", "sep", "oct", "nov", "dec",
] as const;

/**
 * Format date to Indonesian format (e.g., "16 dec 2025")
 */
export function formatDate(date: Date): string {
  const day = date.getDate();
  const month = MONTH_NAMES[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Format date range (e.g., "1-24 dec 2025")
 */
export function formatDateRange(
  startDay: number,
  endDay: number,
  month: number,
  year: number
): string {
  const monthName = MONTH_NAMES[month];
  if (startDay === endDay) {
    return `${startDay} ${monthName} ${year}`;
  }
  return `${startDay}-${endDay} ${monthName} ${year}`;
}

/**
 * Normalize category code to uppercase
 */
export function normalizeCategoryCode(categoryCode: string): string {
  return categoryCode.toUpperCase().trim();
}

/**
 * Normalize type code (handle variations like JaBan, JABAN, jaban)
 */
export function normalizeTypeCode(typeCode: string): string {
  const normalized = typeCode.trim().toLowerCase();
  const typeMap: Record<string, string> = {
    jaban: "JaBan",
    jaka: "JaKa",
    kaban: "KaBan",
  };
  return typeMap[normalized] || typeCode.trim();
}

/**
 * Create an empty sales row
 */
export function createEmptyRow(): {
  tanggal: string;
  gold: { jaBan: number; jaKa: number; kaBan: number };
  silver: { jaBan: number; jaKa: number; kaBan: number };
  kai: number;
  total: number;
} {
  return {
    tanggal: "",
    gold: { jaBan: 0, jaKa: 0, kaBan: 0 },
    silver: { jaBan: 0, jaKa: 0, kaBan: 0 },
    kai: 0,
    total: 0,
  };
}

/**
 * Calculate total for a sales row
 */
export function calculateRowTotal(row: {
  gold: { jaBan: number; jaKa: number; kaBan: number };
  silver: { jaBan: number; jaKa: number; kaBan: number };
  kai: number;
}): number {
  return (
    row.gold.jaBan +
    row.gold.jaKa +
    row.gold.kaBan +
    row.silver.jaBan +
    row.silver.jaKa +
    row.silver.kaBan +
    row.kai
  );
}

/**
 * Add sales count to appropriate row field based on category and type
 */
export function addSalesToRow(
  row: {
    gold: { jaBan: number; jaKa: number; kaBan: number };
    silver: { jaBan: number; jaKa: number; kaBan: number };
    kai: number;
  },
  categoryCode: string,
  typeCode: string,
  count: number
): void {
  const normalizedCategory = normalizeCategoryCode(categoryCode);
  const normalizedType = normalizeTypeCode(typeCode);

  if (normalizedCategory === "GOLD") {
    if (normalizedType === "JaBan") row.gold.jaBan += count;
    else if (normalizedType === "JaKa") row.gold.jaKa += count;
    else if (normalizedType === "KaBan") row.gold.kaBan += count;
  } else if (normalizedCategory === "SILVER") {
    if (normalizedType === "JaBan") row.silver.jaBan += count;
    else if (normalizedType === "JaKa") row.silver.jaKa += count;
    else if (normalizedType === "KaBan") row.silver.kaBan += count;
  } else if (normalizedCategory === "KAI" || normalizedCategory === "FWC-KAI") {
    row.kai += count;
  }
}

/**
 * Calculate totals from multiple rows
 */
export function calculateTotalsFromRows(rows: Array<{
  gold: { jaBan: number; jaKa: number; kaBan: number };
  silver: { jaBan: number; jaKa: number; kaBan: number };
  kai: number;
}>): {
  gold: { jaBan: number; jaKa: number; kaBan: number };
  silver: { jaBan: number; jaKa: number; kaBan: number };
  kai: number;
  total: number;
} {
  const totals = {
    gold: { jaBan: 0, jaKa: 0, kaBan: 0 },
    silver: { jaBan: 0, jaKa: 0, kaBan: 0 },
    kai: 0,
    total: 0,
  };

  rows.forEach((row) => {
    totals.gold.jaBan += row.gold.jaBan;
    totals.gold.jaKa += row.gold.jaKa;
    totals.gold.kaBan += row.gold.kaBan;
    totals.silver.jaBan += row.silver.jaBan;
    totals.silver.jaKa += row.silver.jaKa;
    totals.silver.kaBan += row.silver.kaBan;
    totals.kai += row.kai;
  });

  totals.total = calculateRowTotal(totals);
  return totals;
}

/**
 * Parse date string (YYYY-MM-DD) to Date object in local timezone
 * This avoids timezone conversion issues when using new Date("YYYY-MM-DD")
 */
export function parseDateString(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

/**
 * Parse date string (YYYY-MM-DD) to Date object in local timezone for end of day
 */
export function parseDateStringEnd(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day, 23, 59, 59, 999);
}

/**
 * Format date to YYYY-MM-DD string in local timezone
 */
export function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get date keys for today, yesterday, and dayBeforeYesterday
 */
export function getDateKeys(): {
  today: Date;
  yesterday: Date;
  dayBeforeYesterday: Date;
  todayKey: string;
  yesterdayKey: string;
} {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const dayBeforeYesterday = new Date(today);
  dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);

  return {
    today,
    yesterday,
    dayBeforeYesterday,
    todayKey: formatDateString(today),
    yesterdayKey: formatDateString(yesterday),
  };
}

