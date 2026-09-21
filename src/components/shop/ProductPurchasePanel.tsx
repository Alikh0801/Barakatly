"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addToCart } from "@/lib/cart/actions";
import type { ProductDetail } from "@/types/shop";
import { formatPrice, getDisplayPrice, unitLabel } from "@/lib/shop/format";

export function ProductPurchasePanel({ product }: { product: ProductDetail }) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const maxQty = Math.max(1, Number(product.quantity_available) || 1);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const price = getDisplayPrice(product.final_price, product.farmer_price);
  const lineTotal = price * quantity;
  const outOfStock = !product.in_stock || product.quantity_available <= 0;

  function handleAddToCart() {
    if (outOfStock) return;
    startTransition(async () => {
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
      const result = await addToCart(product.id, quantity);
      if (result.needsAuth) {
        router.push(`/signin?next=${encodeURIComponent("/checkout")}`);
        return;
      }
      if (result.ok) {
        router.push("/checkout");
      }
    });
  }

  function decrease() {
    setQuantity((q) => Math.max(1, q - 1));
  }

  function increase() {
    setQuantity((q) => Math.min(maxQty, q + 1));
  }

  return (
    <div className="mt-6 rounded-2xl bg-zinc-50 p-5 ring-1 ring-zinc-100">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Miqdar
        </span>
        <div className="inline-flex items-center rounded-xl bg-white ring-1 ring-zinc-200">
          <button
            type="button"
            onClick={decrease}
            disabled={outOfStock || quantity <= 1}
            className="h-10 w-10 text-lg font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Azalt"
          >
            −
          </button>
          <span className="min-w-9 text-center text-base font-semibold text-zinc-900">
            {quantity}
          </span>
          <button
            type="button"
            onClick={increase}
            disabled={outOfStock || quantity >= maxQty}
            className="h-10 w-10 text-lg font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Artır"
          >
            +
          </button>
        </div>
      </div>
      <p className="mt-1.5 text-sm text-zinc-500">
        {outOfStock
          ? "Stokda yoxdur"
          : `Anbarda ${product.quantity_available} ${unitLabel(product.unit_type)} qalıb`}
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
            className="inline-flex w-full items-center justify-center rounded-xl bg-white px-4 py-3.5 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-200 transition hover:bg-emerald-50 disabled:opacity-60"
          >
            {added ? "Əlavə olundu" : "Səbətə at"}
          </button>
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={pending}
            className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60"
          >
            İndi al
          </button>
        </div>
      )}
    </div>
  );
}
