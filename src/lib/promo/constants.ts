/** The code the customer applied in the cart, read again at checkout. */
export const PROMO_COOKIE = "promo_code";
export const PROMO_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export const PROMO_CODE_PATTERN = /^[A-Z0-9_-]{3,30}$/;

/** A code as the cart and checkout show it. */
export type AppliedPromo = {
  code: string;
  name: string | null;
  /** 0 when `error` is set. */
  discount: number;
  /** Why the code doesn't work right now, in Azerbaijani; null if it does. */
  error: string | null;
};

export function normalizePromoCode(value: string): string {
  return value.trim().toUpperCase();
}

/** check_promo_code() / place_order() error codes → customer-facing text. */
export function describePromoError(code: string, minOrder?: number | null): string {
  switch (code) {
    case "EXPIRED":
      return "Bu promokodun istifadə müddəti bitib.";
    case "MIN_ORDER":
      return minOrder
        ? `Bu promokod ${Number(minOrder).toFixed(2)} ₼ və daha çox məbləğli sifarişlər üçündür.`
        : "Sifariş məbləği bu promokod üçün kifayət deyil.";
    case "USED_UP":
      return "Bu promokodun istifadə limiti dolub.";
    case "ALREADY_USED":
      return "Bu promokoddan artıq istifadə etmisiniz.";
    case "NOT_SIGNED_IN":
      return "Promokod tətbiq etmək üçün daxil olun.";
    default:
      return "Belə promokod yoxdur və ya artıq aktiv deyil.";
  }
}
