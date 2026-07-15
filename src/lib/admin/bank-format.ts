/** Keep only digits from a PAN/card input. */
export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/** Format as 16-digit groups: XXXX XXXX XXXX XXXX */
export function formatPanDisplay(value: string): string {
  const digits = digitsOnly(value).slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

/** Validate and normalize a 16-digit card number for storage. */
export function normalizePan(value: string): string | null {
  const digits = digitsOnly(value);
  if (digits.length !== 16) return null;
  return digits.replace(/(\d{4})(?=\d)/g, "$1-");
}
