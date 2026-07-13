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

export function formatUnit(unit: UnitType): string {
  switch (unit) {
    case "kg":
      return "/kq";
    case "piece":
      return "/ədəd";
    case "liter":
      return "/litr";
    default:
      return "";
  }
}

export function getProductImageUrl(
  images: { url: string; sort_order: number }[]
): string | null {
  if (!images.length) return null;
  return [...images].sort((a, b) => a.sort_order - b.sort_order)[0]?.url ?? null;
}
