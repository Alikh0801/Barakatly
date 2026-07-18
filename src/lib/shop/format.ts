import type { UnitType } from "@/types";

export function getDisplayPrice(
  finalPrice: number | null,
  farmerPrice: number
): number {
  return finalPrice ?? farmerPrice;
}

/** Suggest customer price so farmer share stays near 60% (60-20-20 guideline). */
export function suggestFinalPrice(farmerPrice: number): number {
  if (!(farmerPrice > 0)) return 0;
  return Math.round((farmerPrice / 0.6) * 100) / 100;
}

export function formatPrice(amount: number): string {
  return `${amount.toFixed(2)} ₼`;
}

export function unitLabel(unit: UnitType): string {
  switch (unit) {
    case "kg":
      return "kq";
    case "piece":
      return "ədəd";
    case "liter":
      return "litr";
    default:
      return "";
  }
}

export function formatUnit(unit: UnitType): string {
  const label = unitLabel(unit);
  return label ? `/${label}` : "";
}

export function getProductImageUrl(
  images: { url: string; sort_order: number }[]
): string | null {
  if (!images.length) return null;
  return [...images].sort((a, b) => a.sort_order - b.sort_order)[0]?.url ?? null;
}
