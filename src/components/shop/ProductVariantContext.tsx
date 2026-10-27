"use client";

import { createContext, useContext, useState } from "react";
import type { ProductVariant } from "@/types/shop";
import { defaultVariant } from "@/lib/shop/variants";
import { formatPrice, formatUnit } from "@/lib/shop/format";
import { variantPrice } from "@/lib/shop/variants";

type VariantState = {
  variants: ProductVariant[];
  selected: ProductVariant;
  select: (id: string) => void;
};

const VariantContext = createContext<VariantState | null>(null);

/**
 * The size picked on the product page, shared by the price, the photo and
 * the purchase panel. Starts at the first size in stock.
 */
export function ProductVariantProvider({
  variants,
  children,
}: {
  variants: ProductVariant[];
  children: React.ReactNode;
}) {
  const [selectedId, setSelectedId] = useState(() => defaultVariant(variants).id);
  const selected = variants.find((variant) => variant.id === selectedId) ?? defaultVariant(variants);

  return (
    <VariantContext.Provider value={{ variants, selected, select: setSelectedId }}>
      {children}
    </VariantContext.Provider>
  );
}

export function useProductVariant(): VariantState {
  const state = useContext(VariantContext);
  if (!state) throw new Error("useProductVariant needs a ProductVariantProvider.");
  return state;
}

/** Null outside a provider, for components also used without one. */
export function useOptionalProductVariant(): VariantState | null {
  return useContext(VariantContext);
}

/** "6.00 ₼ /banka (1,5 kq)" for the picked size. */
export function ProductVariantPrice() {
  const { selected } = useProductVariant();
  return (
    <div className="mt-5 flex items-baseline gap-2">
      <span className="text-3xl font-semibold text-zinc-900">{formatPrice(variantPrice(selected))}</span>
      <span className="text-sm text-zinc-500">{formatUnit(selected.unit_type, selected.unit_size)}</span>
    </div>
  );
}
