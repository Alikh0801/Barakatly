"use client";

import { usePathname, useRouter } from "next/navigation";
import { useOptimistic, useState, useTransition } from "react";
import { addToCart, buyNow } from "@/lib/cart/actions";
import type { ProductDetail, ProductVariant } from "@/types/shop";
import { formatPrice, unitLabel } from "@/lib/shop/format";
import {
  WEIGHT_PRESETS,
  baseMinQuantity,
  formatAmount,
  formatQuantity,
  initialQuantity,
  minOrderQuantity,
  quantityHasUnit,
} from "@/lib/shop/quantity";
import {
  formatStock,
  isSoldByWeight,
  variantInStock,
  variantLabel,
  variantPrice,
} from "@/lib/shop/variants";
import { useProductVariant } from "@/components/shop/ProductVariantContext";
import { QuantityInput } from "@/components/ui/QuantityInput";
import { Spinner } from "@/components/ui/Spinner";

/** The size cards: label, price and stock; a sold-out size can't be picked. */
function VariantPicker() {
  const { variants, selected, select } = useProductVariant();
  if (variants.length < 2) return null;

  return (
    <div className="mt-6">
      <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Ölçü seçin</span>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {variants.map((variant) => {
          const available = variantInStock(variant);
          const active = variant.id === selected.id;
          return (
            <button
              key={variant.id}
              type="button"
              onClick={() => select(variant.id)}
              disabled={!available}
              aria-pressed={active}
              className={[
                "rounded-xl px-3 py-2.5 text-left ring-1 transition",
                !available
                  ? "cursor-not-allowed bg-zinc-100 text-zinc-400 ring-zinc-200"
                  : active
                    ? "bg-emerald-50 text-emerald-900 ring-2 ring-emerald-600"
                    : "bg-white text-zinc-800 ring-zinc-200 hover:ring-emerald-300",
              ].join(" ")}
            >
              <span className={`block text-sm font-semibold ${available ? "" : "line-through"}`}>
                {variantLabel(variant.unit_type, variant.unit_size)}
              </span>
              <span className={`mt-0.5 block text-sm ${available ? "" : "line-through"}`}>
                {formatPrice(variantPrice(variant))}
              </span>
              <span className="mt-0.5 block text-xs">
                {available
                  ? `Stokda: ${formatStock(variant.unit_type, variant.quantity_available, variant.unit_size)}`
                  : "Bitib"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** The unit word beside a whole-number amount: "kq" for a jar sold by weight, else "banka". */
function amountSuffix(variant: ProductVariant): string | null {
  if (quantityHasUnit(variant.unit_type)) return null;
  return isSoldByWeight(variant.unit_type, variant.unit_size) ? "kq" : unitLabel(variant.unit_type);
}

function PurchaseControls({
  product,
  variant,
  showSize,
}: {
  product: ProductDetail;
  variant: ProductVariant;
  showSize: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const unit = variant.unit_type;
  const stock = variant.quantity_available || 0;
  const minQty = minOrderQuantity(unit, product.min_order_quantity);
  const [quantity, setQuantity] = useState(() => initialQuantity(unit, minQty, stock) || minQty);
  const [added, setAdded] = useState(false);
  // Which button is waiting; both fall back to false when the action ends.
  const [adding, setAdding] = useOptimistic(false);
  const [buying, setBuying] = useOptimistic(false);

  const price = variantPrice(variant);
  const lineTotal = price * quantity;
  // Less left than the farmer's minimum can't be ordered either.
  const outOfStock = !variantInStock(variant) || stock < minQty;
  const presets =
    unit === "kg" ? WEIGHT_PRESETS.filter((amount) => amount >= minQty && amount <= stock) : [];
  const stockLabel = formatStock(unit, stock, variant.unit_size);
  const suffix = amountSuffix(variant);

  function handleAddToCart() {
    if (outOfStock) return;
    startTransition(async () => {
      setAdding(true);
      const result = await addToCart(product.id, quantity, variant.id || undefined);
      if (result.needsAuth) {
        router.push(`/signin?next=${encodeURIComponent(pathname)}`);
        return;
      }
      if (result.ok) {
        setAdded(true);
        window.setTimeout(() => setAdded(false), 1800);
      }
    });
  }

  function handleBuyNow() {
    if (outOfStock) return;
    startTransition(async () => {
      // Spins until checkout has replaced this page; buyNow redirects there.
      setBuying(true);
      await buyNow(product.id, quantity, variant.id || undefined);
    });
  }

  return (
    <div className="mt-6 rounded-2xl bg-zinc-50 p-5 ring-1 ring-zinc-100">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Miqdar
        </span>
        <div className="flex items-center gap-2">
          <QuantityInput
            value={quantity}
            unit={unit}
            min={minQty}
            max={stock}
            onCommit={setQuantity}
            disabled={outOfStock}
            commitWhileTyping
          />
          {suffix ? <span className="text-sm font-medium text-zinc-600">{suffix}</span> : null}
        </div>
      </div>
      {presets.length > 0 && !outOfStock ? (
        <div className="mt-3 flex flex-wrap justify-end gap-2">
          {presets.map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => setQuantity(amount)}
              aria-pressed={quantity === amount}
              className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 transition ${
                quantity === amount
                  ? "bg-emerald-600 text-white ring-emerald-600"
                  : "bg-white text-zinc-700 ring-zinc-200 hover:bg-zinc-50"
              }`}
            >
              {formatQuantity(unit, amount)}
            </button>
          ))}
        </div>
      ) : null}
      <p className="mt-1.5 text-sm text-zinc-500">
        {outOfStock ? "Stokda yoxdur" : `Anbarda ${stockLabel} qalıb`}
        {!outOfStock && minQty > baseMinQuantity(unit) ? (
          <span> · Minimum sifariş: {formatAmount(unit, minQty, variant.unit_size)}</span>
        ) : null}
        {!outOfStock && showSize ? (
          <span> · seçilmiş ölçü: {variantLabel(unit, variant.unit_size)}</span>
        ) : null}
      </p>

      <div className="mt-4 border-t border-zinc-200 pt-4">
        <div className="text-sm text-zinc-500">Cəmi</div>
        <div className="mt-1 text-2xl font-semibold text-zinc-900">
          {formatPrice(lineTotal)}
        </div>
      </div>

      {outOfStock ? (
        <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200">
          {showSize ? "Bu ölçü hazırda stokda yoxdur." : "Bu məhsul hazırda stokda yoxdur."}
        </p>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={pending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3.5 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-200 transition hover:bg-emerald-50 disabled:opacity-60"
          >
            {adding ? <Spinner className="h-4 w-4" /> : null}
            {added ? "Əlavə olundu" : "Səbətə at"}
          </button>
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={pending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60"
          >
            {buying ? <Spinner className="h-4 w-4" /> : null}
            İndi al
          </button>
        </div>
      )}
    </div>
  );
}

export function ProductPurchasePanel({ product }: { product: ProductDetail }) {
  const { variants, selected } = useProductVariant();
  const allSoldOut = !variants.some(variantInStock);

  return (
    <>
      <VariantPicker />
      {allSoldOut && variants.length > 1 ? (
        <p className="mt-6 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200">
          Stokda qalmayıb.
        </p>
      ) : (
        // Keyed by size: picking another one starts its quantity afresh.
        <PurchaseControls
          key={selected.id}
          product={product}
          variant={selected}
          showSize={variants.length > 1}
        />
      )}
    </>
  );
}
