/**
 * Cleans the input by removing all non-digits.
 */
export function cleanHN(hn: string): string {
  return hn.replace(/\D/g, '');
}

/**
 * Formats a clean 10-digit HN starting with 07 into the standard 07-XX-XXXXXX.
 * If input is incomplete, formats as much as possible to help typing.
 */
export function formatHN(hn: string): string {
  const digits = cleanHN(hn);
  
  if (digits.length <= 2) {
    return digits;
  }
  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  }
  return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4, 10)}`;
}

/**
 * Validates whether the HN is correct:
 * - Must start with 07
 * - Must have exactly 10 digits
 */
export function isValidHN(hn: string): boolean {
  const digits = cleanHN(hn);
  return digits.startsWith('07') && digits.length === 10;
}

/**
 * Normalizes any user-entered HN to 07-XX-XXXXXX if valid, otherwise returns input.
 */
export function normalizeHN(hn: string): string {
  if (isValidHN(hn)) {
    return formatHN(hn);
  }
  return hn;
}
