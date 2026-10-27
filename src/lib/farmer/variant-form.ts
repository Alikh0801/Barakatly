import type { UnitType } from "@/types";
import { isUnitType, parseUnitSize } from "@/lib/shop/format";

/** Most sizes one product may have. */
export const MAX_PRODUCT_VARIANTS = 8;

/** One row of the farmer form's sizes, as the browser sends it (JSON in "variants"). */
export type VariantFormRow = {
  /** Set for a size that already exists. */
  id?: string;
  unit_type: string;
  unit_size: string;
  farmer_price: string;
  quantity_available: string;
  /** Which of the product's photos this size shows ("" for none). */
  image_index: string;
};

export type ParsedVariant = {
  id: string | null;
  unit_type: UnitType;
  unit_size: string | null;
  farmer_price: number;
  quantity_available: number;
  image_index: number | null;
  sort_order: number;
};

/** Reads and checks the sizes from the form; returns an error message when one is wrong. */
export function parseVariantRows(raw: string): ParsedVariant[] | { error: string } {
  let rows: unknown;
  try {
    rows = JSON.parse(raw || "[]");
  } catch {
    return { error: "Ölçülər oxunmadı." };
  }
  if (!Array.isArray(rows) || rows.length === 0) {
    return { error: "Ən azı bir ölçü əlavə edin." };
  }
  if (rows.length > MAX_PRODUCT_VARIANTS) {
    return { error: `Ən çox ${MAX_PRODUCT_VARIANTS} ölçü əlavə edə bilərsiniz.` };
  }

  const parsed: ParsedVariant[] = [];
  const seen = new Set<string>();
  for (const [index, value] of rows.entries()) {
    const row = (value ?? {}) as Partial<VariantFormRow>;
    const unit = String(row.unit_type ?? "").trim();
    if (!isUnitType(unit)) return { error: "Vahid tipi yanlışdır." };
    const size = parseUnitSize(unit, String(row.unit_size ?? ""));
    if (size === null) return { error: "Hər ölçü üçün ölçünü seçin." };

    const key = `${unit}|${size}`;
    if (seen.has(key)) return { error: "Eyni ölçü iki dəfə əlavə olunub." };
    seen.add(key);

    const price = Number(String(row.farmer_price ?? "").replace(",", "."));
    const quantity = Number(String(row.quantity_available ?? "").replace(",", ".") || 0);
    if (!(price > 0) || !(quantity >= 0) || !Number.isFinite(price) || !Number.isFinite(quantity)) {
      return { error: "Qiymət və miqdar düzgün deyil." };
    }

    const imageIndex = String(row.image_index ?? "").trim();
    parsed.push({
      id: typeof row.id === "string" && row.id ? row.id : null,
      unit_type: unit,
      unit_size: size || null,
      farmer_price: Math.round(price * 100) / 100,
      quantity_available: Math.round(quantity * 100) / 100,
      image_index: imageIndex === "" ? null : Number(imageIndex),
      sort_order: index,
    });
  }
  return parsed;
}
