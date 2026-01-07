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
  // 1. Basic digit check (Legacy behavior, but now we allow alphanumeric IF it matches prefix)
  // We don't throw immediately if not digit.

  // 2. If short, assume it's just the suffix.
  // For suffix, we expect DIGITS generally, but let's be strict: Suffix IS digits.
  // Input: "123" -> OK. "ABC" -> Logic below will check if it matches prefix.
  if (input.length <= 8) {
    if (!/^\d+$/.test(input)) {
      throw new ValidationError(`Input suffix '${input}' harus berupa angka.`);
    }
    return Number(input);
  }

  // 3. If long, MUST match prefix
  const prefix = `${template}${yearSuffix}`;
  if (!input.startsWith(prefix)) {
    // If it doesn't match prefix, checks if it is just a very long number?
    // If user inputs "123456789", we might treat as suffix if digits.
    if (/^\d+$/.test(input)) {
      // Ambiguous case: Long digits input.
      // Is it a suffix (e.g. 100000) or a typo'd full serial?
      // Let's assume purely digits input that is long is just a suffix (Number(input)).
      return Number(input);
    }

    throw new ValidationError(
      `Input serial '${input}' tidak cocok dengan format produk ini. Harap masukkan nomor urut (suffix) saja, atau serial lengkap yang valid (${prefix}...).`
    );
  }

  // 4. Extract suffix
  const suffixPart = input.slice(prefix.length);

  // Ensure suffix is valid
  if (!/^\d+$/.test(suffixPart)) {
    throw new ValidationError(
      `Bagian suffix dari serial '${input}' tidak valid (harus angka).`
    );
  }

  return Number(suffixPart);
}
