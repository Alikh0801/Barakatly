"use client";

import { usePathname, useRouter } from "next/navigation";
import { useOptimistic, useState, useTransition } from "react";
import { addToCart, buyNow } from "@/lib/cart/actions";
import type { ProductDetail } from "@/types/shop";
import { formatPrice, getDisplayPrice } from "@/lib/shop/format";
import {
  WEIGHT_PRESETS,
  baseMinQuantity,
  formatAmount,
  formatQuantity,
  initialQuantity,
  minOrderQuantity,
} from "@/lib/shop/quantity";
import { QuantityInput } from "@/components/ui/QuantityInput";
import { Spinner } from "@/components/ui/Spinner";

export function ProductPurchasePanel({ product }: { product: ProductDetail }) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const unit = product.unit_type;
  const stock = Number(product.quantity_available) || 0;
  const minQty = minOrderQuantity(unit, product.min_order_quantity);
  const [quantity, setQuantity] = useState(() => initialQuantity(unit, minQty, stock) || minQty);
  const [added, setAdded] = useState(false);
  // Which button is waiting; both fall back to false when the action ends.
  const [adding, setAdding] = useOptimistic(false);
  const [buying, setBuying] = useOptimistic(false);

  const price = getDisplayPrice(product.final_price, product.farmer_price);
  const lineTotal = price * quantity;
  // Less left than the farmer's minimum can't be ordered either.
  const outOfStock = !product.in_stock || stock < minQty;
  const presets =
    unit === "kg" ? WEIGHT_PRESETS.filter((amount) => amount >= minQty && amount <= stock) : [];
  const stockLabel = formatAmount(unit, stock, product.unit_size);

  function handleAddToCart() {
    if (outOfStock) return;
    startTransition(async () => {
      setAdding(true);
      const result = await addToCart(product.id, quantity);
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
      await buyNow(product.id, quantity);
    });
  }

  return (
    <div className="mt-6 rounded-2xl bg-zinc-50 p-5 ring-1 ring-zinc-100">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Miqdar
        </span>
        <QuantityInput
          value={quantity}
          unit={unit}
          min={minQty}
          max={stock}
          onCommit={setQuantity}
          disabled={outOfStock}
          commitWhileTyping
        />
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
          <span> · Minimum sifariş: {formatAmount(unit, minQty, product.unit_size)}</span>
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
          Bu məhsul hazırda stokda yoxdur.
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
