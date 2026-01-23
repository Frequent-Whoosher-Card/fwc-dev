import { ValidationError } from "./errors";

/**
 * Smart parses a serial input string.
 * Supports both FWC (Template + YY + Suffix) and Voucher (Template + YYMMDD + Suffix)
 */
export function parseSmartSerial(
  input: string,
  template: string,
  dateSuffix: string, // Can be "YY" or "YYMMDD"
  maxSuffixLength = 5,
): number {
  // 1. Basic digit check (Legacy behavior)
  if (input.length <= 8) {
    if (!/^\d+$/.test(input)) {
      throw new ValidationError(`Input suffix '${input}' harus berupa angka.`);
    }
    return Number(input);
  }

  // 2. If long, MUST match prefix
  const prefix = `${template}${dateSuffix}`;
  if (!input.startsWith(prefix)) {
    // Fallback: If pure digits and long, maybe just treated as suffix?
    // But for range generation, being strict is better.
    if (/^\d+$/.test(input)) {
      return Number(input);
    }

    throw new ValidationError(
      `Input serial '${input}' tidak cocok dengan format produk ini. Harap masukkan nomor urut (suffix) saja, atau serial lengkap yang valid (${prefix}...).`,
    );
  }

  // 3. Extract suffix
  const suffixPart = input.slice(prefix.length);

  // Ensure suffix is valid
  if (!/^\d+$/.test(suffixPart)) {
    throw new ValidationError(
      `Bagian suffix dari serial '${input}' tidak valid (harus angka).`,
    );
  }

  return Number(suffixPart);
}
