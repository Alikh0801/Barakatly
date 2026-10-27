import type { ProductListItem, ProductVariant } from "@/types/shop";
import type { UnitType } from "@/types";
import { getDisplayPrice, unitLabel } from "@/lib/shop/format";
import { decimal, formatQuantity, quantityHasUnit } from "@/lib/shop/quantity";

/**
 * Embed for product selects: a product's sizes. Every product has at least
 * one (migration 20261027120000).
 */
export const VARIANTS_SELECT = `
  variants:product_variants (
    id,
    unit_type,
    unit_size,
    farmer_price,
    final_price,
    quantity_available,
    in_stock,
    sort_order,
    image_url
  )
`;

type ProductLike = Pick<
  ProductListItem,
  "id" | "unit_type" | "unit_size" | "farmer_price" | "final_price" | "quantity_available" | "in_stock"
> & { variants?: ProductVariant[] | null };

/**
 * The product's sizes in button order. A product read without its sizes
 * (or saved before they existed) counts as one size built from its own
 * columns, with an empty id.
 */
export function productVariants(product: ProductLike): ProductVariant[] {
  const variants = product.variants ?? [];
  if (variants.length > 0) {
    return [...variants]
      .map((variant) => ({
        ...variant,
        farmer_price: Number(variant.farmer_price),
        final_price: variant.final_price == null ? null : Number(variant.final_price),
        quantity_available: Number(variant.quantity_available),
      }))
      .sort((a, b) => a.sort_order - b.sort_order);
  }
  return [
    {
      id: "",
      unit_type: product.unit_type,
      unit_size: product.unit_size,
      farmer_price: Number(product.farmer_price),
      final_price: product.final_price == null ? null : Number(product.final_price),
      quantity_available: Number(product.quantity_available),
      in_stock: product.in_stock,
      sort_order: 0,
      image_url: null,
    },
  ];
}

export function variantInStock(variant: ProductVariant): boolean {
  return variant.in_stock && variant.quantity_available > 0;
}

/** The size picked at first: the first in stock, else the first. */
export function defaultVariant(variants: ProductVariant[]): ProductVariant {
  return variants.find(variantInStock) ?? variants[0];
}

export function variantPrice(variant: ProductVariant): number {
  return getDisplayPrice(variant.final_price, variant.farmer_price);
}

/** A jar sold by weight: its size is just "kq" and its amounts are kilograms. */
export function isSoldByWeight(unit: UnitType, size: string | null | undefined): boolean {
  return unit === "jar" && size === "kq";
}

/** The size button: "banka (kq)", "banka 1,5 kq", "kq", "ədəd". */
export function variantLabel(unit: UnitType, size: string | null | undefined): string {
  if (isSoldByWeight(unit, size)) return unitLabel(unit, size);
  const label = unitLabel(unit);
  return size ? `${label} ${size}` : label;
}

/** Stock in the size's own terms: "4 kq" for a jar sold by weight, "4 banka" for fixed jars. */
export function formatStock(unit: UnitType, quantity: number, size: string | null | undefined): string {
  if (isSoldByWeight(unit, size)) return `${decimal(quantity)} kq`;
  if (quantityHasUnit(unit)) return formatQuantity(unit, quantity);
  return `${decimal(quantity)} ${unitLabel(unit)}`;
}
