/** PostgREST may return a to-one embed as an object or a one-element array. */
export function firstPayment<T>(
  payments: T | T[] | null | undefined,
): T | null {
  if (!payments) return null;
  if (Array.isArray(payments)) return payments[0] ?? null;
  return payments;
}
