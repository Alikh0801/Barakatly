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

/**
 * Package sizes a unit can come in. A jar or glass always has one; a piece
 * may (whole birds sold by weight range).
 */
export const UNIT_SIZES: Partial<Record<UnitType, string[]>> = {
  jar: ["0,2 kq", "0,5 kq", "0,7 kq", "0,8 kq", "0,9 kq", "1 kq", "1,5 kq", "2 kq", "3 kq"],
  glass: ["10 qr", "25 qr", "30 qr"],
  piece: ["0,65–0,9 kq", "1–1,3 kq", "1–1,5 kq"],
};

/** Units sold only with a size picked. */
export const SIZE_REQUIRED_UNITS: UnitType[] = ["jar", "glass"];

/**
 * Checks a size from a form against the unit: "" for none, the size when
 * allowed, or null when it isn't.
 */
export function parseUnitSize(unit: UnitType, value: string): string | null {
  const size = value.trim();
  if (!size) return SIZE_REQUIRED_UNITS.includes(unit) ? null : "";
  return UNIT_SIZES[unit]?.includes(size) ? size : null;
}

/** "banka", or "banka (0,5 kq)" with a size. */
export function unitLabel(unit: UnitType, size?: string | null): string {
  const label = baseUnitLabel(unit);
  return label && size ? `${label} (${size})` : label;
}

function baseUnitLabel(unit: UnitType): string {
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

export function formatUnit(unit: UnitType, size?: string | null): string {
  const label = unitLabel(unit, size);
  return label ? `/${label}` : "";
}

export function getProductImageUrl(
  images: { url: string; sort_order: number }[]
): string | null {
  if (!images.length) return null;
  return [...images].sort((a, b) => a.sort_order - b.sort_order)[0]?.url ?? null;
}
