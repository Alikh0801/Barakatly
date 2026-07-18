"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCartStore } from "@/store/cart";
import type { ProductDetail } from "@/types/shop";
import {
  formatPrice,
  formatUnit,
  getDisplayPrice,
  getProductImageUrl,
  unitLabel,
} from "@/lib/shop/format";

export function ProductPurchasePanel({ product }: { product: ProductDetail }) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const maxQty = Math.max(1, Number(product.quantity_available) || 1);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const price = getDisplayPrice(product.final_price, product.farmer_price);
  const lineTotal = price * quantity;
  const outOfStock = !product.in_stock || product.quantity_available <= 0;

  function cartPayload() {
    return {
      productId: product.id,
      title: product.title,
      price,
      unitType: product.unit_type,
      imageUrl: getProductImageUrl(product.product_images),
      farmerId: product.farmer?.id ?? "",
      farmerName: product.farmer?.farm_name ?? "Fermer",
    };
  }

  function handleAddToCart() {
    if (outOfStock) return;
    addItem(cartPayload(), quantity);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  function handleBuyNow() {
    if (outOfStock) return;
    addItem(cartPayload(), quantity);
    router.push("/checkout");
  }

  function decrease() {
    setQuantity((q) => Math.max(1, q - 1));
  }

  function increase() {
    setQuantity((q) => Math.min(maxQty, q + 1));
  }

  return (
    <div className="mt-8 space-y-5">
      <div>
        <div className="text-sm font-medium text-zinc-700">Say</div>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center rounded-xl bg-white ring-1 ring-zinc-200">
            <button
              type="button"
              onClick={decrease}
              disabled={outOfStock || quantity <= 1}
              className="h-11 w-11 text-lg font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Azalt"
            >
              −
            </button>
            <span className="min-w-10 text-center text-base font-semibold text-zinc-900">
              {quantity}
            </span>
            <button
              type="button"
              onClick={increase}
              disabled={outOfStock || quantity >= maxQty}
              className="h-11 w-11 text-lg font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Artır"
            >
              +
            </button>
          </div>
          <p className="text-sm text-zinc-500">
            Maksimum {product.quantity_available} {unitLabel(product.unit_type)}
          </p>
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-3">
        <div>
          <div className="text-sm text-zinc-500">Cəmi</div>
          <div className="mt-1 text-2xl font-semibold text-zinc-900">
            {formatPrice(lineTotal)}
          </div>
        </div>
        <div className="text-right text-sm text-zinc-500">
          {formatPrice(price)}
          {formatUnit(product.unit_type)}
        </div>
      </div>

      {outOfStock ? (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200">
          Bu məhsul hazırda stokda yoxdur.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={handleAddToCart}
            className="inline-flex w-full items-center justify-center rounded-xl bg-white px-4 py-3.5 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-200 transition hover:bg-emerald-50"
          >
            {added ? "Əlavə olundu" : "Səbətə at"}
          </button>
          <button
            type="button"
            onClick={handleBuyNow}
            className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
          >
            İndi al
          </button>
        </div>
      )}
    </div>
  );
}
