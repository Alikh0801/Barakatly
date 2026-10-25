/** PostgREST may return a to-one embed as an object or a one-element array. */
export function firstPayment<T>(
  payments: T | T[] | null | undefined,
): T | null {
  if (!payments) return null;
  if (Array.isArray(payments)) return payments[0] ?? null;
  return payments;
}

/** "•••• 5678" — the customer sees only the card's last four digits. */
export function maskedPanLastFour(pan: string | null | undefined): string | null {
  const digits = (pan ?? "").replace(/\D/g, "");
  return digits.length >= 4 ? `•••• ${digits.slice(-4)}` : null;
}
