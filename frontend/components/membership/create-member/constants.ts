/** Base input className for form inputs */
export const baseInputClass =
  "h-10 w-full rounded-md border border-gray-300 px-3 text-sm text-gray-700 focus:border-gray-400 focus:outline-none";

export const SERIAL_PREFIX_LEN = 4;

export function getTodayLocalDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function calculateExpiredDate(
  purchasedDate: string,
  masaBerlaku: number
): string {
  if (!purchasedDate || !masaBerlaku) return "";
  const date = new Date(purchasedDate);
  date.setDate(date.getDate() + masaBerlaku);
  return date.toISOString().split("T")[0];
}
