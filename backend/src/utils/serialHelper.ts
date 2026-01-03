import { ValidationError } from "./errors";

/**
 * Smart parses a serial input string.
 * If input is short (<= maxSuffixLength), it returns it as is (assumed suffix).
 * If input is long, it checks if it matches prefix (Template + Year).
 *   If match, returns the suffix part.
 *   If no match, throws ValidationError.
 */
export function parseSmartSerial(
  input: string,
  template: string,
  yearSuffix: string,
  maxSuffixLength = 5
): number {
  // 1. Basic digit check
  if (!/^\d+$/.test(input)) {
    throw new ValidationError(`Input serial '${input}' harus berupa angka.`);
  }

  // 2. If short, assume it's just the suffix (Number)
  // We use a safe threshold, e.g., 8 digits is definitely not a full serial (Template 4 + Year 2 + Suffix 5 = 11 digits minimum usually)
  // Let's stick to logic: If it's short enough to be a suffix (e.g. <= 8 digits, allowing for large batch sizes if needed, though usually 5)
  // or explicitly if it doesn't start with template.

  // Logic from plan:
  // If input length <= 8: Treat as suffix.
  if (input.length <= 8) {
    return Number(input);
  }

  // 3. If long, MUST match prefix
  const prefix = `${template}${yearSuffix}`;
  if (!input.startsWith(prefix)) {
    throw new ValidationError(
      `Input serial '${input}' tidak cocok dengan format produk ini. Harap masukkan nomor urut (suffix) saja, atau serial lengkap yang valid (${prefix}...).`
    );
  }

  // 4. Extract suffix
  const suffixPart = input.slice(prefix.length);

  // Ensure suffix is valid
  if (!/^\d+$/.test(suffixPart)) {
    throw new ValidationError(
      `Bagian suffix dari serial '${input}' tidak valid.`
    );
  }

  return Number(suffixPart);
}
