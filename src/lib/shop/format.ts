import type { UnitType } from "@/types";

export function getDisplayPrice(
  finalPrice: number | null,
  farmerPrice: number
): number {
  return finalPrice ?? farmerPrice;
}

export function formatPrice(amount: number): string {
  return `${amount.toFixed(2)} ₼`;
}

/** Every selling unit, in the order the product forms offer them. */
export const UNIT_TYPES: UnitType[] = ["kg", "piece", "liter", "jar", "glass", "bunch"];

export function isUnitType(value: string): value is UnitType {
  return (UNIT_TYPES as string[]).includes(value);
}

export function unitLabel(unit: UnitType): string {
  switch (unit) {
    case "kg":
      return "kq";
    case "piece":
      return "ədəd";
    case "liter":
      return "litr";
    case "jar":
      return "banka";
    case "glass":
      return "stəkan";
    case "bunch":
      return "dəstə";
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
