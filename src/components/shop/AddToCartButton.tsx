"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addToCart } from "@/lib/cart/actions";
import type { ProductListItem } from "@/types/shop";
import { formatPrice, formatUnit, getDisplayPrice } from "@/lib/shop/format";

function useAddToCart() {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);

  function add(productId: string, quantity = 1) {
    startTransition(async () => {
      const result = await addToCart(productId, quantity);
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

  return { add, pending, added };
}

export function AddToCartButton({
  product,
  className = "",
}: {
  product: ProductListItem;
  className?: string;
}) {
  const { add, pending, added } = useAddToCart();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => add(product.id)}
      className={[
        "inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm transition hover:bg-emerald-500 disabled:opacity-60",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={`${product.title} səbətə əlavə et`}
    >
      {added ? "✓" : "+"}
    </button>
  );
}

export function AddToCartButtonLarge({
  product,
}: {
  product: ProductListItem;
}) {
  const { add, pending, added } = useAddToCart();
  const price = getDisplayPrice(product.final_price, product.farmer_price);

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => add(product.id)}
      className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60"
    >
      {added
        ? "Səbətə əlavə olundu"
        : `Səbətə əlavə et — ${formatPrice(price)}${formatUnit(product.unit_type)}`}
    </button>
  );
}
