import type { UnitType } from "@/types";
import { unitLabel } from "@/lib/shop/format";

/**
 * How much a customer may order of a product. Weight goes in 50 qr steps,
 * volume in 0,5 l steps, everything else in whole units. A farmer may set a
 * higher minimum per product (products.min_order_quantity).
 *
 * Quantities are kept in the product's unit (kq, litr, banka…) with two
 * decimals, as the database stores them. Rounding works in hundredths so
 * 0,05 steps don't drift.
 */

const STEP_HUNDREDTHS: Partial<Record<UnitType, number>> = { kg: 5, liter: 50 };

/** 0.05 for kq, 0.5 for litr, 1 otherwise. */
export function quantityStep(unit: UnitType): number {
  return (STEP_HUNDREDTHS[unit] ?? 100) / 100;
}

/** The smallest order a farmer's minimum may not go under. */
export function baseMinQuantity(unit: UnitType): number {
  return quantityStep(unit);
}

/** The product's minimum, never below one step. */
export function minOrderQuantity(unit: UnitType, productMin?: number | string | null): number {
  const min = Number(productMin ?? 0);
  return Math.max(baseMinQuantity(unit), Number.isFinite(min) ? min : 0);
}

/** Whether `value` is a whole number of steps for the unit. */
export function isOnStep(unit: UnitType, value: number): boolean {
  const hundredths = Math.round(value * 100);
  return Math.abs(value * 100 - hundredths) < 1e-6 && hundredths % (STEP_HUNDREDTHS[unit] ?? 100) === 0;
}

function roundToStep(unit: UnitType, value: number, mode: "nearest" | "down"): number {
  const step = STEP_HUNDREDTHS[unit] ?? 100;
  const steps = (value * 100) / step;
  const whole = mode === "down" ? Math.floor(steps + 1e-9) : Math.round(steps);
  return (whole * step) / 100;
}

/**
 * The quantity actually ordered: on a step, at least the minimum, at most
 * the stock (rounded down to a step). Returns 0 when the stock is below the
 * minimum.
 */
export function normalizeQuantity(
  unit: UnitType,
  value: number,
  { min, max }: { min: number; max: number },
): number {
  const top = roundToStep(unit, max, "down");
  if (top < min) return 0;
  const rounded = roundToStep(unit, Number.isFinite(value) ? value : min, "nearest");
  return Math.min(top, Math.max(min, rounded));
}

/** Where a fresh quantity picker starts: 1 of the unit, or the minimum when higher. */
export function initialQuantity(unit: UnitType, min: number, max: number): number {
  return normalizeQuantity(unit, Math.max(1, min), { min, max });
}

/** "0,75" — Azerbaijani decimal comma, no trailing zeros. */
function decimal(value: number): string {
  return String(Math.round(value * 100) / 100).replace(".", ",");
}

/**
 * "750 qr" / "1,25 kq", "0,5 l", "3" — for the quantity picker and order
 * lines. Units other than weight and volume show the bare number; the unit
 * label goes next to it as before.
 */
export function formatQuantity(unit: UnitType, value: number | string): string {
  const quantity = Number(value);
  if (unit === "kg") {
    return quantity < 1 ? `${Math.round(quantity * 1000)} qr` : `${decimal(quantity)} kq`;
  }
  if (unit === "liter") return `${decimal(quantity)} l`;
  return decimal(quantity);
}

/** Whether formatQuantity already names the unit. */
export function quantityHasUnit(unit: UnitType): boolean {
  return unit === "kg" || unit === "liter";
}

/** "750 qr", "1,5 l", "3 banka (0,5 kq)" — an amount with its unit. */
export function formatAmount(unit: UnitType, value: number | string, size?: string | null): string {
  const amount = formatQuantity(unit, value);
  return quantityHasUnit(unit) ? amount : `${amount} ${unitLabel(unit, size)}`;
}

/**
 * Reads what a customer typed: "750", "750 qr", "0,75", "1.5 kq" for weight
 * (a bare number above 20 is taken as grams), "0,5" or "1 l" for volume.
 */
export function parseQuantity(unit: UnitType, text: string): number | null {
  const cleaned = text.trim().toLowerCase().replace(",", ".");
  const match = cleaned.match(/^(\d+(?:\.\d+)?)\s*([a-zəığüöşç.]*)$/);
  if (!match) return null;
  const amount = Number(match[1]);
  const suffix = match[2];
  if (!Number.isFinite(amount)) return null;
  if (unit === "kg") {
    if (suffix.startsWith("q") && !suffix.startsWith("kq")) return amount / 1000;
    if (suffix.startsWith("g")) return amount / 1000;
    if (!suffix && amount > 20) return amount / 1000;
  }
  return amount;
}

/** Quick picks shown under the weight picker. */
export const WEIGHT_PRESETS = [0.25, 0.5, 1, 2];

/**
 * The farmer's minimum-order field: grams for weight, litres or whole units
 * otherwise. Returns the minimum in the product's unit, null for none, or
 * "invalid" when it isn't on a step.
 */
export function parseMinOrderInput(unit: UnitType, raw: string): number | null | "invalid" {
  const text = raw.trim().replace(",", ".");
  if (!text) return null;
  const amount = Number(text);
  if (!Number.isFinite(amount) || amount <= 0) return "invalid";
  const quantity = unit === "kg" ? amount / 1000 : amount;
  if (!isOnStep(unit, quantity) || quantity < baseMinQuantity(unit)) return "invalid";
  // The site's own floor needs no record.
  return quantity === baseMinQuantity(unit) ? null : quantity;
}
